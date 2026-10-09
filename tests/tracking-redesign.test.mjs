// Tracking journey view: the presentation model only reshapes the tracker's own output, for every
// shipment state, and separate dispatches keep separate progress.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { initialGameState } from "@/data/users";
import { trackingScenario, trackingStatuses } from "@/data/phase7Missions";
import { getLoad } from "@/lib/loadSelectors";
import { getRoster } from "@/lib/dispatchRoster";
import { evaluateDriver } from "@/lib/driverRules";
import { buildTimeline, snapshotAt } from "@/lib/trackingEngine";
import * as P3 from "@/lib/phase3Actions";
import * as T from "@/lib/trackingActions";
import { createDispatchFromShortlist, getDispatchBySlug, projectDispatchState, applyScopedPatch } from "@/lib/dispatchRecords";
import { getJourney, getStatusSteps, getHealthReason, getRecentEvents, getPhase } from "@/lib/trackingJourney";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");
const read = (f) => readFileSync(path.join(SRC, f), "utf8");

// ---- every shipment state --------------------------------------------------------------------------

function timelineFor(loadId) {
  const load = getLoad(loadId);
  const entry = getRoster().find((e) => evaluateDriver(load, e).suitable);
  assert.ok(entry, `a driver can serve ${loadId}`);
  const tl = buildTimeline(load, entry, "2026-10-12T08:00");
  return { load, entry, tl };
}

test("journey: every step maps to a phase and consistent numbers", () => {
  for (const loadId of ["load-001", "load-002", "load-004", "load-015"]) {
    const { tl, entry } = timelineFor(loadId);
    let lastCompleted = -1;
    const phases = [];
    for (let step = 0; step <= tl.lastStep; step++) {
      const snap = snapshotAt(tl, step, { hosMinutes: entry.driver.hosMinutes });
      const j = getJourney({ tl, snap });
      phases.push(j.phase);
      assert.equal(j.total, tl.deadhead + tl.loadedMiles, "total = deadhead + loaded");
      assert.equal(j.remaining, snap.remainingMiles, "remaining comes from the tracker");
      assert.equal(j.completed + j.remaining, j.total);
      assert.ok(j.completed >= lastCompleted, "progress never goes backwards");
      lastCompleted = j.completed;
      assert.ok(j.tripPercent >= 0 && j.tripPercent <= 100);
      assert.ok(j.legPercent >= 0 && j.legPercent <= 100);
      assert.ok(j.truckAt >= 0 && j.truckAt <= 100);
      for (const c of j.checkpoints) assert.ok(c.at >= 0 && c.at <= 100);
      assert.equal(getPhase(snap), j.phase);
    }
    // the states appear in order: to pickup, at pickup, loaded, arrived
    const order = ["to-pickup", "at-pickup", "loaded", "arrived"];
    const idx = phases.map((p) => order.indexOf(p));
    assert.deepEqual([...idx].sort((a, b) => a - b), idx, `${loadId} phases only move forward`);
    assert.deepEqual([...new Set(phases)], order);

    const first = getJourney({ tl, snap: snapshotAt(tl, 0, { hosMinutes: 500 }) });
    assert.equal(first.tripPercent, 0);
    assert.equal(first.pickupDone, false);
    const last = getJourney({ tl, snap: snapshotAt(tl, tl.lastStep, { hosMinutes: 500 }) });
    assert.deepEqual([last.tripPercent, last.remaining, last.phase, last.pickupDone], [100, 0, "arrived", true]);
  }
});

test("journey: deadhead and loaded legs are shown from the real miles", () => {
  const { tl } = timelineFor("load-004"); // a load with a long deadhead
  const ready = getJourney({ tl, snap: snapshotAt(tl, 0, { hosMinutes: 500 }) });
  assert.equal(ready.showDeadhead, true);
  assert.equal(ready.deadhead, tl.deadhead);
  assert.equal(ready.loaded, tl.loadedMiles);
  assert.ok(ready.split >= 18 && ready.split <= 55);
  assert.equal(ready.truckAt, 0);
  const pickedUpStep = tl.steps.findIndex((s) => s.status === "picked-up");
  const loaded = getJourney({ tl, snap: snapshotAt(tl, pickedUpStep, { hosMinutes: 500 }) });
  assert.equal(loaded.phase, "loaded");
  assert.equal(loaded.showDeadhead, false, "after pickup only the loaded route is drawn");
  assert.equal(loaded.legPercent, 0);
  assert.equal(loaded.pickupDone, true);
  const mid = tl.steps.findIndex((s) => s.leg === "pickup" && s.frac === 0.5);
  const toPickup = getJourney({ tl, snap: snapshotAt(tl, mid, { hosMinutes: 500 }) });
  assert.equal(toPickup.phase, "to-pickup");
  assert.equal(toPickup.legPercent, 50);
  assert.equal(toPickup.toPickupRemaining, tl.deadhead - Math.round(tl.deadhead * 0.5) ? toPickup.toPickupRemaining : 0);

  // no deadhead (truck already at the pickup): only the loaded route
  const { tl: tl0 } = timelineFor("load-002");
  assert.equal(tl0.deadhead, 0);
  assert.equal(getJourney({ tl: tl0, snap: snapshotAt(tl0, 0, { hosMinutes: 500 }) }).showDeadhead, false);
});

test("status stepper marks done, current and upcoming for each state", () => {
  const { tl } = timelineFor("load-001");
  const current = (step) => getStatusSteps(snapshotAt(tl, step, { hosMinutes: 500 }));
  const labels = current(0).map((s) => s.label);
  assert.deepEqual(labels, ["Assigned", "Driver Confirmed", "Ready for Pickup", "En Route to Pickup", "Arrived at Pickup", "Loading", "Picked Up", "In Transit", "Arrived at Delivery"]);
  const states = (step) => current(step).map((s) => s.state);
  assert.deepEqual(states(0), ["done", "done", "current", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming"]);
  const enRoute = tl.steps.findIndex((s) => s.status === "en-route-pickup");
  assert.equal(current(enRoute).find((s) => s.state === "current").label, "En Route to Pickup");
  for (const status of Object.keys(trackingStatuses)) {
    const step = tl.steps.findIndex((s) => s.status === status);
    const cur = current(step).filter((s) => s.state === "current");
    assert.ok(cur.length <= 1);
    if (status !== "arrived-delivery") assert.equal(cur.length, 1, status);
  }
  assert.ok(current(tl.lastStep).every((s) => s.state === "done"), "arrival completes every step");
  const monitoring = tl.steps.findIndex((s) => s.status === "monitoring");
  assert.equal(current(monitoring).find((s) => s.state === "current").label, "In Transit", "monitoring is part of In Transit");
});

test("health explanation appears only when not on track, and uses the tracker's ETA", () => {
  let seenReason = 0;
  let seenOk = 0;
  for (const loadId of ["load-001", "load-002", "load-003", "load-004", "load-010", "load-015", "load-019"]) {
    const { tl, entry } = timelineFor(loadId);
    for (let step = 0; step <= tl.lastStep; step++) {
      const snap = snapshotAt(tl, step, { hosMinutes: entry.driver.hosMinutes });
      const reason = getHealthReason({ snap });
      if (snap.health === "ON TRACK") {
        assert.equal(reason, null);
        seenOk++;
      } else {
        assert.ok(reason && /window closes/.test(reason.window), `${loadId} step ${step}`);
        seenReason++;
      }
    }
  }
  assert.ok(seenOk > 0);
  assert.ok(seenReason > 0, "the data contains at-risk or delayed states to explain (the scripted traffic delay)");
});

test("the traffic delay shows up as AT RISK / DELAYED with a cause", () => {
  const { tl, entry } = timelineFor("load-001");
  const trafficStep = tl.steps.findIndex((s) => s.delay?.exception);
  const snap = snapshotAt(tl, trafficStep, { hosMinutes: entry.driver.hosMinutes });
  assert.notEqual(snap.health, "ON TRACK");
  const reason = getHealthReason({ snap });
  assert.equal(reason.cause, `${trackingScenario.delays.traffic.label}: +${trackingScenario.delays.traffic.minutes} min.`);
});

test("recent events: the latest five, oldest first", () => {
  const t = { activity: Array.from({ length: 8 }, (_, i) => ({ id: `e${i}`, message: `m${i}`, timestamp: "2026-10-12T08:00" })) };
  assert.deepEqual(getRecentEvents(t, 5).map((e) => e.id), ["e3", "e4", "e5", "e6", "e7"]);
  assert.deepEqual(getRecentEvents({ activity: [] }), []);
  assert.deepEqual(getRecentEvents({}), []);
});

// ---- multi-dispatch: separate progress ---------------------------------------------------------------

const merge = (s, patch) => ({ ...s, ...patch });
function newDispatch(s, ids) {
  for (const id of ids) s = merge(s, P3.shortlistLoad(s, id).patch);
  const res = createDispatchFromShortlist(s, s.shortlistedLoadIds, "2026-10-08T10:00:00.000Z");
  assert.equal(res.ok, true);
  return merge(s, res.patch);
}
function scoped(s, slug, fn) {
  const out = fn(projectDispatchState(s, getDispatchBySlug(s, slug)));
  const g = applyScopedPatch(s, slug, out.patch, "2026-10-08T11:00:00.000Z");
  return g ? merge(s, g) : s;
}
function assigned(s, slug, loadId) {
  const entry = getRoster().find((e) => evaluateDriver(getLoad(loadId), e).suitable);
  return scoped(s, slug, () => ({ patch: { negotiatedLoadId: loadId, assignedLoadId: loadId, assignedDriverId: entry.driver.id, assignedTruckId: entry.truck.id, assignmentTimestamp: "2026-10-12T08:00" } }));
}
const journeyOf = (s, slug) => {
  const c = T.readTracking(projectDispatchState(s, getDispatchBySlug(s, slug)));
  return { c, j: getJourney({ tl: c.tl, snap: c.snap }) };
};

test("dispatch-0001 and dispatch-0004 keep separate journeys", () => {
  let s = newDispatch(initialGameState, ["load-001", "load-002"]);
  s = newDispatch(s, ["load-001", "load-002"]);
  s = newDispatch(s, ["load-001", "load-002"]);
  s = newDispatch(s, ["load-004", "load-015"]);
  s = assigned(s, "dispatch-0001", "load-001");
  s = assigned(s, "dispatch-0004", "load-004");

  s = scoped(s, "dispatch-0001", (p) => T.startMission(p));
  s = scoped(s, "dispatch-0001", (p) => T.startTrip(p));
  for (let i = 0; i < 3; i++) s = scoped(s, "dispatch-0001", (p) => T.advance(p));
  const a = journeyOf(s, "dispatch-0001");
  const b = journeyOf(s, "dispatch-0004");
  assert.ok(a.j.tripPercent > 0, "dispatch-0001 moved");
  assert.equal(b.j.tripPercent, 0, "dispatch-0004 did not");
  assert.equal(b.c.snap.statusId, "ready-for-pickup");
  assert.notEqual(a.c.load.id, b.c.load.id);
  assert.notEqual(a.j.total, b.j.total, "different routes have different miles");

  // advancing 0004 leaves 0001 exactly where it was
  const before = JSON.stringify(getDispatchBySlug(s, "dispatch-0001"));
  s = scoped(s, "dispatch-0004", (p) => T.startMission(p));
  s = scoped(s, "dispatch-0004", (p) => T.startTrip(p));
  s = scoped(s, "dispatch-0004", (p) => T.advance(p));
  assert.equal(JSON.stringify(getDispatchBySlug(s, "dispatch-0001")), before);
  assert.ok(journeyOf(s, "dispatch-0004").j.tripPercent >= 0);
  assert.equal(getRecentEvents(journeyOf(s, "dispatch-0001").c.t).every((e) => !/Dispatch 4/.test(e.message)), true);
});

// ---- the screen is built as designed -----------------------------------------------------------------

test("the page: journey first, one primary action, map and details behind drawers", () => {
  const page = read("components/tracking/TrackingPage.js");
  assert.match(page, /<JourneyCard/);
  assert.match(page, /<RecentEvents/);
  assert.ok(!/<TrackingStatus/.test(page), "the old status bar is gone (the dispatch bar carries the context)");
  // the map only exists inside its drawer
  const mapUses = page.match(/<LiveMap/g) ?? [];
  assert.equal(mapUses.length, 1);
  assert.match(page, /open=\{drawer === "map"\}[^>]*>\s*<LiveMap/);
  assert.match(page, /open=\{drawer === "details"\}[^>]*>\s*<ShipmentDetails/);
  assert.match(page, /open=\{drawer === "activity"\}/);
  // one primary action: the task bar keeps no button of its own once the mission started
  assert.match(page, /<MissionTaskBar[^>]*hideCta/);
  assert.ok(!/Advance Simulation/.test(page), "no Advance Simulation button in the normal workflow");
  assert.match(page, /advance: null/);
  const next = read("components/tracking/NextAction.js");
  assert.ok(!/Advance Simulation|Advance to Next Event/.test(next));
  assert.match(next, /m\.devControls &&[\s\S]*Skip to Next Event/, "the skip control exists for development builds only");
  for (const label of ["Contact Driver", "View Map", "Shipment Details", "More"]) assert.ok(next.includes(label), label);
  const bar = read("components/game/MissionTaskBar.js");
  assert.match(bar, /else if \(hideCta\) cta = null/);
});

test("shipment details list every requested field", () => {
  const src = read("components/tracking/ShipmentDetails.js");
  for (const label of ["Load ID", "Broker", "Agreed rate", "Driver", "Truck", "Equipment", "Weight", "Commodity", "Pickup", "Delivery", "Appointment", "Special requirements", "Deadhead", "Loaded miles", "Total miles"]) {
    assert.ok(src.includes(`label="${label}"`), label);
  }
});
