// Mission 4 (Broker Calling & Communication) state transitions as pure functions:
// (game state, action) -> { patch, message, ... }. The patch is merged by the game store.
// The selected load comes from selectedBestLoadId (Phase 4); nothing here names a load.
// Persisted: IDs and primitives only (messages are plain text lines).

import { mission04 } from "@/data/phase5Missions";
import { commsTopics, helperSuggestions, callScript } from "@/data/brokerComms";
import { taskXp } from "@/data/rewards";
import { initialMissionProgress } from "@/data/users";
import { getTruckContext } from "./loadRules";
import { getBroker } from "./loadSelectors";
import { fillTemplate, formatCurrency } from "./text";
import { finishMission, calcAccuracy } from "./progression";
import {
  getCommsContext,
  detectTopics,
  isAccept,
  isNegotiateAsk,
  isGreeting,
  parseAmounts,
  evaluateMessage,
  topicReplies,
  greetingFor,
  fallbackReply,
  getSuggestedQuestions,
} from "./brokerChat";
import { isFinalized, leaveAttemptPatch } from "./practiceAttempts";
import { initialNegotiation, respondToRequest, acceptOffer, getMarketRange, suggestedAsk } from "./brokerNegotiation";

const EMPTY_RUN = { ...initialMissionProgress, missionId: mission04.id };
const FRESH = {
  selectedBrokerId: null,
  detailsReviewed: false,
  coveredTopics: [],
  messages: [],
  negotiation: initialNegotiation,
  callNotes: [],
  mode: null,
  confirmed: false,
  stats: { sent: 0, professional: 0 },
};
const addUnique = (list, items) => [...new Set([...list, ...items])];
const REQUIRED = commsTopics.map((t) => t.id);

// Read the Mission 4 slice. The attempt fields describe ONE practice attempt (for the current
// candidate load). If they belong to another load (older saves), the attempt starts fresh. The run
// (started, completedTasks, XP) is a ledger that survives every attempt; only its task pointer
// (currentTask) follows the attempt, so guidance restarts without re-awarding anything.
export function readComms(state, ctx = getTruckContext()) {
  const cc = getCommsContext(state, ctx);
  const stored = { ...EMPTY_RUN, ...(state.missionRuns?.[mission04.id] ?? {}) };
  // Nothing exists before Start Mission: no selected broker, no messages. Stale saved values from an
  // earlier session are ignored, so the correct broker is never pre-selected or revealed.
  const own = Boolean(cc) && (state.commsLoadId == null || state.commsLoadId === state.selectedBestLoadId) && stored.started;
  const comms = own
    ? {
        selectedBrokerId: state.selectedBrokerId ?? null,
        detailsReviewed: Boolean(state.detailsReviewed),
        coveredTopics: state.coveredTopics ?? [],
        messages: state.commsMessages ?? [],
        negotiation: { ...initialNegotiation, ...(state.negotiation ?? {}) },
        callNotes: state.callNotes ?? [],
        mode: state.communicationMode ?? null,
        confirmed: Boolean(state.brokerConfirmed),
        stats: state.commsStats ?? FRESH.stats,
      }
    : FRESH;
  const run = own || stored.completed ? stored : { ...stored, currentTask: 0 };
  return { cc, comms, run, finalized: isFinalized(state), savedBrokerIds: state.savedBrokerIds ?? [], recentBrokerIds: state.recentBrokerIds ?? [] };
}

const currentTask = (run) => (run.completed ? null : mission04.tasks[run.currentTask] ?? null);

function taskDone(rule, comms, cc) {
  switch (rule.type) {
    case "select-broker":
      return comms.selectedBrokerId === cc.broker.id;
    case "review-details":
      return comms.detailsReviewed;
    case "topics":
      return rule.topics.every((t) => comms.coveredTopics.includes(t));
    case "negotiation-attempt":
      return comms.negotiation.attempts - comms.negotiation.extremeCount >= 1; // extreme asks do not count
    case "agreement-confirmed":
      return comms.confirmed && comms.negotiation.status === "agreed";
    default:
      return false;
  }
}

// Complete every task the current state satisfies, in order. XP is awarded once per task.
function advance(comms, run, xp, cc) {
  let cur = run;
  let totalXp = xp;
  const completed = [];
  while (cur.started && !cur.completed) {
    const task = mission04.tasks[cur.currentTask];
    if (!task || !taskDone(task.rule, comms, cc)) break;
    // A task is rewarded once, ever. A later practice attempt walks the same tasks without XP.
    const first = !cur.completedTasks.includes(task.id);
    const gained = first ? taskXp[task.id] ?? 0 : 0;
    totalXp += gained;
    cur = { ...cur, completedTasks: first ? [...cur.completedTasks, task.id] : cur.completedTasks, currentTask: cur.currentTask + 1, xpEarned: cur.xpEarned + gained };
    if (first) completed.push(task.id);
  }
  return { run: cur, xp: totalXp, completed };
}

// Persist the whole Mission 4 slice and advance the mission.
function commit(state, ctx, { comms, run, extra = {} }) {
  const { cc } = readComms(state, ctx);
  const res = advance(comms, run, state.xp, cc);
  const last = res.completed.at(-1);
  const lastTask = last && mission04.tasks.find((t) => t.id === last);
  let message;
  if (res.completed.length) {
    message = { tone: "success", text: fillTemplate(mission04.feedback.taskDone, { title: lastTask.title }) };
  }
  return {
    patch: {
      commsLoadId: cc.load.id,
      selectedBrokerId: comms.selectedBrokerId,
      detailsReviewed: comms.detailsReviewed,
      coveredTopics: comms.coveredTopics,
      commsMessages: comms.messages,
      negotiation: comms.negotiation,
      callNotes: comms.callNotes,
      communicationMode: comms.mode,
      brokerConfirmed: comms.confirmed,
      commsStats: comms.stats,
      xp: res.xp,
      missionRuns: { ...state.missionRuns, [mission04.id]: res.run },
      ...extra,
    },
    message,
    completed: res.completed,
  };
}

const noop = (message) => ({ patch: {}, message, completed: [] });

export function startMission(state, ctx = getTruckContext()) {
  const { cc, comms, run } = readComms(state, ctx);
  if (!cc || run.started) return noop();
  return commit(state, ctx, { comms, run: { ...run, missionId: mission04.id, started: true } });
}

// ---- Broker list --------------------------------------------------------------------------

export function selectBroker(state, brokerId, ctx = getTruckContext()) {
  const { cc, comms, run, recentBrokerIds, finalized } = readComms(state, ctx);
  if (!cc || finalized) return noop();
  // Before Start Mission a broker click does nothing: no validation, no "Correct", no reveal.
  if (!run.started) return noop({ tone: "hint", text: mission04.feedback.startFirst });
  const extra = { recentBrokerIds: addUnique([brokerId], recentBrokerIds).slice(0, 5) };

  if (brokerId !== cc.broker.id) {
    // Wrong broker: educational feedback, counted as an incorrect attempt once the mission runs.
    const nextRun = run.started ? { ...run, attempts: run.attempts + 1 } : run;
    const out = commit(state, ctx, { comms, run: nextRun, extra });
    return { ...out, message: { tone: "error", text: fillTemplate(mission04.feedback.wrongBroker, { broker: pickName(brokerId) ?? "That broker" }) }, wrong: true };
  }
  const messages = comms.messages.length ? comms.messages : [{ from: "broker", channel: "chat", text: greetingFor(cc.broker, cc.vars) }];
  const next = { ...comms, selectedBrokerId: brokerId, messages };
  const out = commit(state, ctx, { comms: next, run, extra });
  return { ...out, message: { tone: "success", text: fillTemplate(mission04.feedback.correctBroker, { broker: cc.broker.name, ref: cc.load.referenceNumber }) } };
}

const pickName = (id) => getBroker(id)?.name;

export function toggleSavedBroker(state, brokerId) {
  const saved = state.savedBrokerIds ?? [];
  return { patch: { savedBrokerIds: saved.includes(brokerId) ? saved.filter((id) => id !== brokerId) : [...saved, brokerId] }, completed: [] };
}

export function reviewDetails(state, ctx = getTruckContext()) {
  const { cc, comms, run } = readComms(state, ctx);
  if (!cc || comms.detailsReviewed) return noop();
  const out = commit(state, ctx, { comms: { ...comms, detailsReviewed: true }, run });
  return { ...out, message: out.completed.includes("review-load-details") ? { tone: "success", text: mission04.feedback.detailsReviewed } : out.message };
}

// ---- Messaging ----------------------------------------------------------------------------

// A student message (typed or from a suggestion button). `channel` is "chat" or "call".
// Returns { patch, message, coach, completed, broker: [reply lines] }.
export function sendMessage(state, text, channel = "chat", ctx = getTruckContext()) {
  const { cc, comms, run, finalized } = readComms(state, ctx);
  const clean = (text ?? "").trim();
  if (!cc || !clean || finalized) return noop();
  if (comms.selectedBrokerId !== cc.broker.id) return noop({ tone: "hint", text: mission04.feedback.needBroker });

  const { load, broker, analysis, vars } = cc;
  const topics = detectTopics(clean);
  const amounts = parseAmounts(clean, load.rate);
  const accepting = isAccept(clean) && (amounts.length === 0 || amounts.includes(comms.negotiation.counter));
  const negotiating = !accepting && (amounts.length > 0 || isNegotiateAsk(clean));

  let negotiation = comms.negotiation;
  let lines = topicReplies(
    topics.filter((t) => !(negotiating && t === "rate")),
    vars,
    { flexible: /firm|flexib|room/i.test(clean) && !negotiating, hasRequirements: load.specialRequirements.length > 0 },
  );
  let extreme = false;

  if (accepting) {
    const res = acceptOffer({ negotiation, load });
    negotiation = res.negotiation;
    lines = [...lines, ...res.replies];
  } else if (negotiating) {
    const res = respondToRequest({ amount: amounts[0] ?? null, text: clean, negotiation, load, analysis, broker });
    negotiation = res.negotiation;
    extreme = res.extreme;
    lines = [...lines, ...res.replies];
  }
  if (lines.length === 0) lines = [isGreeting(clean) ? greetingFor(broker, vars) : fallbackReply()];

  const covered = addUnique(comms.coveredTopics, [...topics, ...(negotiating ? ["rate"] : [])]);
  const quality = evaluateMessage(clean, vars, { first: comms.stats.sent === 0 });
  const mode = comms.mode && comms.mode !== channel ? "both" : channel;
  const next = {
    ...comms,
    coveredTopics: covered,
    negotiation,
    mode,
    messages: [...comms.messages, { from: "student", channel, text: clean }, ...lines.map((l) => ({ from: "broker", channel, text: l }))],
    stats: { sent: comms.stats.sent + 1, professional: comms.stats.professional + (quality.professional ? 1 : 0) },
  };
  const nextRun = extreme && run.started ? { ...run, attempts: run.attempts + 1 } : run;
  const out = commit(state, ctx, { comms: next, run: nextRun });
  return {
    ...out,
    message: extreme ? { tone: "error", text: mission04.feedback.extremeAsk } : out.message,
    coach: quality.tip,
    broker: lines,
  };
}

// ---- Call ---------------------------------------------------------------------------------

// The call connected: the broker greets the student on the call channel.
export function connectCall(state, ctx = getTruckContext()) {
  const { cc, comms, run } = readComms(state, ctx);
  if (!cc || comms.selectedBrokerId !== cc.broker.id) return noop({ tone: "hint", text: mission04.feedback.needBroker });
  const greeting = { from: "broker", channel: "call", text: greetingFor(cc.broker, cc.vars) };
  const mode = comms.mode && comms.mode !== "call" ? "both" : "call";
  return commit(state, ctx, { comms: { ...comms, mode, messages: [...comms.messages, greeting] }, run });
}

export function endCall(state, ctx = getTruckContext()) {
  const { cc, comms, run } = readComms(state, ctx);
  if (!cc) return noop();
  return commit(state, ctx, { comms: { ...comms, messages: [...comms.messages, { from: "system", channel: "call", text: callScript.endedLine }] }, run });
}

// ---- Call notes ---------------------------------------------------------------------------

// Notes built from what has actually been discussed.
export function buildNotes(comms, cc) {
  const { vars } = cc;
  const has = (t) => comms.coveredTopics.includes(t);
  const notes = [];
  if (has("availability")) notes.push(`Confirmed load ${vars.ref} is available.`);
  if (has("rate")) notes.push(`Initial rate: ${vars.rate}.`);
  if (has("pickup")) notes.push(`Pickup: ${vars.pickupDay}, ${vars.pickupTime} in ${vars.origin}.`);
  if (has("delivery")) notes.push(`Delivery: ${vars.deliveryDay}, ${vars.deliveryTime} in ${vars.destination}.`);
  if (has("detention")) notes.push(`Detention: ${vars.detention}.`);
  if (has("appointment")) notes.push(`Appointment: ${vars.appointment}.`);
  if (comms.negotiation.counter != null && comms.negotiation.status !== "agreed") notes.push(`Broker counteroffer: ${formatCurrency(comms.negotiation.counter)}.`);
  if (comms.negotiation.status === "agreed") notes.push(`Final agreed rate: ${formatCurrency(comms.negotiation.agreedRate)}.`);
  return notes;
}

export function saveNotes(state, ctx = getTruckContext()) {
  const { cc, comms } = readComms(state, ctx);
  if (!cc) return noop();
  return { patch: { commsLoadId: cc.load.id, callNotes: buildNotes(comms, cc) }, completed: [] };
}

// ---- Agreement ----------------------------------------------------------------------------

export function confirmAgreement(state, ctx = getTruckContext()) {
  const { cc, comms, run } = readComms(state, ctx);
  if (!cc) return noop();
  const fb = mission04.feedback;
  if (comms.negotiation.status !== "agreed") return noop({ tone: "hint", text: fb.notAgreed });
  if (comms.negotiation.attempts - comms.negotiation.extremeCount < 1) return noop({ tone: "hint", text: fb.needNegotiate });
  const next = { ...comms, confirmed: true, callNotes: buildNotes(comms, cc) };
  const out = commit(state, ctx, { comms: next, run });
  return { ...out, message: { tone: "success", text: fb.agreementConfirmed } };
}

// ---- Helpers shown to the student ---------------------------------------------------------

export function getHelper(state, ctx = getTruckContext()) {
  const { cc, comms } = readComms(state, ctx);
  if (!cc) return null;
  const { load, analysis, vars } = cc;
  const ask = suggestedAsk(load.rate);
  const hv = { ...vars, amount: formatCurrency(ask) };
  const suggestions = helperSuggestions
    .filter((s) => s.requires !== "deadhead" || analysis.deadheadMiles >= 25)
    .map((s) => ({ id: s.id, label: s.label, text: fillTemplate(s.text, hv) }));
  const range = getMarketRange(load.rate);
  const insights = [
    ["Posted rate", formatCurrency(load.rate)],
    ["Loaded miles", `${load.loadedMiles.toLocaleString("en-US")} mi`],
    ["Deadhead", `${analysis.deadheadMiles} mi`],
    ["Effective RPM", `$${analysis.allInRpm.toFixed(2)}/mi`],
    ["Training range", `${formatCurrency(range.low)} - ${formatCurrency(range.high)}`],
  ];
  return { suggestions, insights, questions: getSuggestedQuestions(vars), negotiationStatus: comms.negotiation.status };
}

// "Suggest a message": a deterministic next-step message (training assistance, not a live AI).
export function aiSuggestion(state, ctx = getTruckContext()) {
  const { cc, comms } = readComms(state, ctx);
  if (!cc) return null;
  const helper = getHelper(state, ctx);
  const missing = REQUIRED.find((t) => !comms.coveredTopics.includes(t));
  if (missing) return helper.questions.find((q) => q.id === missing)?.text ?? null;
  if (comms.negotiation.status !== "agreed") return (helper.suggestions.find((s) => s.id === "deadhead") ?? helper.suggestions.find((s) => s.id === "amount"))?.text ?? null;
  return fillTemplate("Thanks {contact}, that works for me. Let's go with that rate on {ref}.", cc.vars);
}

export function getLoadStatus(comms) {
  const s = mission04.statuses;
  if (comms.negotiation.status === "agreed") return s.agreed;
  if (comms.negotiation.attempts > 0) return s.negotiation;
  if (comms.selectedBrokerId) return s.review;
  return s.available;
}

// Live state of the five workflow cards.
export function getWorkflow(comms, run) {
  const done = (id) => run.completedTasks.includes(id);
  const flags = [
    Boolean(comms.selectedBrokerId),
    done("confirm-availability") && done("verify-requirements") && done("ask-rate-terms"),
    done("negotiate-rate"),
    done("confirm-agreement"),
    run.completed,
  ];
  const firstOpen = flags.findIndex((f) => !f);
  return flags.map((f, i) => (f ? "done" : i === firstOpen ? "current" : "pending"));
}

export function getAgentLine(run) {
  const m = mission04.agentMessages;
  if (!run.started) return mission04.agentMessages.beforeStart;
  if (run.completed) return m.done;
  const task = currentTask(run);
  return task ? [m.start, m.details, m.communicate, m.negotiate, m.agreement][task.step] : m.done;
}

export function takeHint(state, ctx = getTruckContext()) {
  const { cc, run } = readComms(state, ctx);
  const task = currentTask(run);
  if (!cc || !task) return noop();
  return { patch: { missionRuns: { ...state.missionRuns, [mission04.id]: { ...run, hintsUsed: run.hintsUsed + 1 } } }, hint: task.hint, completed: [] };
}

// ---- Completion ---------------------------------------------------------------------------

export function getSummary(state, ctx = getTruckContext()) {
  const { cc, comms, run } = readComms(state, ctx);
  const posted = cc.load.rate;
  const agreed = comms.negotiation.agreedRate ?? posted;
  const { sent, professional } = comms.stats;
  return {
    broker: cc.broker.name,
    questionsVerified: `${comms.coveredTopics.length} / ${REQUIRED.length}`,
    negotiationAttempts: comms.negotiation.attempts,
    agreedRate: agreed,
    rateImprovement: agreed - posted,
    communicationAccuracy: sent ? Math.round((professional / sent) * 100) : 0,
    accuracy: calcAccuracy(mission04.tasks.length, run.attempts),
    hintsUsed: run.hintsUsed,
    xp: run.xpEarned,
    stars: run.starsEarned,
  };
}

// ---- Practice: keep a deal or try another load ---------------------------------------------

// KEEP THIS DEAL / FINALIZE LOAD: the only action that commits the mission result. Dispatch and
// Tracking read negotiatedLoadId / agreedRate, which nothing else ever writes.
export function finalizeLoad(state, ctx = getTruckContext()) {
  const { cc, comms, run, finalized } = readComms(state, ctx);
  if (!cc || !run.started || finalized) return noop();
  if (comms.negotiation.status !== "agreed" || !comms.confirmed) return noop({ tone: "hint", text: mission04.feedback.notAgreed });
  return {
    patch: {
      negotiatedLoadId: cc.load.id,
      agreedRate: comms.negotiation.agreedRate,
      loadFinalized: true,
      finalizedBrokerId: cc.broker.id,
      finalDecisionReasonIds: state.decisionReasonIds ?? [],
    },
    message: { tone: "success", text: mission04.feedback.finalized },
    completed: [],
  };
}

// TRY ANOTHER LOAD: archives this attempt (IDs and result only) and clears the candidate so Load
// Analysis can pick another. XP, completed tasks and hints stay exactly as they were.
export function tryAnotherLoad(state, ctx = getTruckContext()) {
  const { cc, finalized } = readComms(state, ctx);
  if (!cc || finalized) return noop();
  return { patch: { ...leaveAttemptPatch(state), selectedBestLoadId: null, decisionReasonIds: [], candidateDecision: null }, completed: [] };
}

export function completeMission(state, ctx = getTruckContext()) {
  const { cc, run, finalized } = readComms(state, ctx);
  // A mission result needs a finalized load as well as every task done.
  if (!cc || !run.started || run.completed || !finalized || run.completedTasks.length < mission04.tasks.length) return { patch: {}, completed: false };
  const { stars, patch } = finishMission(state, {
    missionId: mission04.id,
    levelId: mission04.levelId,
    tasksTotal: mission04.tasks.length,
    attempts: run.attempts,
    hintsUsed: run.hintsUsed,
  });
  return { patch: { ...patch, missionRuns: { ...state.missionRuns, [mission04.id]: { ...run, completed: true, starsEarned: stars } } }, completed: true };
}
