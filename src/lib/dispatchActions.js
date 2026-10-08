// Phase 6 (Driver Communication + Load Assignment) state transitions as pure functions:
// (game state, action) -> { patch, message, ... }. The patch is merged by the game store.
// The negotiated load (selectedBestLoadId / agreedRate from Mission 4) drives everything; nothing
// here names a load or a driver. Persisted: IDs and primitives (messages are plain text lines).
//
// Load status flow: negotiated -> ready-for-assignment (driver selected) -> assigned (dispatch sent)
// -> driver-confirmed (driver accepted) -> ready-for-pickup (assignment confirmed). It stops there:
// tracking belongs to Phase 7.

import { isDriverAvailableForDispatch, isTruckAvailableForDispatch, dispatchHoldingDriver } from "./dispatchAvailability";
import { mission05 } from "@/data/phase6Missions";
import { assignmentStatuses, dispatchSheetFields, driverTopics } from "@/data/dispatchComms";
import { callScript } from "@/data/brokerComms";
import { simulationConfig } from "@/data/simulationConfig";
import { taskXp } from "@/data/rewards";
import { initialMissionProgress } from "@/data/users";
import { getRosterEntry } from "./dispatchRoster";
import { evaluateDriver } from "./driverRules";
import {
  getNegotiatedLoad,
  buildVars,
  requiredTopicsFor,
  detectDriverTopics,
  driverReplyLines,
  driverGreeting,
  driverFallback,
  clarificationFor,
  getDriverSuggestions,
  resolveDriverReaction,
  acceptedLine,
  declinedLine,
} from "./driverChat";
import { finishMission, calcAccuracy } from "./progression";
import { fillTemplate, formatCurrency, formatDuration, formatSimDay, formatSimClock, formatSimTime, parseSimTime } from "./text";

const EMPTY_RUN = { ...initialMissionProgress, missionId: mission05.id };
const FRESH = {
  loadReviewed: false,
  viewedDriverIds: [],
  selectedDriverId: null,
  driverChecks: {},
  topics: [],
  messages: [],
  notes: [],
  mode: null,
  dispatchReviewed: false,
  dispatchSent: false,
  response: "none",
  ask: null,
  assigned: false,
  assignmentTime: null,
};
const addUnique = (list, items) => [...new Set([...list, ...items])];
const fb = mission05.feedback;

// Read the Phase 6 slice. Before Start Mission (or if the saved data belongs to a different load)
// nothing exists: no selected driver, no messages, so nothing is revealed early.
export function readDispatch(state) {
  const neg = getNegotiatedLoad(state);
  const stored = { ...EMPTY_RUN, ...(state.missionRuns?.[mission05.id] ?? {}) };
  const own = Boolean(neg) && state.dispatchLoadId === neg.load.id && stored.started;
  const d = own
    ? {
        loadReviewed: Boolean(state.loadReviewed),
        viewedDriverIds: state.viewedDriverIds ?? [],
        selectedDriverId: state.selectedDriverId ?? null,
        driverChecks: state.driverChecks ?? {},
        topics: state.driverTopics ?? [],
        messages: state.driverMessages ?? [],
        notes: state.driverCallNotes ?? [],
        mode: state.driverCommMode ?? null,
        dispatchReviewed: Boolean(state.dispatchReviewed),
        dispatchSent: Boolean(state.dispatchSent),
        response: state.driverResponse ?? "none",
        ask: state.driverAsk ?? null,
        assigned: Boolean(state.assignedDriverId),
        assignmentTime: state.assignmentTimestamp ?? null,
      }
    : FRESH;
  const run = own || stored.completed ? stored : EMPTY_RUN;
  const entry = d.selectedDriverId ? getRosterEntry(d.selectedDriverId) : null;
  return { neg, d, run, entry, vars: neg ? buildVars(neg, entry) : null };
}

const currentTask = (run) => (run.completed ? null : mission05.tasks[run.currentTask] ?? null);

export function getAssignmentStatus(d) {
  if (d.assigned) return "ready-for-pickup";
  if (d.response === "accepted") return "driver-confirmed";
  if (d.dispatchSent) return "assigned";
  if (d.selectedDriverId) return "ready-for-assignment";
  return "negotiated";
}
export const getStatusLabel = (d) => assignmentStatuses[getAssignmentStatus(d)];

function taskDone(rule, d, neg) {
  switch (rule.type) {
    case "review-load":
      return d.loadReviewed;
    case "select-driver":
      return Boolean(d.selectedDriverId);
    case "check":
      return Boolean(d.selectedDriverId) && (d.driverChecks[d.selectedDriverId] ?? []).includes(rule.code);
    case "contact":
      return d.mode != null;
    case "topics":
      return requiredTopicsFor(neg.load).every((t) => d.topics.includes(t));
    case "dispatch-sent":
      return d.dispatchSent;
    case "driver-accepted":
      return d.response === "accepted";
    case "assignment-confirmed":
      return d.assigned;
    default:
      return false;
  }
}

function advance(d, run, xp, neg) {
  let cur = run;
  let total = xp;
  const completed = [];
  while (cur.started && !cur.completed) {
    const task = mission05.tasks[cur.currentTask];
    if (!task || !taskDone(task.rule, d, neg)) break;
    const gained = taskXp[task.id] ?? 0;
    total += gained;
    cur = { ...cur, completedTasks: [...cur.completedTasks, task.id], currentTask: cur.currentTask + 1, xpEarned: cur.xpEarned + gained };
    completed.push(task.id);
  }
  return { run: cur, xp: total, completed };
}

// Persist the whole Phase 6 slice (with the derived load status) and advance the mission.
function commit(state, { d, run, extra = {} }) {
  const { neg, entry } = readDispatch(state);
  const res = advance(d, run, state.xp, neg);
  const last = res.completed.at(-1);
  const lastTask = last && mission05.tasks.find((t) => t.id === last);
  return {
    patch: {
      dispatchLoadId: neg.load.id,
      loadReviewed: d.loadReviewed,
      viewedDriverIds: d.viewedDriverIds,
      selectedDriverId: d.selectedDriverId,
      driverChecks: d.driverChecks,
      driverTopics: d.topics,
      driverMessages: d.messages,
      driverCallNotes: d.notes,
      driverCommMode: d.mode,
      dispatchReviewed: d.dispatchReviewed,
      dispatchSent: d.dispatchSent,
      driverResponse: d.response,
      driverAsk: d.ask,
      driverConfirmed: d.response === "accepted",
      assignedLoadId: d.assigned ? neg.load.id : null,
      assignedDriverId: d.assigned ? d.selectedDriverId : null,
      assignedTruckId: d.assigned && entry ? entry.truck.id : null,
      assignmentTimestamp: d.assignmentTime,
      loadAssignmentStatus: getAssignmentStatus(d),
      xp: res.xp,
      missionRuns: { ...state.missionRuns, [mission05.id]: res.run },
      ...extra,
    },
    message: res.completed.length ? { tone: "success", text: fillTemplate(fb.taskDone, { title: lastTask.title }) } : undefined,
    completed: res.completed,
  };
}

const noop = (message) => ({ patch: {}, message, completed: [] });

export function startMission(state) {
  const { neg, d, run } = readDispatch(state);
  if (!neg || run.started) return noop();
  return commit(state, { d, run: { ...run, missionId: mission05.id, started: true } });
}

export function reviewLoad(state) {
  const { neg, d, run } = readDispatch(state);
  if (!neg || !run.started || d.loadReviewed) return noop();
  return commit(state, { d: { ...d, loadReviewed: true }, run });
}

// Opening a driver's profile. No verdict is revealed by viewing.
export function viewDriver(state, driverId) {
  const { neg, d, run } = readDispatch(state);
  if (!neg || !run.started) return noop();
  return commit(state, { d: { ...d, viewedDriverIds: addUnique(d.viewedDriverIds, [driverId]) }, run });
}

// The student reveals suitability checks (one or more codes) for a driver they are reviewing.
export function revealDriverChecks(state, driverId, codes) {
  const { neg, d, run } = readDispatch(state);
  if (!neg || !run.started) return noop();
  const driverChecks = { ...d.driverChecks, [driverId]: addUnique(d.driverChecks[driverId] ?? [], codes) };
  return commit(state, { d: { ...d, driverChecks }, run });
}

// Choose a driver for the load. Unsuitable drivers are refused with the real reason.
export function selectDriver(state, driverId) {
  const { neg, d, run } = readDispatch(state);
  if (!neg) return noop();
  if (!run.started) return noop({ tone: "hint", text: fb.startFirst });
  const entry = getRosterEntry(driverId);
  if (!entry) return noop();
  if (d.dispatchSent && d.selectedDriverId !== driverId) return noop({ tone: "hint", text: "The dispatch has already gone to another driver." });

  const verdict = evaluateDriver(neg.load, entry);
  if (!verdict.suitable) {
    // Educational feedback; the failing checks are uncovered for this driver and the attempt is counted.
    const failing = verdict.checks.filter((c) => !c.passed).map((c) => c.code);
    const driverChecks = { ...d.driverChecks, [driverId]: addUnique(d.driverChecks[driverId] ?? [], failing) };
    const out = commit(state, { d: { ...d, driverChecks, viewedDriverIds: addUnique(d.viewedDriverIds, [driverId]) }, run: { ...run, attempts: run.attempts + 1 } });
    return { ...out, message: { tone: "error", text: verdict.firstFailure.message }, wrong: true };
  }
  if (!isDriverAvailableForDispatch(state, driverId, state.activeDispatchId) || !isTruckAvailableForDispatch(state, entry.truck.id, state.activeDispatchId)) {
    const holder = dispatchHoldingDriver(state, driverId, state.activeDispatchId);
    return noop({ tone: "error", text: `${entry.driver.name} is already assigned to ${holder ? `Dispatch #${String(holder.sequenceNumber).padStart(3, "0")}` : "another dispatch"}. Choose another driver.` });
  }
  const switched = d.selectedDriverId && d.selectedDriverId !== driverId;
  const next = {
    ...(switched ? { ...d, topics: [], messages: [], notes: [], mode: null, dispatchReviewed: false } : d),
    selectedDriverId: driverId,
    viewedDriverIds: addUnique(d.viewedDriverIds, [driverId]),
  };
  const out = commit(state, { d: next, run });
  return { ...out, message: { tone: "success", text: fillTemplate(fb.driverSelected, { driver: entry.driver.name }) } };
}

// ---- Communication ------------------------------------------------------------------------

// If the dispatch is out, the driver reacts to what they now know: accept, ask, or decline.
function react(d, neg, entry, vars) {
  if (!d.dispatchSent || !entry || d.assigned) return d;
  const r = resolveDriverReaction({ load: neg.load, entry, covered: d.topics });
  if (r.response === d.response && r.ask === d.ask) return d;
  const line =
    r.response === "accepted" ? acceptedLine(d.response === "needs-clarification") : r.response === "declined" ? declinedLine(r.reason) : clarificationFor(r.ask, vars);
  return { ...d, response: r.response, ask: r.ask, messages: [...d.messages, { from: "driver", channel: "chat", text: line }] };
}

export function sendMessage(state, text, channel = "chat") {
  const { neg, d, run, entry, vars } = readDispatch(state);
  const clean = (text ?? "").trim();
  if (!neg || !clean) return noop();
  if (!entry) return noop({ tone: "hint", text: fb.needDriver });

  const topics = detectDriverTopics(clean);
  const lines = driverReplyLines(topics, vars, neg.load);
  const reply = lines.length ? lines : [driverFallback()];
  const mode = d.mode && d.mode !== channel ? "both" : channel;
  const next = react(
    {
      ...d,
      mode,
      topics: addUnique(d.topics, topics),
      messages: [...d.messages, { from: "dispatcher", channel, text: clean }, ...reply.map((l) => ({ from: "driver", channel, text: l }))],
    },
    neg, entry, vars,
  );
  const out = commit(state, { d: next, run });
  return { ...out, driver: reply };
}

export function connectCall(state) {
  const { neg, d, run, entry, vars } = readDispatch(state);
  if (!neg || !entry) return noop({ tone: "hint", text: fb.needDriver });
  const mode = d.mode && d.mode !== "call" ? "both" : "call";
  return commit(state, { d: { ...d, mode, messages: [...d.messages, { from: "driver", channel: "call", text: driverGreeting(vars) }] }, run });
}

export function endCall(state) {
  const { neg, d, run } = readDispatch(state);
  if (!neg) return noop();
  return commit(state, { d: { ...d, messages: [...d.messages, { from: "system", channel: "call", text: callScript.endedLine }] }, run });
}

// ---- Dispatch sheet -----------------------------------------------------------------------

// The sheet shown to the student and sent to the driver. Built from the load, broker, agreed rate
// and selected driver; nothing here is typed in.
export function buildDispatchSheet(neg, entry) {
  const { load, broker, agreedRate, postedRate } = neg;
  const v = buildVars(neg, entry);
  const miles = entry ? evaluateDriver(load, entry).deadheadMiles : null;
  const instructions = [
    load.specialRequirements.length ? load.specialRequirements.join(", ") : "No special requirements",
    `${load.appointmentType} pickup`,
    `Detention: ${broker.detentionTerms}`,
  ].join(". ");
  const values = {
    load: load.referenceNumber,
    broker: broker.name,
    rate: agreedRate === postedRate ? formatCurrency(agreedRate) : `${formatCurrency(agreedRate)} (posted ${formatCurrency(postedRate)})`,
    pickup: v.origin,
    pickupTime: `${v.pickupDay}, ${v.pickupTime} - ${v.pickupEnd}`,
    delivery: v.destination,
    deliveryTime: `${v.deliveryDay}, ${v.deliveryTime} - ${v.deliveryEnd}`,
    commodity: load.commodity,
    weight: `${v.weight} lbs`,
    equipment: load.equipmentType,
    miles: miles == null ? `${load.loadedMiles.toLocaleString("en-US")} loaded` : `${load.loadedMiles.toLocaleString("en-US")} loaded + ${miles} to pickup`,
    instructions,
    driver: entry ? entry.driver.name : "Select a driver",
    truck: entry ? `${entry.truck.id} (${entry.truck.equipment})` : "Select a driver",
  };
  return dispatchSheetFields.map((f) => ({ id: f.id, label: f.label, value: values[f.id] }));
}

export function reviewDispatch(state) {
  const { neg, d, run, entry } = readDispatch(state);
  if (!neg || !run.started) return noop();
  if (!entry) return noop({ tone: "hint", text: fb.needDriver });
  return commit(state, { d: { ...d, dispatchReviewed: true }, run });
}

export function sendDispatch(state) {
  const { neg, d, run, entry, vars } = readDispatch(state);
  if (!neg || !run.started) return noop();
  if (!entry) return noop({ tone: "hint", text: fb.needDriver });
  if (!d.dispatchReviewed) return noop({ tone: "hint", text: fb.needReview });
  if (d.dispatchSent) return noop();
  const sent = { ...d, dispatchSent: true, messages: [...d.messages, { from: "system", channel: "chat", text: `Dispatch sent to ${entry.driver.name}.` }] };
  const next = react(sent, neg, entry, vars);
  const out = commit(state, { d: next, run });
  const tone = next.response === "accepted" ? "success" : next.response === "declined" ? "error" : "hint";
  const text = next.response === "needs-clarification" ? fb.clarification : next.response === "accepted" ? fb.accepted : fb.dispatchSent;
  return { ...out, message: out.completed.length ? out.message : { tone, text } };
}

export function confirmAssignment(state) {
  const { neg, d, run, entry } = readDispatch(state);
  if (!neg || !entry) return noop({ tone: "hint", text: fb.needDriver });
  if (!d.dispatchSent) return noop({ tone: "hint", text: fb.needDispatch });
  if (d.response !== "accepted") return noop({ tone: "hint", text: fb.needAcceptance });
  if (d.assigned) return noop();
  const out = commit(state, { d: { ...d, assigned: true, assignmentTime: simulationConfig.clock.now }, run });
  return { ...out, message: { tone: "success", text: fb.assignmentConfirmed } };
}

// ---- Notes & derived views ----------------------------------------------------------------

export function buildDriverNotes(d, neg, entry) {
  if (!entry) return [];
  const v = buildVars(neg, entry);
  const has = (t) => d.topics.includes(t);
  const notes = [];
  if (has("availability")) notes.push(`${entry.driver.name} confirmed available for ${v.ref}.`);
  if (has("hos")) notes.push(`Remaining HOS: ${v.hos}.`);
  if (has("location")) notes.push(`Driver location: ${v.driverLocation}.`);
  if (has("pickup")) notes.push(`Pickup: ${v.origin}, ${v.pickupDay}, ${v.pickupTime} - ${v.pickupEnd}.`);
  if (has("delivery")) notes.push(`Delivery: ${v.destination}, ${v.deliveryDay}, ${v.deliveryTime} - ${v.deliveryEnd}.`);
  if (has("appointment")) notes.push(`Appointment: ${v.appointment}.`);
  if (d.dispatchSent) notes.push("Dispatch sheet sent to the driver.");
  if (d.response === "accepted") notes.push("Driver accepted the load.");
  return notes;
}

export function saveNotes(state) {
  const { neg, d, entry } = readDispatch(state);
  if (!neg) return noop();
  return { patch: { dispatchLoadId: neg.load.id, driverCallNotes: buildDriverNotes(d, neg, entry) }, completed: [] };
}

// HOS review numbers for a driver and the load (centralised in driverRules).
export function getHosReview(neg, entry) {
  const v = evaluateDriver(neg.load, entry);
  return {
    remaining: formatDuration(entry.driver.hosMinutes),
    driveTime: formatDuration(v.driveMinutes),
    arrival: formatSimTime(v.arrival),
    windowEnd: formatSimTime(parseSimTime(neg.load.pickupWindow.end)),
    margin: formatDuration(Math.abs(v.hosMarginMinutes)),
    marginNegative: v.hosMarginMinutes < 0,
    deadheadMiles: v.deadheadMiles,
    totalMiles: v.deadheadMiles + neg.load.loadedMiles,
  };
}

export function getHelper(state) {
  const { neg, entry, vars } = readDispatch(state);
  if (!neg || !entry) return null;
  return { suggestions: getDriverSuggestions(vars, neg.load) };
}

export function getWorkflow(d, run) {
  const done = (id) => run.completedTasks.includes(id);
  const flags = [done("review-load"), Boolean(d.selectedDriverId), done("communicate-details"), d.dispatchSent && d.response === "accepted", d.assigned];
  const firstOpen = flags.findIndex((f) => !f);
  return flags.map((f, i) => (f ? "done" : i === firstOpen ? "current" : "pending"));
}

export function getAgentLine(run) {
  const m = mission05.agentMessages;
  if (!run.started) return m.beforeStart;
  if (run.completed) return m.done;
  const task = currentTask(run);
  if (!task) return m.done;
  return [m.review, m.driver, m.driver, m.communicate, m.dispatch, m.acceptance, m.acceptance][task.step] ?? m.driver;
}

export function takeHint(state) {
  const { run } = readDispatch(state);
  const task = currentTask(run);
  if (!task) return noop();
  return { patch: { missionRuns: { ...state.missionRuns, [mission05.id]: { ...run, hintsUsed: run.hintsUsed + 1 } } }, hint: task.hint, completed: [] };
}

export const topicLabels = Object.fromEntries(driverTopics.map((t) => [t.id, t.label]));

// ---- Completion ---------------------------------------------------------------------------

export function getSummary(state) {
  const { neg, d, run, entry } = readDispatch(state);
  const v = entry ? evaluateDriver(neg.load, entry) : null;
  return {
    driver: entry?.driver.name ?? "-",
    truck: entry?.truck.id ?? "-",
    equipment: entry?.truck.equipment ?? "-",
    remainingHos: entry ? formatDuration(entry.driver.hosMinutes) : "-",
    deadhead: v ? `${v.deadheadMiles} mi` : "-",
    dispatchSent: d.dispatchSent ? "Yes" : "No",
    driverConfirmed: d.response === "accepted" ? "Yes" : "No",
    status: getStatusLabel(d),
    incorrect: run.attempts,
    accuracy: calcAccuracy(mission05.tasks.length, run.attempts),
    hintsUsed: run.hintsUsed,
    xp: run.xpEarned,
    stars: run.starsEarned,
  };
}

export function completeMission(state) {
  const { neg, run } = readDispatch(state);
  if (!neg || !run.started || run.completed || run.completedTasks.length < mission05.tasks.length) return { patch: {}, completed: false };
  const { stars, patch } = finishMission(state, {
    missionId: mission05.id,
    levelId: mission05.levelId,
    tasksTotal: mission05.tasks.length,
    attempts: run.attempts,
    hintsUsed: run.hintsUsed,
  });
  return { patch: { ...patch, missionRuns: { ...state.missionRuns, [mission05.id]: { ...run, completed: true, starsEarned: stars } } }, completed: true };
}

// Re-exported helpers the UI needs for display.
export { formatSimDay, formatSimClock };
