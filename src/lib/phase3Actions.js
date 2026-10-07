// Phase 3 state transitions as pure functions: (game state, action) -> { patch, ...feedback }.
// `patch` is merged into the game state by the store (src/lib/gameStore.js); nothing here touches
// React or storage. The usePhase3Mission hook is a thin wrapper around these.

import { mission02 } from "@/data/phase3Missions";
import { initialMissionProgress } from "@/data/users";
import { getTruckContext, checkLoadCompatibility } from "./loadRules";
import { finishMission, calcAccuracy } from "./progression";
import { normalizeFilters, resetFilters } from "./loadFiltering";
import { advanceMission, evaluateShortlistAttempt } from "./phase3Engine";
import { getLoad } from "./loadSelectors";

const EMPTY_RUN = { ...initialMissionProgress, missionId: mission02.id };
const addUnique = (list, items) => [...new Set([...list, ...items])];

// Read the Phase 3 slice of the game state with safe defaults.
export function readBoard(state) {
  const checks = state.loadChecks ?? {};
  const shortlistedLoadIds = state.shortlistedLoadIds ?? [];
  return {
    run: state.missionRuns?.[mission02.id] ?? EMPTY_RUN,
    filters: normalizeFilters(state.loadFilters),
    board: { checks, shortlistedLoadIds },
    reviewedIds: state.reviewedLoadIds ?? [],
  };
}

// Persist the next board state and advance every mission task it satisfies, in order.
function commit(state, { filters, board, run, source, extra = {} }, ctx) {
  const cur = readBoard(state);
  const nextFilters = filters ?? cur.filters;
  const nextBoard = board ?? cur.board;
  const result = advanceMission({ run: run ?? cur.run, filters: nextFilters, board: nextBoard, xp: state.xp, source }, ctx);
  return {
    patch: {
      loadFilters: nextFilters,
      loadChecks: nextBoard.checks,
      shortlistedLoadIds: nextBoard.shortlistedLoadIds,
      xp: result.xp,
      missionRuns: { ...state.missionRuns, [mission02.id]: result.run },
      ...extra,
    },
    message: result.message,
    completed: result.completed,
    // filter-type actions replace the mission feedback even when it is empty; others only when new
    setFeedback: ["apply", "start", "reset"].includes(source) || Boolean(result.message),
  };
}

export function startMission(state, ctx = getTruckContext()) {
  const { run } = readBoard(state);
  if (run.started) return { patch: {}, completed: [] };
  return commit(state, { run: { ...run, missionId: mission02.id, started: true }, source: "start" }, ctx);
}

export const applyFilters = (state, next, ctx = getTruckContext()) =>
  commit(state, { filters: normalizeFilters(next), source: "apply" }, ctx);

export const resetBoardFilters = (state, ctx = getTruckContext()) => commit(state, { filters: resetFilters(), source: "reset" }, ctx);

export function selectLoad(state, loadId) {
  const { reviewedIds } = readBoard(state);
  return { patch: { selectedLoadId: loadId, reviewedLoadIds: addUnique(reviewedIds, [loadId]) }, actionFeedback: null, completed: [] };
}

// Student-initiated reveal of compatibility checks (the only way verdicts become visible).
export function revealChecks(state, loadId, codes, ctx = getTruckContext()) {
  const { board, reviewedIds } = readBoard(state);
  const checks = { ...board.checks, [loadId]: addUnique(board.checks[loadId] ?? [], codes) };
  return commit(state, { board: { ...board, checks }, source: "check", extra: { reviewedLoadIds: addUnique(reviewedIds, [loadId]) } }, ctx);
}

export function shortlistLoad(state, loadId, ctx = getTruckContext()) {
  const { run, board, reviewedIds } = readBoard(state);
  const load = getLoad(loadId);
  if (!load || board.shortlistedLoadIds.includes(loadId)) return { patch: {}, completed: [] };

  const attempt = evaluateShortlistAttempt(load, board.shortlistedLoadIds, ctx);
  if (!attempt.ok) {
    const failure = { tone: "error", text: attempt.message };
    if (attempt.reason === "full") return { patch: {}, actionFeedback: failure, completed: [] };

    // Incompatible: the explanation also uncovers those checks, and counts as an incorrect selection.
    const checks = { ...board.checks, [loadId]: addUnique(board.checks[loadId] ?? [], attempt.issues.map((i) => i.code)) };
    const nextRun = run.started ? { ...run, attempts: run.attempts + 1 } : run;
    const out = commit(state, { board: { ...board, checks }, run: nextRun, source: "check", extra: { reviewedLoadIds: addUnique(reviewedIds, [loadId]) } }, ctx);
    return { ...out, actionFeedback: failure };
  }

  const out = commit(state, { board: { ...board, shortlistedLoadIds: [...board.shortlistedLoadIds, loadId] }, source: "shortlist", extra: { reviewedLoadIds: addUnique(reviewedIds, [loadId]) } }, ctx);
  return { ...out, actionFeedback: { tone: "success", text: attempt.message } };
}

export function removeFromShortlist(state, loadId, ctx = getTruckContext()) {
  const { board } = readBoard(state);
  const out = commit(state, { board: { ...board, shortlistedLoadIds: board.shortlistedLoadIds.filter((id) => id !== loadId) }, source: "shortlist" }, ctx);
  return { ...out, actionFeedback: { tone: "success", text: mission02.feedback.shortlistRemoved } };
}

export function takeHint(state) {
  const { run } = readBoard(state);
  const task = run.completed ? null : mission02.tasks[run.currentTask];
  if (!task) return { patch: {}, completed: [] };
  return {
    patch: { missionRuns: { ...state.missionRuns, [mission02.id]: { ...run, hintsUsed: run.hintsUsed + 1 } } },
    hint: task.hint,
    completed: [],
  };
}

// ---- Mission completion -------------------------------------------------------------------

// Summary shown on the "Load Search Complete" screen.
export function getPhase3Summary(state, ctx = getTruckContext()) {
  const { run, board, reviewedIds } = readBoard(state);
  return {
    loadsReviewed: reviewedIds.length,
    compatibleFound: reviewedIds.filter((id) => checkLoadCompatibility(getLoad(id), ctx).compatible).length,
    shortlisted: board.shortlistedLoadIds.length,
    incorrect: run.attempts,
    hintsUsed: run.hintsUsed,
    accuracy: calcAccuracy(mission02.tasks.length, run.attempts),
    xp: run.xpEarned,
    stars: run.starsEarned,
  };
}

// Complete the mission once every task is done: rewards, stars and the Level 3 unlock.
export function completePhase3(state) {
  const { run } = readBoard(state);
  const allDone = run.completedTasks.length >= mission02.tasks.length;
  if (!run.started || run.completed || !allDone) return { patch: {}, completed: false };
  const { stars, patch } = finishMission(state, {
    missionId: mission02.id,
    levelId: mission02.levelId,
    tasksTotal: mission02.tasks.length,
    attempts: run.attempts,
    hintsUsed: run.hintsUsed,
  });
  return {
    patch: { ...patch, missionRuns: { ...state.missionRuns, [mission02.id]: { ...run, completed: true, starsEarned: stars } } },
    completed: true,
  };
}
