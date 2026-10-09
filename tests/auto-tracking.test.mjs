// Automatic, time-based tracker: movement follows real elapsed time (compressed 12x), is derived from
// saved timestamps, pauses at events that need the student, and stays separate per dispatch.

import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { initialGameState } from "@/data/users";
import { simulationConfig } from "@/data/simulationConfig";
import { getLoad } from "@/lib/loadSelectors";
import { getRoster } from "@/lib/dispatchRoster";
import { evaluateDriver } from "@/lib/driverRules";
import { snapshotAt } from "@/lib/trackingEngine";
import * as P3 from "@/lib/phase3Actions";
import * as T from "@/lib/trackingActions";
import { setNow } from "@/lib/trackingClock";
import { simMinutesToRealMs, realMsToSimMinutes, segmentFor, segmentProgress, formatCountdown } from "@/lib/trackingTime";
import { createDispatchFromShortlist, getDispatchBySlug, projectDispatchState, applyScopedPatch } from "@/lib/dispatchRecords";
import { getJourney } from "@/lib/trackingJourney";

const T0 = Date.UTC(2026, 9, 8, 12, 0, 0);
const MIN = 60000;
afterEach(() => setNow(null));

// ---- helpers ----------------------------------------------------------------------------------------

const merge = (s, patch) => ({ ...s, ...patch });
function newDispatch(s, ids = ["load-001", "load-002"]) {
  for (const id of ids) s = merge(s, P3.shortlistLoad(s, id).patch);
  const res = createDispatchFromShortlist(s, s.shortlistedLoadIds, "2026-10-08T10:00:00.000Z");
  assert.equal(res.ok, true);
  return merge(s, res.patch);
}
const view = (s, slug) => projectDispatchState(s, getDispatchBySlug(s, slug));
function scoped(s, slug, fn) {
  const out = fn(view(s, slug));
  const g = applyScopedPatch(s, slug, out.patch, "2026-10-08T11:00:00.000Z");
  return g ? merge(s, g) : s;
}
function assigned(s, slug, loadId) {
  const entry = getRoster().find((e) => evaluateDriver(getLoad(loadId), e).suitable);
  return scoped(s, slug, () => ({ patch: { negotiatedLoadId: loadId, assignedLoadId: loadId, assignedDriverId: entry.driver.id, assignedTruckId: entry.truck.id, assignmentTimestamp: "2026-10-12T08:00" } }));
}
// A dispatch whose trip has just started (at `startMs`).
function tripStarted(s, slug, loadId, startMs) {
  setNow(startMs);
  s = assigned(s, slug, loadId);
  s = scoped(s, slug, (p) => T.startMission(p));
  return scoped(s, slug, (p) => T.startTrip(p));
}
const read = (s, slug, atMs) => {
  if (atMs != null) setNow(atMs);
  return T.readTracking(view(s, slug));
};
const settle = (s, slug, atMs) => {
  setNow(atMs);
  return scoped(s, slug, (p) => T.settle(p, atMs));
};
const ops = (s, slug) => getDispatchBySlug(s, slug).ops;
// Real milliseconds the whole trip to the pickup takes (depart -> arrive), from the engine's own timeline.
const pickupLegMs = (c) => {
  const from = c.tl.steps.findIndex((x) => x.status === "en-route-pickup");
  const to = c.tl.steps.findIndex((x) => x.status === "arrived-pickup");
  return simMinutesToRealMs((c.tl.steps[to].time - c.tl.steps[from].time) / MIN);
};

// ---- time compression --------------------------------------------------------------------------------

test("1-2. 60 simulation minutes are 5 real minutes, 120 are 10 (12x), and it is configurable", () => {
  assert.equal(simulationConfig.trackingTimeScale.simulationMinutesPerRealMinute, 12);
  assert.equal(simMinutesToRealMs(60) / MIN, 5);
  assert.equal(simMinutesToRealMs(120) / MIN, 10);
  assert.equal(simMinutesToRealMs(180) / MIN, 15);
  assert.equal(simMinutesToRealMs(240) / MIN, 20);
  assert.equal(realMsToSimMinutes(5 * MIN), 60);
  const cfg = simulationConfig.trackingTimeScale;
  cfg.simulationMinutesPerRealMinute = 6;
  try {
    assert.equal(simMinutesToRealMs(60) / MIN, 10);
  } finally {
    cfg.simulationMinutesPerRealMinute = 12;
  }
  assert.equal(formatCountdown(80000), "01:20");
});

test("segments use the timeline's own durations and store their numbers", () => {
  let s = newDispatch(initialGameState);
  s = tripStarted(s, "dispatch-0001", "load-001", T0);
  const c = read(s, "dispatch-0001", T0);
  const seg = c.t.segment;
  assert.ok(seg, "a movement segment started with the trip");
  assert.deepEqual([seg.fromStep, seg.toStep, seg.startedAt, seg.startStatus], [1, 2, T0, "en-route-pickup"]);
  const sim = Math.round((c.tl.steps[2].time - c.tl.steps[1].time) / MIN);
  assert.equal(seg.durationSimMinutes, sim, "no second travel-time calculation");
  assert.equal(seg.durationRealMs, Math.max(1000, Math.round((sim / 12) * MIN)));
  assert.equal(seg.startMiles, c.tl.steps[1].remainingMiles);
  assert.equal(seg.endMiles, c.tl.steps[2].remainingMiles);
});

// ---- progress, miles, persistence ------------------------------------------------------------------------

test("3-4. half the real duration is 50% progress, with matching miles", () => {
  let s = newDispatch(initialGameState);
  s = tripStarted(s, "dispatch-0001", "load-004", T0);
  const c0 = read(s, "dispatch-0001", T0);
  const seg = c0.t.segment;
  const half = read(s, "dispatch-0001", T0 + seg.durationRealMs / 2);
  assert.equal(half.snap.progress, 0.5);
  // depart (0) -> approach (0.5): half way is a quarter of the leg
  assert.equal(half.snap.frac, 0.25);
  const j = getJourney({ tl: half.tl, snap: half.snap });
  const dead = half.tl.deadhead;
  assert.equal(j.remaining, Math.round(dead * 0.75) + half.tl.loadedMiles);
  assert.equal(j.completed, dead + half.tl.loadedMiles - j.remaining);
  assert.equal(j.completed + j.remaining, j.total);
  assert.ok(half.load.loadedMiles === getLoad("load-004").loadedMiles, "the load's own mileage is never changed");
  assert.equal(j.phase, "to-pickup");
  assert.equal(half.snap.statusId, "en-route-pickup");
});

test("5. a refresh restores the progress (not zero)", () => {
  let s = newDispatch(initialGameState);
  s = tripStarted(s, "dispatch-0001", "load-004", T0);
  const total = pickupLegMs(read(s, "dispatch-0001", T0));
  const at = T0 + 0.4 * total;
  const before = read(s, "dispatch-0001", at);
  const reloaded = { ...initialGameState, ...JSON.parse(JSON.stringify(s)) };
  const after = read(reloaded, "dispatch-0001", at);
  assert.equal(after.snap.frac, before.snap.frac);
  assert.equal(after.snap.remainingMiles, before.snap.remainingMiles);
  assert.ok(Math.abs(after.snap.frac - 0.4) < 0.02, `about 40% of the pickup leg, got ${after.snap.frac}`);
  assert.deepEqual(after.t.segment, before.t.segment);
});

test("6. a sleeping tab or closed browser loses nothing: one late settle equals many small ones", () => {
  let a = tripStarted(newDispatch(initialGameState), "dispatch-0001", "load-004", T0);
  const total = pickupLegMs(read(a, "dispatch-0001", T0));
  let b = a;
  for (let t = 30000; t < total * 1.2; t += 30000) a = settle(a, "dispatch-0001", T0 + t);
  b = settle(b, "dispatch-0001", T0 + total * 1.2);
  const strip = (s) => ({ step: ops(s, "dispatch-0001").trackingStep, updates: ops(s, "dispatch-0001").trackingUpdates.map((u) => u.key), events: ops(s, "dispatch-0001").activityLog.map((e) => e.message) });
  a = settle(a, "dispatch-0001", T0 + total * 1.2);
  assert.deepEqual(strip(b), strip(a));
});

// ---- event boundaries -----------------------------------------------------------------------------------------

test("7-9. the truck stops at the pickup and needs the student before loading and the loaded run", () => {
  let s = tripStarted(newDispatch(initialGameState), "dispatch-0001", "load-001", T0);
  const total = pickupLegMs(read(s, "dispatch-0001", T0));

  s = settle(s, "dispatch-0001", T0 + total * 3); // long after the leg should have finished
  let c = read(s, "dispatch-0001", T0 + total * 3);
  assert.equal(c.snap.statusId, "arrived-pickup");
  assert.equal(c.t.step, 3);
  assert.equal(c.t.segment, null, "movement stopped");
  assert.equal(c.snap.progress, undefined);
  s = settle(s, "dispatch-0001", T0 + total * 50);
  assert.equal(read(s, "dispatch-0001").t.step, 3, "no automatic loading or departure");
  assert.equal(read(s, "dispatch-0001").snap.leg, "pickup");

  // the student confirms the arrival: loading starts (a timed step), then it ends at PICKED UP and waits
  const now = T0 + total * 3;
  setNow(now);
  s = scoped(s, "dispatch-0001", (p) => T.confirmStatus(p, "arrived"));
  c = read(s, "dispatch-0001", now);
  assert.equal(c.snap.statusId, "loading");
  assert.ok(c.t.segment, "loading runs on the clock");
  s = scoped(s, "dispatch-0001", (p) => T.confirmStatus(p, "loading"));
  const loadingMs = c.t.segment.durationRealMs;
  s = settle(s, "dispatch-0001", now + loadingMs * 5);
  c = read(s, "dispatch-0001", now + loadingMs * 5);
  assert.equal(c.snap.statusId, "picked-up");
  assert.equal(c.t.segment, null, "waits for the pickup confirmation");
  s = settle(s, "dispatch-0001", now + loadingMs * 500);
  assert.equal(read(s, "dispatch-0001").t.step, 5, "loaded movement does not start by itself");
  assert.equal(read(s, "dispatch-0001").snap.frac, 0);

  // confirming the pickup starts the loaded route
  const at = now + loadingMs * 500;
  setNow(at);
  s = scoped(s, "dispatch-0001", (p) => T.confirmStatus(p, "pickedUp"));
  c = read(s, "dispatch-0001", at);
  assert.deepEqual([c.t.segment.fromStep, c.t.segment.toStep], [5, 6]);
  const later = read(s, "dispatch-0001", at + c.t.segment.durationRealMs / 2);
  assert.equal(later.snap.leg, "loaded");
  assert.ok(later.snap.frac > 0 && later.snap.frac < 0.15);
  assert.equal(getJourney({ tl: later.tl, snap: later.snap }).phase, "loaded");
});

test("10-11. a delay adds compressed real time and moves the ETA", () => {
  let s = tripStarted(newDispatch(initialGameState), "dispatch-0001", "load-001", T0);
  const c0 = read(s, "dispatch-0001", T0);
  const total = pickupLegMs(c0);
  const loadingMs = c0.tl.steps[5].time - c0.tl.steps[4].time;
  // drive on through pickup and loading with the student's confirmations
  let clock = T0 + total * 2;
  s = settle(s, "dispatch-0001", clock);
  s = scoped(s, "dispatch-0001", (p) => T.confirmStatus(p, "arrived"));
  s = scoped(s, "dispatch-0001", (p) => T.confirmStatus(p, "loading"));
  clock += simMinutesToRealMs(loadingMs / MIN) * 2;
  s = settle(s, "dispatch-0001", clock);
  s = scoped(s, "dispatch-0001", (p) => T.confirmStatus(p, "pickedUp"));
  clock += 10000 * MIN; // far enough to reach the traffic report
  s = settle(s, "dispatch-0001", clock);
  let c = read(s, "dispatch-0001", clock);
  assert.equal(c.t.step, 8, "stopped at the reported traffic delay");
  assert.ok(c.open, "waiting for the student to handle it");
  assert.equal(c.t.segment, null);
  const delay = c.exc.minutes;
  assert.ok(delay > 0);
  assert.equal(c.snap.etaDelivery.getTime() - snapshotAt(c.tl, 7, { hosMinutes: 500 }).etaDelivery.getTime(), delay * MIN, "the ETA moved by the delay");
  assert.notEqual(c.snap.health, "ON TRACK");

  // handled + broker told: movement resumes, and the next segment includes the delay in real time
  s = scoped(s, "dispatch-0001", () => ({
    patch: {
      trackingFlags: { ...ops(s, "dispatch-0001").trackingFlags, ack: true, etaSolved: true, apptSolved: true, recorded: true },
      brokerUpdates: [{ id: "bu-1", step: 8, timestamp: "2026-10-12T20:00", text: "ok", required: true, valid: true, eta: "2026-10-13T08:00" }],
    },
  }));
  setNow(clock);
  s = settle(s, "dispatch-0001", clock);
  c = read(s, "dispatch-0001", clock);
  assert.deepEqual([c.t.segment.fromStep, c.t.segment.toStep], [8, 9]);
  const base = Math.round((c.tl.steps[9].time - c.tl.steps[8].time) / MIN);
  assert.equal(c.t.segment.durationSimMinutes, base);
  assert.ok(base >= delay, "that segment carries the delay minutes");
  assert.equal(c.t.segment.durationRealMs, Math.round(simMinutesToRealMs(base)));
  assert.ok(simMinutesToRealMs(delay) === (delay / 12) * MIN, "45 delay minutes are 3.75 real minutes");
});

// ---- driver updates --------------------------------------------------------------------------------------------

test("12-13. driver updates arrive at the configured thresholds, once", () => {
  let s = tripStarted(newDispatch(initialGameState), "dispatch-0001", "load-001", T0);
  const total = pickupLegMs(read(s, "dispatch-0001", T0));
  s = settle(s, "dispatch-0001", T0 + total * 2);
  const keys = () => ops(s, "dispatch-0001").trackingUpdates.map((u) => u.key);
  assert.deepEqual(keys(), ["pickup:start", "pickup:25", "pickup:50", "pickup:75", "pickup:90", "pickup:arrive"]);
  assert.deepEqual(ops(s, "dispatch-0001").trackingUpdates.map((u) => u.percent), [0, 25, 50, 75, 90, 100]);
  for (const u of ops(s, "dispatch-0001").trackingUpdates) {
    assert.match(u.text, /^Driver update: /);
    assert.ok(!/\{[a-zA-Z]+\}/.test(u.text), "every placeholder is filled from the dispatch's data");
  }
  const logged = ops(s, "dispatch-0001").activityLog.filter((e) => e.type === "driver-update");
  assert.equal(logged.length, 6, "each update is also an activity event");

  // no repeats after more settles, or after a refresh
  s = settle(s, "dispatch-0001", T0 + total * 9);
  s = { ...initialGameState, ...JSON.parse(JSON.stringify(s)) };
  s = settle(s, "dispatch-0001", T0 + total * 20);
  assert.equal(keys().length, 6);
  assert.equal(ops(s, "dispatch-0001").activityLog.filter((e) => e.type === "driver-update").length, 6);

  // the thresholds are configuration
  const cfg = simulationConfig.trackingTimeScale;
  const saved = cfg.driverUpdateThresholds;
  cfg.driverUpdateThresholds = [0.5];
  try {
    let s2 = tripStarted(newDispatch(initialGameState), "dispatch-0001", "load-001", T0);
    s2 = settle(s2, "dispatch-0001", T0 + total * 2);
    assert.deepEqual(ops(s2, "dispatch-0001").trackingUpdates.map((u) => u.key), ["pickup:start", "pickup:50", "pickup:arrive"]);
  } finally {
    cfg.driverUpdateThresholds = saved;
  }
});

test("14. a manual check call answers from the current position", () => {
  let s = tripStarted(newDispatch(initialGameState), "dispatch-0001", "load-004", T0);
  const total = pickupLegMs(read(s, "dispatch-0001", T0));
  const at = T0 + total * 0.7;
  s = settle(s, "dispatch-0001", at); // commit the checkpoint the truck has already passed
  const c = read(s, "dispatch-0001", at);
  assert.ok(c.snap.frac > 0.6 && c.snap.frac < 0.8);
  const stepped = snapshotAt(c.tl, c.t.step, { hosMinutes: 500 });
  setNow(at);
  s = scoped(s, "dispatch-0001", (p) => T.sendMessage(p, "What is your current location?"));
  const messages = ops(s, "dispatch-0001").trackingMessages;
  const reply = messages.filter((m) => m.from === "driver").at(-1).text;
  assert.ok(reply.includes(c.snap.location), `the reply names the live position: ${reply}`);
  assert.ok(reply.includes(String(c.snap.remainingMiles)) || c.snap.location !== stepped.location, "and is not the stale step position");
  const check = ops(s, "dispatch-0001").checkCallLog.at(-1);
  assert.equal(check.location, c.snap.location);
  // check calls and automatic updates are different event types
  const types = new Set(ops(s, "dispatch-0001").activityLog.map((e) => e.type));
  assert.ok(types.has("check-call") && types.has("driver-update"));
});

// ---- independence, limits, old saves, rewards ------------------------------------------------------------------

test("15. every dispatch has its own timer", () => {
  let s = newDispatch(initialGameState);
  s = newDispatch(s);
  s = tripStarted(s, "dispatch-0001", "load-001", T0);
  const total = pickupLegMs(read(s, "dispatch-0001", T0));
  s = tripStarted(s, "dispatch-0002", "load-004", T0 + total * 0.5); // started later
  const one = read(s, "dispatch-0001", T0 + total * 0.6);
  const two = read(s, "dispatch-0002", T0 + total * 0.6);
  assert.ok(one.snap.frac > two.snap.frac, "dispatch-0001 is further along");
  assert.notEqual(one.t.segment.startedAt, two.t.segment.startedAt);

  const before = JSON.stringify(getDispatchBySlug(s, "dispatch-0002"));
  s = settle(s, "dispatch-0001", T0 + total * 5);
  assert.equal(JSON.stringify(getDispatchBySlug(s, "dispatch-0002")), before, "settling one dispatch never touches another");
  assert.equal(read(s, "dispatch-0001").t.step, 3);
  assert.equal(read(s, "dispatch-0002").t.step, 1);
});

test("16. progress never exceeds 100% and positions never pass the segment end", () => {
  const seg = { startedAt: T0, durationRealMs: 60000 };
  assert.equal(segmentProgress(seg, T0 - 5000), 0);
  assert.equal(segmentProgress(seg, T0 + 30000), 0.5);
  assert.equal(segmentProgress(seg, T0 + 60000), 1);
  assert.equal(segmentProgress(seg, T0 + 6000000), 1);
  let s = tripStarted(newDispatch(initialGameState), "dispatch-0001", "load-001", T0);
  const c = read(s, "dispatch-0001", T0 + 1e12);
  assert.equal(c.snap.progress, 1);
  assert.ok(c.snap.frac <= c.tl.steps[2].frac + 1e-9);
  const j = getJourney({ tl: c.tl, snap: c.snap });
  assert.ok(j.tripPercent <= 100 && j.truckAt <= 100);
});

test("17. old tracking saves (no segment, no updates) still load and carry on", () => {
  let s = newDispatch(initialGameState);
  s = tripStarted(s, "dispatch-0001", "load-001", T0);
  s = scoped(s, "dispatch-0001", () => ({ patch: { trackingSegment: null, trackingUpdates: [], trackingStep: 2 } }));
  const record = getDispatchBySlug(s, "dispatch-0001");
  const old = { ...record, ops: { ...record.ops } };
  delete old.ops.trackingSegment;
  delete old.ops.trackingUpdates;
  s = { ...s, dispatches: s.dispatches.map((d) => (d.slug === "dispatch-0001" ? old : d)) };
  const c = read(s, "dispatch-0001", T0);
  assert.equal(c.ok, true);
  assert.deepEqual([c.t.segment, c.t.updates, c.t.step], [null, [], 2]);
  s = settle(s, "dispatch-0001", T0);
  assert.ok(ops(s, "dispatch-0001").trackingSegment, "movement resumes from the saved step");
  assert.equal(ops(s, "dispatch-0001").trackingStep, 2);
});

test("18. timer updates never repeat task rewards", () => {
  let s = tripStarted(newDispatch(initialGameState), "dispatch-0001", "load-001", T0);
  const total = pickupLegMs(read(s, "dispatch-0001", T0));
  const xp = s.xp;
  const tasks = JSON.stringify(getDispatchBySlug(s, "dispatch-0001").missionRuns["mission-06"].completedTasks);
  for (let i = 1; i <= 40; i++) s = settle(s, "dispatch-0001", T0 + (total * i) / 10);
  assert.equal(s.xp, xp, "ticking the clock pays no XP");
  assert.equal(JSON.stringify(getDispatchBySlug(s, "dispatch-0001").missionRuns["mission-06"].completedTasks), tasks, "and completes no tasks by itself");
  assert.ok(s.trainingLedger.tasks.every((k, i, all) => all.indexOf(k) === i));
});

test("the clock only reads timestamps: no counter is ever incremented", () => {
  const read2 = (f) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
  const actions = read2("lib/trackingActions.js");
  assert.ok(!/progress\s*\+=|setInterval/.test(actions), "no interval-driven progress in the tracker logic");
  assert.match(read2("lib/trackingTime.js"), /nowMs - segment\.startedAt/);
  const hook = read2("hooks/useTrackingMission.js");
  assert.match(hook, /visibilitychange/, "the tab waking up recalculates from timestamps");
});
