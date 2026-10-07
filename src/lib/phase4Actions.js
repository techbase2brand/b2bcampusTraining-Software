// Phase 4 (Load Analysis & Matching) state transitions as pure functions:
// (game state, action) -> { patch, message, ... }. The patch is merged by the game store.
// The answer key is derived from the student's shortlist via loadMatching.js; no IDs are stored.

import { mission03, questionFeedback } from "@/data/phase4Missions";
import { taskXp } from "@/data/rewards";
import { initialMissionProgress } from "@/data/users";
import { getTruckContext } from "./loadRules";
import { analyzeLoad } from "./loadCalculations";
import { getLoad } from "./loadSelectors";
import { scoreLoads, getDecisionBand, getWeakMetrics, resolveQuestionAnswer, evaluateDecisionReasons } from "./loadMatching";
import { formatMetric } from "./analysisFormat";
import { finishMission, calcAccuracy } from "./progression";
import { fillTemplate } from "./text";

const EMPTY_RUN = { ...initialMissionProgress, missionId: mission03.id, wrongByTask: {}, decision: null };
const addUnique = (list, items) => [...new Set([...list, ...items])];
const metricFormat = (metric) => mission03.comparisonMetrics.find((m) => m.key === metric)?.format;

// Read the Phase 4 slice of the game state. Analyses are computed from the shortlist IDs.
export function readAnalysis(state, ctx = getTruckContext()) {
  const shortlistedIds = state.shortlistedLoadIds ?? [];
  return {
    run: { ...EMPTY_RUN, ...(state.missionRuns?.[mission03.id] ?? {}) },
    shortlistedIds,
    analyses: shortlistedIds.map(getLoad).filter(Boolean).map((l) => analyzeLoad(l, ctx)),
    viewedIds: state.analysisViewedLoadIds ?? [],
    selectedBestLoadId: state.selectedBestLoadId ?? null,
    reasonIds: state.decisionReasonIds ?? [],
  };
}

const refOf = (id) => getLoad(id)?.referenceNumber ?? id;
const currentTask = (run) => (run.completed ? null : mission03.tasks[run.currentTask] ?? null);

function award(state, run, task) {
  const gained = taskXp[task.id] ?? 0;
  return {
    xp: state.xp + gained,
    run: { ...run, completedTasks: [...run.completedTasks, task.id], currentTask: run.currentTask + 1, xpEarned: run.xpEarned + gained },
  };
}

// Complete every non-question task the current state satisfies (reviewing the shortlist, an
// accepted decision). Question tasks only complete through answerQuestion.
function advance(state, run, ctx, viewedIds) {
  const { analyses } = readAnalysis(state, ctx);
  let cur = run;
  let xp = state.xp;
  const completed = [];
  while (cur.started && !cur.completed) {
    const task = mission03.tasks[cur.currentTask];
    if (!task) break;
    let done = false;
    if (task.rule?.type === "view-all-shortlisted") done = analyses.length > 0 && analyses.every((a) => viewedIds.includes(a.loadId));
    else if (task.rule?.type === "select-best") done = Boolean(cur.decision?.accepted);
    if (!done) break;
    const next = award({ ...state, xp }, cur, task);
    cur = next.run;
    xp = next.xp;
    completed.push(task.id);
  }
  return { run: cur, xp, completed };
}

const withRun = (state, run) => ({ ...state.missionRuns, [mission03.id]: run });

export function startAnalysis(state, ctx = getTruckContext()) {
  const { run, viewedIds } = readAnalysis(state, ctx);
  if (run.started) return { patch: {}, completed: [] };
  const started = { ...run, started: true };
  const res = advance(state, started, ctx, viewedIds);
  return { patch: { xp: res.xp, missionRuns: withRun(state, res.run) }, completed: res.completed, message: res.completed.length ? { tone: "success", text: mission03.trainerLines.intro } : { tone: "hint", text: mission03.trainerLines.intro } };
}

// The student opened a shortlisted load in the comparison / details panel.
export function viewLoad(state, loadId, ctx = getTruckContext()) {
  const { run, viewedIds } = readAnalysis(state, ctx);
  const nextViewed = addUnique(viewedIds, [loadId]);
  const res = advance(state, run, ctx, nextViewed);
  const done = res.completed.includes("review-shortlist");
  return {
    patch: { analysisViewedLoadIds: nextViewed, xp: res.xp, missionRuns: withRun(state, res.run) },
    completed: res.completed,
    message: done ? { tone: "success", text: "You reviewed every shortlisted load. Now compare them on the numbers." } : undefined,
  };
}

// Answer choices for the current question task, built from the student's own shortlist.
export function getQuestionChoices(task, analyses) {
  const q = task?.question;
  if (!q) return [];
  if (q.kind === "pick-load") return analyses.map((a) => ({ value: a.loadId, label: refOf(a.loadId) }));
  const target = analyses[0];
  if (!target) return [];
  const values = [...new Set([target.totalMiles, target.loadedMiles, target.deadheadMiles])].sort((a, b) => a - b);
  return values.map((v) => ({ value: v, label: formatMetric("miles", v) }));
}

export function getQuestionTarget(task, analyses) {
  return task?.question?.kind === "value" ? analyses[0]?.loadId ?? null : null;
}

export function answerQuestion(state, answer, ctx = getTruckContext()) {
  const { run, analyses } = readAnalysis(state, ctx);
  const task = currentTask(run);
  if (!run.started || !task?.question) return { patch: {}, completed: [] };

  const q = task.question;
  const key = resolveQuestionAnswer(q, analyses, getQuestionTarget(task, analyses));
  const correct = q.kind === "value" ? Math.round(Number(answer)) === Math.round(key.value) : key.loadIds.includes(answer);
  const copy = questionFeedback[q.metric];

  if (!correct) {
    const wrongByTask = { ...run.wrongByTask, [task.id]: (run.wrongByTask[task.id] ?? 0) + 1 };
    return {
      patch: { missionRuns: withRun(state, { ...run, attempts: run.attempts + 1, wrongByTask }) },
      message: { tone: "error", text: copy.wrong },
      completed: [],
    };
  }
  const next = award(state, run, task);
  const text = fillTemplate(copy.correct, { ref: key.loadIds.map(refOf).join(" / "), value: formatMetric(metricFormat(q.metric), key.value) });
  return { patch: { xp: next.xp, missionRuns: withRun(state, next.run) }, message: { tone: "success", text }, completed: [task.id] };
}

// Student picked a load as their best candidate (after confirming). Only valid on the final task.
export function chooseBest(state, loadId, ctx = getTruckContext()) {
  const { run, analyses } = readAnalysis(state, ctx);
  const task = currentTask(run);
  if (!run.started || task?.rule?.type !== "select-best" || !analyses.some((a) => a.loadId === loadId)) return { patch: {}, completed: [] };
  return { patch: { selectedBestLoadId: loadId, decisionReasonIds: [], missionRuns: withRun(state, { ...run, decision: null }) }, completed: [] };
}

export function compareAgain(state) {
  const { run } = readAnalysis(state);
  return { patch: { selectedBestLoadId: null, decisionReasonIds: [], missionRuns: withRun(state, { ...run, decision: null }) }, completed: [] };
}

// Evaluate the chosen load and the student's reasons.
export function submitDecision(state, reasonIds, ctx = getTruckContext()) {
  const { run, analyses, selectedBestLoadId, viewedIds } = readAnalysis(state, ctx);
  const task = currentTask(run);
  if (!run.started || task?.rule?.type !== "select-best" || !selectedBestLoadId) return { patch: {}, completed: [] };

  const fb = mission03.feedback;
  const band = getDecisionBand(selectedBestLoadId, analyses);
  const reasons = evaluateDecisionReasons(selectedBestLoadId, reasonIds, analyses, mission03.decisionReasons);
  const label = (id) => mission03.decisionReasons.find((r) => r.id === id)?.label ?? id;
  const wrongByTask = { ...run.wrongByTask };
  const reject = (message, selectionCleared) => {
    wrongByTask[task.id] = (wrongByTask[task.id] ?? 0) + 1;
    const nextRun = { ...run, attempts: run.attempts + 1, wrongByTask, decision: { accepted: false, band } };
    return {
      patch: { decisionReasonIds: reasonIds, ...(selectionCleared ? { selectedBestLoadId: null } : {}), missionRuns: withRun(state, nextRun) },
      message,
      completed: [],
      outcome: { accepted: false, band },
    };
  };

  if (band === "review") {
    const top = scoreLoads(analyses)[0]?.loadId;
    const text = fillTemplate(fb.review.text, { betterLoad: refOf(top), weakMetrics: getWeakMetrics(selectedBestLoadId, analyses).join(", ") || "the key factors" });
    return reject({ tone: "error", title: fb.review.title, text }, true);
  }
  const tested = reasonIds.filter((id) => !mission03.decisionReasons.find((r) => r.id === id)?.informational);
  if (tested.length === 0) return { patch: { decisionReasonIds: reasonIds }, message: { tone: "hint", text: fb.reasonsHelp }, completed: [] };
  if (reasons.unsupported.length) {
    return reject({ tone: "error", text: fillTemplate(fb.reasonMismatch, { reasons: reasons.unsupported.map(label).join(", ") }) }, false);
  }

  const accepted = { accepted: true, band, loadId: selectedBestLoadId, reasonIds };
  const res = advance(state, { ...run, decision: accepted }, ctx, viewedIds);
  const copy = band === "strong" ? fb.strongMatch : fb.acceptable;
  return {
    patch: { decisionReasonIds: reasonIds, xp: res.xp, missionRuns: withRun(state, res.run) },
    message: { tone: "success", title: copy.title, text: copy.text },
    completed: res.completed,
    outcome: { accepted: true, band },
  };
}

export function takeHint(state, ctx = getTruckContext()) {
  const { run } = readAnalysis(state, ctx);
  const task = currentTask(run);
  if (!task) return { patch: {}, completed: [] };
  return { patch: { missionRuns: withRun(state, { ...run, hintsUsed: run.hintsUsed + 1 }) }, hint: task.hint, completed: [] };
}

// ---- Completion ---------------------------------------------------------------------------

const tries = (n) => (n ? `${n + 1} tries` : "First try");

export function getPhase4Summary(state, ctx = getTruckContext()) {
  const { run, analyses } = readAnalysis(state, ctx);
  const band = run.decision?.band;
  return {
    loadsCompared: analyses.length,
    accuracy: calcAccuracy(mission03.tasks.length, run.attempts),
    deadheadAwareness: tries(run.wrongByTask["lowest-deadhead"] ?? 0),
    rpmUnderstanding: tries(run.wrongByTask["analyze-rpm"] ?? 0),
    profitabilityDecision: tries(run.wrongByTask["compare-profit"] ?? 0),
    decisionQuality: band === "strong" ? "Strong match" : band === "acceptable" ? "Acceptable match" : "-",
    hintsUsed: run.hintsUsed,
    xp: run.xpEarned,
    stars: run.starsEarned,
  };
}

export function completePhase4(state) {
  const { run } = readAnalysis(state);
  if (!run.started || run.completed || run.completedTasks.length < mission03.tasks.length) return { patch: {}, completed: false };
  const { stars, patch } = finishMission(state, {
    missionId: mission03.id,
    levelId: mission03.levelId,
    tasksTotal: mission03.tasks.length,
    attempts: run.attempts,
    hintsUsed: run.hintsUsed,
  });
  return { patch: { ...patch, missionRuns: withRun(state, { ...run, completed: true, starsEarned: stars }) }, completed: true };
}
