// Phase 7 (Live Tracking, Check Calls & Shipment Monitoring) state transitions as pure functions:
// (game state, action) -> { patch, message, ... }. The patch is merged by the game store.
// The assigned load / driver / truck come from the Phase 6 assignment (saved IDs); nothing here names
// a load or a driver. Persisted: IDs, primitives and event records. The trip itself is the scripted
// timeline in lib/trackingEngine.js; the saved `trackingStep` is the only position that is stored.
//
// Shipment status flow: ready for pickup -> en route -> arrived at pickup -> loading -> picked up ->
// in transit -> check call / monitoring -> arrived at delivery. It stops there: delivery, POD, BOL
// and closeout belong to the next phase.
//
// Movement is automatic and time based. A segment (trackingSegment) records when the truck started
// moving to the next scripted step; progress is derived from that real timestamp compressed by
// simulationConfig.trackingTimeScale (see lib/trackingTime.js), so it survives refresh and sleep.
// settle() commits the steps whose time has come. The truck stops at the events that need the
// student (arrival, pickup confirmation, a reported delay): see `autoNext` in the scenario data.

import { mission06, trackingScenario, trackingStatuses, exceptionScript, checkCallTopics, driverUpdateScript } from "@/data/phase7Missions";
import { callScript } from "@/data/brokerComms";
import { simulationConfig } from "@/data/simulationConfig";
import { taskXp } from "@/data/rewards";
import { initialMissionProgress, initialGameState } from "@/data/users";
import { getLoad, getBroker } from "./loadSelectors";
import { listCompatibleLoadIds } from "./loadRules";
import { evaluateDriver } from "./driverRules";
import { getRosterEntry, getRoster } from "./dispatchRoster";
import { buildTimeline, snapshotAt, snapshotLive, getAlerts, etaOptions, toSimString, exceptionAt } from "./trackingEngine";
import { getNow } from "./trackingClock";
import { segmentFor, segmentProgress, simMinutesBetween, simMinutesToRealMs } from "./trackingTime";
import {
  detectTrackingTopics,
  checkTopicsOf,
  topicLabel,
  buildTrackingVars,
  driverReplyLines,
  driverGreeting,
  getTrackingSuggestions,
  detectBrokerUpdate,
  brokerUpdateDraft,
  brokerReply,
  fmtDateTime,
} from "./trackingComms";
import { finishMission, calcAccuracy } from "./progression";
import { fillTemplate, formatSimClock, parseSimTime } from "./text";

const EMPTY_RUN = { ...initialMissionProgress, missionId: mission06.id };
const FLAGS = initialGameState.trackingFlags;
const FRESH = { step: 0, flags: FLAGS, messages: [], notes: [], mode: null, checkCalls: [], activity: [], delays: [], brokerUpdates: [], arrival: false, segment: null, updates: [] };
const fb = mission06.feedback;
const TASKS = mission06.tasks;

// ---- Reading the saved state --------------------------------------------------------------

// Everything the screen needs, resolved from IDs. Before Start Mission (or if the saved data belongs
// to a different load) the tracker is a clean slate, so nothing happens early.
export function readTracking(state) {
  const load = state.assignedLoadId ? getLoad(state.assignedLoadId) : null;
  const entry = state.assignedDriverId ? getRosterEntry(state.assignedDriverId) : null;
  const ok = Boolean(load && entry);
  const stored = state.missionRuns?.[mission06.id] ?? EMPTY_RUN;
  const own = ok && state.trackingLoadId === load.id && stored.started;
  const t = own
    ? {
        step: state.trackingStep ?? 0,
        flags: { ...FLAGS, ...(state.trackingFlags ?? {}) },
        messages: state.trackingMessages ?? [],
        notes: state.trackingNotes ?? [],
        mode: state.trackingCommMode ?? null,
        checkCalls: state.checkCallLog ?? [],
        activity: state.activityLog ?? [],
        delays: state.delayEvents ?? [],
        brokerUpdates: state.brokerUpdates ?? [],
        arrival: Boolean(state.arrivalConfirmed),
        segment: state.trackingSegment ?? null,
        updates: state.trackingUpdates ?? [],
      }
    : FRESH;
  const run = own || stored.completed ? stored : EMPTY_RUN;
  if (!ok) return { ok, load, entry, broker: null, run, t, tl: null, snap: null, vars: null, agreedRate: null };

  const broker = getBroker(load.brokerId);
  const tl = buildTimeline(load, entry, state.assignmentTimestamp ?? simulationConfig.clock.now);
  const exc = exceptionAt(tl, t.step);
  const brokerOk = exc ? t.brokerUpdates.some((u) => u.valid && u.step >= exc.step) : true;
  const handled = t.flags.ack && t.flags.etaSolved && t.flags.apptSolved && t.flags.recorded;
  const opts = { resolved: Boolean(exc) && handled && brokerOk, hosMinutes: entry.driver.hosMinutes };
  // While the truck is moving, the snapshot is interpolated from the real time elapsed in the segment.
  const now = getNow();
  const live = t.segment && t.segment.fromStep === t.step ? t.segment : null;
  const snap = live ? snapshotLive(tl, t.step, live, segmentProgress(live, now), opts) : snapshotAt(tl, t.step, opts);
  const vars = buildTrackingVars({ load, entry, broker, snap });
  const open = Boolean(exc) && !(handled && brokerOk);
  return { ok, load, entry, broker, run, t, tl, snap, vars, agreedRate: state.agreedRate ?? load.rate, exc, brokerOk, handled, open, now, segment: live };
}

// Shipments listed in the left panel. One today; the list shape supports several.
export function getActiveShipments(state) {
  const c = readTracking(state);
  if (!c.ok) return [];
  return [{ loadId: c.load.id, load: c.load, entry: c.entry, status: c.snap.status, statusId: c.snap.statusId, eta: fmtDateTime(c.snap.etaDelivery), health: c.snap.health }];
}

export const getShipmentStatus = (c) => c.snap.status;

// ---- Persisting ---------------------------------------------------------------------------

function taskDone(rule, c) {
  const { t, snap, exc, brokerOk } = c;
  switch (rule.type) {
    case "trip-started":
      return t.step >= 1;
    case "flag":
      return Boolean(t.flags[rule.flag]);
    case "check-call":
      return t.checkCalls.some((x) => x.step >= rule.minStep);
    case "exception":
      return Boolean(exc) && t.flags.ack && t.flags.etaSolved && t.flags.apptSolved && t.flags.recorded;
    case "broker-update":
      return Boolean(exc) && brokerOk;
    case "arrival":
      return t.arrival && snap.step === c.tl.lastStep;
    default:
      return false;
  }
}

function advanceTasks(c, run, xp) {
  let cur = run;
  let total = xp;
  const completed = [];
  while (cur.started && !cur.completed) {
    const task = TASKS[cur.currentTask];
    if (!task || !taskDone(task.rule, c)) break;
    const gained = taskXp[task.id] ?? 0;
    total += gained;
    cur = { ...cur, completedTasks: [...cur.completedTasks, task.id], currentTask: cur.currentTask + 1, xpEarned: cur.xpEarned + gained };
    completed.push(task.id);
  }
  return { run: cur, xp: total, completed };
}

// Write the whole Phase 6 -> 7 slice for the new tracker state `t`, then advance the mission.
function commit(state, base, t0, run, extra = {}) {
  const t = ensureSegment(t0, base.tl);
  const next = readTracking({ ...state, trackingSegment: t.segment ?? null, trackingUpdates: t.updates ?? [], trackingLoadId: base.load.id, trackingStep: t.step, trackingFlags: t.flags, trackingMessages: t.messages, trackingNotes: t.notes, trackingCommMode: t.mode, checkCallLog: t.checkCalls, activityLog: t.activity, delayEvents: t.delays, brokerUpdates: t.brokerUpdates, arrivalConfirmed: t.arrival, missionRuns: { ...state.missionRuns, [mission06.id]: run } });
  const res = advanceTasks(next, run, state.xp);
  const last = res.completed.at(-1);
  const lastTask = last && TASKS.find((x) => x.id === last);
  return {
    patch: {
      trackingLoadId: base.load.id,
      trackingStep: t.step,
      trackingFlags: t.flags,
      trackingSegment: t.segment ?? null,
      trackingUpdates: t.updates ?? [],
      currentShipmentStatus: next.snap.statusId,
      lastKnownLocation: next.snap.location,
      checkCallLog: t.checkCalls,
      activityLog: t.activity,
      delayEvents: t.delays,
      brokerUpdates: t.brokerUpdates,
      trackingMessages: t.messages,
      trackingNotes: t.notes,
      trackingCommMode: t.mode,
      currentETA: toSimString(next.snap.etaDelivery),
      arrivalConfirmed: t.arrival,
      xp: res.xp,
      missionRuns: { ...state.missionRuns, [mission06.id]: res.run },
      ...extra,
    },
    message: res.completed.length ? { tone: "success", text: fillTemplate(fb.taskDone, { title: lastTask.title }) } : undefined,
    completed: res.completed,
  };
}

const noop = (message) => ({ patch: {}, message, completed: [] });
const withMessage = (out, message) => (out.completed.length ? out : { ...out, message });

// An activity event as a record (never typed into the UI).
function addActivity(t, c, type, message, time = c.snap.time) {
  const event = { id: `act-${t.activity.length + 1}`, type, timestamp: toSimString(time), message, loadId: c.load.id, driverId: c.entry.driver.id };
  return { ...t, activity: [...t.activity, event] };
}

// ---- Mission ------------------------------------------------------------------------------

export function startMission(state) {
  const c = readTracking(state);
  if (!c.ok || c.run.started) return noop();
  const start = parseSimTime(state.assignmentTimestamp ?? simulationConfig.clock.now);
  const v = c.vars;
  let t = { ...FRESH, flags: FLAGS };
  const first = { ...c, snap: { ...c.snap, time: start } };
  t = addActivity(t, first, "assigned", `Load ${v.ref} assigned to ${v.driver} (${v.truck}).`, start);
  t = addActivity(t, first, "dispatch-sent", `Dispatch sent to ${v.driver}.`, start);
  t = addActivity(t, first, "driver-accepted", `${v.driver} accepted the dispatch.`, start);
  t = addActivity(t, first, "ready", "Shipment ready for pickup.", start);
  return commit(state, c, t, { ...c.run, missionId: mission06.id, started: true });
}

// Moves the trip to `step`, logging what happened and any delay the driver reports.
function moveTo(state, c, step) {
  const toSnap = snapshotAt(c.tl, step, { hosMinutes: c.entry.driver.hosMinutes });
  const sc = trackingScenario.steps[step];
  const stepCtx = { ...c, snap: toSnap, vars: buildTrackingVars({ load: c.load, entry: c.entry, broker: c.broker, snap: toSnap }) };
  let t = { ...c.t, step };
  if (sc.activity) t = addActivity(t, stepCtx, `status-${sc.status}`, fillTemplate(sc.activity, stepCtx.vars), toSnap.time);
  t = addStepUpdate(t, stepCtx, step);
  const delay = c.tl.steps[step].delay;
  if (delay) {
    const line = fillTemplate(trackingScenario.delays[delay.id].driverLine, { ...stepCtx.vars, minutes: delay.minutes });
    t = {
      ...t,
      delays: [...t.delays, { id: `delay-${t.delays.length + 1}`, step, minutes: delay.minutes, material: delay.minutes >= trackingScenario.materialDelayMinutes, timestamp: toSimString(toSnap.time), message: line }],
      messages: [...t.messages, { from: "driver", channel: "chat", text: line }],
    };
    t = addActivity(t, stepCtx, "delay-reported", `Delay reported: ${delay.label}, about ${delay.minutes} minutes.`, toSnap.time);
  }
  return t;
}

// Training control: begin the trip (ready for pickup -> en route to pickup).
export function startTrip(state) {
  const c = readTracking(state);
  if (!c.ok) return noop();
  if (!c.run.started) return noop({ tone: "hint", text: fb.startFirst });
  if (c.t.step >= 1) return noop();
  const out = commit(state, c, moveTo(state, c, 1), c.run);
  return withMessage(out, { tone: "success", text: fb.tripStarted });
}

// Development / test control: skip to the next event the truck would stop at. Normal movement is
// automatic; this follows the same steps instantly. Blocked while a reported delay is unresolved.
export function advance(state) {
  const c = readTracking(state);
  if (!c.ok) return noop();
  if (!c.run.started) return noop({ tone: "hint", text: fb.startFirst });
  if (c.t.step < 1) return noop({ tone: "hint", text: "Start the trip first." });
  if (c.t.step >= c.tl.lastStep) return noop();
  if (c.open) return noop({ tone: "hint", text: fb.exceptionOpen });
  let t = { ...c.t, segment: null };
  t = moveTo(state, { ...c, t }, t.step + 1);
  for (let target = nextTarget(t, c.tl); target != null; target = nextTarget(t, c.tl)) t = moveTo(state, { ...c, t }, target);
  return commit(state, c, t, c.run);
}

// ---- Automatic movement ---------------------------------------------------------------------

// Is a reported delay still waiting to be handled (and the broker told)?
function delayOpen(tl, t) {
  const exc = exceptionAt(tl, t.step);
  if (!exc) return false;
  const handled = t.flags.ack && t.flags.etaSolved && t.flags.apptSolved && t.flags.recorded;
  return !(handled && t.brokerUpdates.some((u) => u.valid && u.step >= exc.step));
}

// The step the truck moves to by itself from the current one, or null when it must wait for the student.
export function nextTarget(t, tl) {
  const rule = trackingScenario.steps[t.step]?.autoNext;
  if (!rule || t.step >= tl.lastStep) return null;
  if (rule.requiresFlag && !t.flags[rule.requiresFlag]) return null;
  if (rule.blockedWhenOpen && delayOpen(tl, t)) return null;
  return t.step + 1;
}

// Start the next movement now, when one is due and none is running.
function ensureSegment(t, tl) {
  if (t.segment && t.segment.fromStep === t.step) return t;
  const target = nextTarget(t, tl);
  return target == null ? (t.segment ? { ...t, segment: null } : t) : { ...t, segment: segmentFor(tl, t.step, target, getNow()) };
}

const pct = (frac) => Math.round(frac * 100);

// One automatic driver update, once per key (so a refresh never repeats it). Also logged as an activity
// event of its own type (a check call is a different event).
function addUpdate(t, ctx, key, percent, text, time) {
  if (t.updates.some((u) => u.key === key)) return t;
  const update = { id: `du-${t.updates.length + 1}`, key, kind: "auto", percent, timestamp: toSimString(time), location: ctx.snap.location, text };
  return addActivity({ ...t, updates: [...t.updates, update] }, ctx, "driver-update", text, time);
}

function updateText(template, ctx) {
  const { snap } = ctx;
  const toTarget = snap.target === "pickup" ? Math.max(0, snap.remainingMiles - ctx.tl.loadedMiles) : snap.remainingMiles;
  const delayed = snap.delays.some((d) => d.exception);
  const text = delayed && template.progress ? driverUpdateScript.delayed : template.text;
  return fillTemplate(text, { ...ctx.vars, toTarget, minutes: snap.delayTotal, remaining: snap.remainingMiles });
}

// Trip start and arrival updates, when those steps are reached.
function addStepUpdate(t, ctx, step) {
  const sc = trackingScenario.steps[step];
  if (step === 1) return addUpdate(t, ctx, "pickup:start", 0, updateText({ text: driverUpdateScript.start }, ctx), ctx.snap.time);
  if (sc.status === "arrived-pickup") return addUpdate(t, ctx, "pickup:arrive", 100, updateText({ text: driverUpdateScript.arrival.pickup }, ctx), ctx.snap.time);
  if (sc.status === "arrived-delivery") return addUpdate(t, ctx, "delivery:arrive", 100, updateText({ text: driverUpdateScript.arrival.delivery }, ctx), ctx.snap.time);
  return t;
}

// Threshold updates (25 / 50 / 75 / 90 %) for the leg this segment moves along, up to progress `p`.
function emitSegmentUpdates(t, c, seg, p) {
  const a = c.tl.steps[seg.fromStep];
  const b = c.tl.steps[seg.toStep];
  if (a.leg !== b.leg || a.frac === b.frac) return t;
  const target = a.leg === "pickup" ? "pickup" : "delivery";
  const now = a.frac + (b.frac - a.frac) * p;
  let next = t;
  for (const th of simulationConfig.trackingTimeScale.driverUpdateThresholds) {
    if (!(th > a.frac && th <= now + 1e-9)) continue;
    const at = (th - a.frac) / (b.frac - a.frac);
    const snap = snapshotLive(c.tl, seg.fromStep, seg, at, { hosMinutes: c.entry.driver.hosMinutes });
    const ctx = { ...c, t: next, snap, vars: buildTrackingVars({ load: c.load, entry: c.entry, broker: c.broker, snap }) };
    const template = { progress: true, text: driverUpdateScript.progress[target][pct(th)] };
    if (!template.text) continue;
    next = addUpdate(next, ctx, `${target}:${pct(th)}`, pct(th), updateText(template, ctx), snap.time);
  }
  return next;
}

// Commit whatever the clock has already done: finish the segments whose time is up (logging each step
// the truck reached and its delay), report the driver updates it passed, and stop at the next event
// that needs the student. Idempotent: calling it twice, or after a refresh, changes nothing more.
export function settle(state, nowMs = getNow()) {
  const c = readTracking(state);
  if (!c.ok || !c.run.started || c.run.completed || c.t.arrival) return noop();
  let t = c.t;
  let chainedAt = null; // when the previous segment ended: the next one starts there, not "now"
  let changed = false;
  for (let guard = 0; guard < 80; guard++) {
    let seg = t.segment && t.segment.fromStep === t.step ? t.segment : null;
    if (!seg) {
      const target = nextTarget(t, c.tl);
      if (target == null) break;
      seg = segmentFor(c.tl, t.step, target, chainedAt ?? nowMs);
      t = { ...t, segment: seg };
      changed = true;
    }
    const p = segmentProgress(seg, nowMs);
    const withUpdates = emitSegmentUpdates(t, { ...c, t }, seg, p);
    if (withUpdates !== t) changed = true;
    t = withUpdates;
    if (p < 1) break;
    t = { ...moveTo(state, { ...c, t }, seg.toStep), segment: null };
    chainedAt = seg.startedAt + seg.durationRealMs;
    changed = true;
  }
  if (!changed) return noop();
  return commit(state, c, t, c.run);
}

// What the student is waiting for, in TRAINING (real) time: this movement, and the whole run until the
// truck next needs them. Not the shipment ETA (that stays on the simulation clock).
const STOPS = { "arrived-pickup": "pickup", "picked-up": "loading to finish", monitoring: "the delay report", "arrived-delivery": "delivery" };
export function getTrainingClock(c) {
  if (!c.ok || !c.run.started) return null;
  const seg = c.segment;
  if (!seg) return { moving: false };
  const progress = segmentProgress(seg, c.now);
  const nextEventMs = (1 - progress) * seg.durationRealMs;
  let toStopMs = nextEventMs;
  let t = { ...c.t, step: seg.toStep, segment: null };
  for (let target = nextTarget(t, c.tl); target != null; target = nextTarget(t, c.tl)) {
    toStopMs += simMinutesToRealMs(simMinutesBetween(c.tl, t.step, target));
    t = { ...t, step: target };
  }
  const stopStep = c.tl.steps[t.step];
  return { moving: true, progress, nextEventMs, toStopMs, stopLabel: STOPS[stopStep.status] ?? trackingStatuses[stopStep.status].toLowerCase() };
}

// ---- Pickup monitoring --------------------------------------------------------------------

// `then: "next"`: the confirmation also moves the shipment on (arrival confirmed -> loading starts).
const CONFIRM = {
  departed: { minStep: 1, type: "confirm-departed", text: "Confirmed: driver departed. Pickup ETA {etaPickup}." },
  arrived: { minStep: 3, type: "confirm-arrived", text: "Confirmed: driver arrived at the pickup.", then: "next" },
  loading: { minStep: 4, type: "confirm-loading", text: "Confirmed: loading in progress at the shipper." },
  pickedUp: { minStep: 5, type: "confirm-picked-up", text: "Confirmed: pickup complete." },
};

export function confirmStatus(state, flag) {
  const c = readTracking(state);
  const rule = CONFIRM[flag];
  if (!c.ok || !rule) return noop();
  if (!c.run.started) return noop({ tone: "hint", text: fb.startFirst });
  if (c.t.flags[flag]) return noop();
  if (c.t.step < rule.minStep) return noop({ tone: "hint", text: fb.confirmEarly });
  if (flag === "pickedUp" && !c.t.flags.loading) return noop({ tone: "hint", text: fb.needLoading });
  let t = { ...c.t, flags: { ...c.t.flags, [flag]: true } };
  t = addActivity(t, c, rule.type, fillTemplate(rule.text, c.vars));
  if (rule.then === "next" && c.t.step < c.tl.lastStep) t = moveTo(state, { ...c, t }, c.t.step + 1);
  return commit(state, c, t, c.run);
}

export function reviewEta(state) {
  const c = readTracking(state);
  if (!c.ok) return noop();
  if (!c.run.started) return noop({ tone: "hint", text: fb.startFirst });
  if (c.t.flags.etaReviewed) return noop();
  if (c.t.step < 6) return noop({ tone: "hint", text: fb.confirmEarly });
  let t = { ...c.t, flags: { ...c.t.flags, etaReviewed: true } };
  t = addActivity(t, c, "eta-reviewed", `ETA reviewed: ${fmtDateTime(c.snap.etaDelivery)}, ${c.snap.deliveryStatus}.`);
  return withMessage(commit(state, c, t, c.run), { tone: "success", text: fb.etaReviewed });
}

// ---- Communication (check calls) ----------------------------------------------------------

export function sendMessage(state, text, channel = "chat") {
  const c = readTracking(state);
  const clean = (text ?? "").trim();
  if (!c.ok || !clean) return noop();
  if (!c.run.started) return noop({ tone: "hint", text: fb.startFirst });

  const topics = detectTrackingTopics(clean);
  const checks = checkTopicsOf(topics);
  const lines = driverReplyLines(topics, c.vars, c.snap, c.tl);
  const mode = c.t.mode && c.t.mode !== channel ? "both" : channel;
  let t = {
    ...c.t,
    mode,
    messages: [...c.t.messages, { from: "dispatcher", channel, text: clean }, ...lines.map((l) => ({ from: "driver", channel, text: l }))],
  };
  let message;

  // A check call: one logged entry per simulation step, so the driver is not over-contacted.
  if (checks.length) {
    if (t.checkCalls.some((x) => x.step === c.snap.step)) {
      message = { tone: "hint", text: fb.checkCallRepeat };
    } else {
      const issue = c.snap.delays.length ? c.snap.delays.map((d) => d.label).join(", ") : "None";
      t = {
        ...t,
        checkCalls: [
          ...t.checkCalls,
          { id: `cc-${t.checkCalls.length + 1}`, step: c.snap.step, timestamp: toSimString(c.snap.time), location: c.snap.location, eta: toSimString(c.snap.etaTarget), status: c.snap.status, issue, notes: checks.map(topicLabel).join(", "), channel },
        ],
      };
      t = addActivity(t, c, "check-call", `Check call (${channel}): ${checks.map(topicLabel).join(", ")}. Driver near ${c.snap.location}.`);
      message = { tone: "success", text: fb.checkCall };
    }
  }

  // Acknowledging the driver after a delay report is part of handling the exception.
  if (c.exc && !c.t.flags.ack && (topics.includes("ack") || topics.includes("updates"))) {
    t = { ...t, flags: { ...t.flags, ack: true } };
    t = addActivity(t, c, "driver-acknowledged", `Driver acknowledged about the ${c.exc.label.toLowerCase()}.`);
    message = { tone: "success", text: fb.ackDone };
  }
  return withMessage({ ...commit(state, c, t, c.run), driver: lines }, message);
}

export function connectCall(state) {
  const c = readTracking(state);
  if (!c.ok || !c.run.started) return noop({ tone: "hint", text: fb.startFirst });
  const mode = c.t.mode && c.t.mode !== "call" ? "both" : "call";
  return commit(state, c, { ...c.t, mode, messages: [...c.t.messages, { from: "driver", channel: "call", text: driverGreeting(c.vars) }] }, c.run);
}

export function endCall(state) {
  const c = readTracking(state);
  if (!c.ok) return noop();
  return commit(state, c, { ...c.t, messages: [...c.t.messages, { from: "system", channel: "call", text: callScript.endedLine }] }, c.run);
}

// ---- Exception handling -------------------------------------------------------------------

export function getEtaOptions(state) {
  const c = readTracking(state);
  return c.ok && c.exc ? etaOptions(c.tl, c.t.step, c.load.id) : [];
}

export function chooseEta(state, optionId) {
  const c = readTracking(state);
  if (!c.ok || !c.exc || !c.run.started) return noop();
  if (!c.t.flags.ack) return noop({ tone: "hint", text: fb.needAck });
  if (c.t.flags.etaSolved) return noop();
  const option = etaOptions(c.tl, c.t.step, c.load.id).find((o) => o.id === optionId);
  if (!option) return noop();
  if (!option.correct) {
    const t = { ...c.t, flags: { ...c.t.flags, etaWrong: c.t.flags.etaWrong + 1 } };
    return { ...commit(state, c, t, { ...c.run, attempts: c.run.attempts + 1 }), message: { tone: "error", text: fb.etaWrong }, wrong: true };
  }
  let t = { ...c.t, flags: { ...c.t.flags, etaSolved: true } };
  t = addActivity(t, c, "eta-updated", `ETA updated to ${fmtDateTime(c.exc.eta)} (was ${fmtDateTime(c.exc.original)}).`);
  return withMessage(commit(state, c, t, c.run), { tone: "success", text: fb.etaCorrect });
}

export function chooseAppointment(state, optionId) {
  const c = readTracking(state);
  if (!c.ok || !c.exc || !c.run.started) return noop();
  if (!c.t.flags.etaSolved) return noop({ tone: "hint", text: fb.needEtaFirst });
  if (c.t.flags.apptSolved) return noop();
  if ((optionId === "affected") !== c.exc.affected) {
    const t = { ...c.t, flags: { ...c.t.flags, apptWrong: c.t.flags.apptWrong + 1 } };
    return { ...commit(state, c, t, { ...c.run, attempts: c.run.attempts + 1 }), message: { tone: "error", text: fb.apptWrong }, wrong: true };
  }
  return withMessage(commit(state, c, { ...c.t, flags: { ...c.t.flags, apptSolved: true } }, c.run), { tone: "success", text: fb.apptCorrect });
}

export function recordException(state) {
  const c = readTracking(state);
  if (!c.ok || !c.exc || !c.run.started) return noop();
  if (c.t.flags.recorded) return noop();
  if (!c.t.flags.ack) return noop({ tone: "hint", text: fb.needAck });
  if (!c.t.flags.etaSolved || !c.t.flags.apptSolved) return noop({ tone: "hint", text: fb.needEtaFirst });
  let t = { ...c.t, flags: { ...c.t.flags, recorded: true } };
  t = addActivity(t, c, "delay-recorded", fillTemplate(exceptionScript.recordText, { label: c.exc.label, minutes: c.exc.minutes, etaDelivery: fmtDateTime(c.exc.eta), appointment: c.exc.affected ? "at risk" : "still safe" }));
  return withMessage(commit(state, c, t, c.run), { tone: "success", text: fb.recorded });
}

// ---- Broker update ------------------------------------------------------------------------

export function getBrokerDraft(state) {
  const c = readTracking(state);
  return c.ok ? brokerUpdateDraft(c.vars) : "";
}

// Needs the delay AND the updated ETA. Only an update after the reported exception satisfies the
// mission; an update that was not needed is recorded as a courtesy and never penalised.
export function sendBrokerUpdate(state, text) {
  const c = readTracking(state);
  const clean = (text ?? "").trim();
  if (!c.ok || !clean) return noop();
  if (!c.run.started) return noop({ tone: "hint", text: fb.startFirst });
  const check = detectBrokerUpdate(clean);
  const required = c.snap.requiresBroker;
  if (!check.valid) {
    if (!required) return noop({ tone: "hint", text: fb.brokerMissing });
    const out = commit(state, c, c.t, { ...c.run, attempts: c.run.attempts + 1 });
    return { ...out, message: { tone: "error", text: fb.brokerMissing }, wrong: true };
  }
  const update = { id: `bu-${c.t.brokerUpdates.length + 1}`, step: c.snap.step, timestamp: toSimString(c.snap.time), text: clean, required, valid: true, eta: toSimString(c.snap.etaDelivery) };
  let t = {
    ...c.t,
    brokerUpdates: [...c.t.brokerUpdates, update],
    messages: [...c.t.messages, { from: "dispatcher", channel: "broker", text: clean }, { from: "broker", channel: "broker", text: brokerReply(c.vars, !required) }],
  };
  t = addActivity(t, c, "broker-notified", `Broker ${c.broker.name} notified. ETA ${fmtDateTime(c.snap.etaDelivery)}.`);
  return withMessage(commit(state, c, t, c.run), required ? { tone: "success", text: fb.brokerSent } : { tone: "hint", text: fb.brokerCourtesy });
}

// ---- Arrival ------------------------------------------------------------------------------

export function confirmArrival(state) {
  const c = readTracking(state);
  if (!c.ok || !c.run.started) return noop({ tone: "hint", text: fb.startFirst });
  if (c.t.arrival) return noop();
  if (c.t.step < c.tl.lastStep) return noop({ tone: "hint", text: fb.confirmEarly });
  let t = { ...c.t, arrival: true };
  t = addActivity(t, c, "arrival-confirmed", "Arrival at delivery confirmed. Status: ARRIVED AT DELIVERY.");
  return withMessage(commit(state, c, t, c.run), { tone: "success", text: fb.arrivalConfirmed });
}

// ---- Notes, guidance and derived views ----------------------------------------------------

export function buildNotes(c) {
  if (!c.ok || !c.run.started) return [];
  const notes = [];
  const last = c.t.checkCalls.at(-1);
  if (last) notes.push(`Last check call: ${last.location}, ${last.status}.`);
  notes.push(`Current ETA: ${fmtDateTime(c.snap.etaTarget)} (${c.snap.target}).`);
  if (c.exc) notes.push(`Delay: ${c.exc.label}, about ${c.exc.minutes} min.`);
  if (c.t.brokerUpdates.some((u) => u.required)) notes.push("Broker updated about the delay.");
  return notes;
}

export function saveNotes(state) {
  const c = readTracking(state);
  if (!c.ok) return noop();
  return { patch: { trackingLoadId: c.load.id, trackingNotes: buildNotes(c) }, completed: [] };
}

export const getSuggestions = (state) => {
  const c = readTracking(state);
  return c.ok ? getTrackingSuggestions(c.vars) : [];
};

export const getTimelineAlerts = (c) => (c.ok && c.run.started ? getAlerts(c.tl, c.snap, c.vars, { brokerUpdated: c.brokerOk }) : []);

const currentTask = (run) => (run.completed ? null : TASKS[run.currentTask] ?? null);

// The single action to glow, from the current task and what is possible right now.
export function getHighlight(c) {
  if (!c.ok || !c.run.started || c.run.completed) return null;
  const task = currentTask(c.run);
  if (!task) return null;
  const { step, flags } = c.t;
  if (step < 1 && task.id !== "start-monitoring") return "start-trip";
  if (step >= 1 && step < task.needsStep && c.open === false) return "advance";
  switch (task.id) {
    case "start-monitoring":
      return "start-trip";
    case "confirm-en-route":
      return "confirm-departed";
    case "pickup-arrival":
      return "confirm-arrived";
    case "pickup-complete":
      return !flags.loading ? (step >= 4 ? "confirm-loading" : "advance") : step >= 5 ? "confirm-picked-up" : "advance";
    case "perform-check-call":
      return "comms";
    case "review-eta":
      return "eta-review";
    case "handle-delay":
      return !flags.ack ? "ex-ack" : !flags.etaSolved ? "ex-eta" : !flags.apptSolved ? "ex-appt" : "ex-record";
    case "update-broker":
      return "ex-broker";
    case "confirm-delivery-arrival":
      return step >= c.tl.lastStep ? "confirm-arrival" : "advance";
    default:
      return null;
  }
}

export function getAgentLine(run) {
  const m = mission06.agentMessages;
  if (!run.started) return m.beforeStart;
  if (run.completed) return m.done;
  const task = currentTask(run);
  if (!task) return m.done;
  return (
    {
      "start-monitoring": m.start,
      "confirm-en-route": m.pickup,
      "pickup-arrival": m.pickup,
      "pickup-complete": m.pickup,
      "perform-check-call": m.transit,
      "review-eta": m.eta,
      "handle-delay": m.delay,
      "update-broker": m.broker,
      "confirm-delivery-arrival": m.arrival,
    }[task.id] ?? m.start
  );
}

export function takeHint(state) {
  const { run } = readTracking(state);
  const task = currentTask(run);
  if (!task) return noop();
  return { patch: { missionRuns: { ...state.missionRuns, [mission06.id]: { ...run, hintsUsed: run.hintsUsed + 1 } } }, hint: task.hint, completed: [] };
}

export const checkTopicList = checkCallTopics;

// ---- Completion ---------------------------------------------------------------------------

export function getSummary(state) {
  const c = readTracking(state);
  const f = c.t.flags;
  return {
    checkCalls: c.t.checkCalls.length,
    etaAccuracy: Math.round(100 / (1 + f.etaWrong + f.apptWrong)),
    exceptionsHandled: f.recorded ? 1 : 0,
    brokerUpdates: c.t.brokerUpdates.filter((u) => u.valid).length,
    driverMessages: c.t.messages.filter((m) => m.from === "dispatcher" && m.channel !== "broker").length,
    hintsUsed: c.run.hintsUsed,
    incorrect: c.run.attempts,
    accuracy: calcAccuracy(TASKS.length, c.run.attempts),
    xp: c.run.xpEarned,
    stars: c.run.starsEarned,
    status: c.ok ? trackingStatuses[c.snap.statusId === "monitoring" ? "monitoring" : c.snap.statusId] : "-",
  };
}

export function completeMission(state) {
  const c = readTracking(state);
  if (!c.ok || !c.run.started || c.run.completed || c.run.completedTasks.length < TASKS.length || !c.t.arrival) return { patch: {}, completed: false };
  const { stars, patch } = finishMission(state, { missionId: mission06.id, levelId: mission06.levelId, tasksTotal: TASKS.length, attempts: c.run.attempts, hintsUsed: c.run.hintsUsed });
  return { patch: { ...patch, phase7Completed: true, missionRuns: { ...state.missionRuns, [mission06.id]: { ...c.run, completed: true, starsEarned: stars } } }, completed: true };
}

export { formatSimClock };

// Development preview (?preview=1): a demo assignment built from data, never saved.
export function previewAssignment() {
  const loadId = listCompatibleLoadIds()[0] ?? null;
  const load = loadId ? getLoad(loadId) : null;
  const entry = load ? getRoster().find((e) => evaluateDriver(load, e).suitable) : null;
  if (!load || !entry) return {};
  return { assignedLoadId: load.id, assignedDriverId: entry.driver.id, assignedTruckId: entry.truck.id, assignmentTimestamp: simulationConfig.clock.now, loadAssignmentStatus: "ready-for-pickup" };
}
