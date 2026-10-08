// Multi-dispatch tests. Every dispatch owns its state; global progress only holds rewards, level
// and the Load Board builder. Everything is pure state-in / state-out, run through the same
// projection + scoped-patch path the pages use (see lib/dispatchRecords.js).

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { initialGameState } from "@/data/users";
import { simulationConfig } from "@/data/simulationConfig";
import { mission03 } from "@/data/phase4Missions";
import { getLoad } from "@/lib/loadSelectors";
import { getRoster } from "@/lib/dispatchRoster";
import { evaluateDriver } from "@/lib/driverRules";
import * as P3 from "@/lib/phase3Actions";
import * as P4 from "@/lib/phase4Actions";
import * as C from "@/lib/commsActions";
import * as D from "@/lib/dispatchActions";
import * as T from "@/lib/trackingActions";
import {
  OPS_KEYS,
  createDispatchFromShortlist,
  createDispatchSlug,
  nextSequenceNumber,
  getDispatchBySlug,
  getDispatches,
  getActiveDispatches,
  getCompletedDispatches,
  getDispatchResumeRoute,
  projectDispatchState,
  applyScopedPatch,
  isDriverAvailableForDispatch,
  resolveLegacyRoute,
} from "@/lib/dispatchRecords";
import { migrateState } from "@/lib/dispatchMigration";
import { getDashboard } from "@/lib/dashboardStats";

const A = "load-001";
const B = "load-002";
const Cc = "load-003";
const GLOBAL_OK = new Set(["xp", "stars", "coins", "streak", "completedLevels", "currentLevel", "missionRuns", "savedBrokerIds", "recentBrokerIds"]);

// ---- helpers ------------------------------------------------------------------------------

const merge = (s, patch) => ({ ...s, ...patch });
const fresh = () => ({ ...initialGameState });

// Build a shortlist on the Load Board (the builder) and hand it off, like the Continue button does.
function newDispatch(s, ids) {
  for (const id of ids) s = merge(s, P3.shortlistLoad(s, id).patch);
  const res = createDispatchFromShortlist(s, s.shortlistedLoadIds, "2026-10-08T10:00:00.000Z");
  assert.equal(res.ok, true, res.message);
  return { state: merge(s, res.patch), slug: res.slug };
}

// Run an engine action against ONE dispatch: project, run, split the patch back by slug.
function scoped(s, slug, fn) {
  const record = getDispatchBySlug(s, slug);
  const out = fn(projectDispatchState(s, record));
  for (const key of Object.keys(out.patch ?? {})) assert.ok(OPS_KEYS.includes(key) || GLOBAL_OK.has(key), `unexpected patch key: ${key}`);
  const global = applyScopedPatch(s, slug, out.patch, "2026-10-08T11:00:00.000Z");
  return global ? merge(s, global) : s;
}
const opsOf = (s, slug) => getDispatchBySlug(s, slug).ops;
const snapshot = (s, slug) => JSON.stringify(getDispatchBySlug(s, slug));

// Put a dispatch at the "choose a load" step of Load Analysis (all earlier analysis tasks done).
function readyForChoice(s, slug) {
  const select = mission03.tasks.findIndex((t) => t.id === "select-best");
  const record = getDispatchBySlug(s, slug);
  const run = { ...record.missionRuns["mission-03"], started: true, currentTask: select, completedTasks: mission03.tasks.slice(0, select).map((t) => t.id) };
  return merge(s, { dispatches: getDispatches(s).map((d) => (d.slug === slug ? { ...d, missionRuns: { ...d.missionRuns, "mission-03": run } } : d)) });
}

const QUESTIONS = ["Is the load still available?", "What is the commodity?", "What is the weight?", "Confirm the equipment type", "What is the pickup date and time?", "What is the delivery date and time?", "Is the posted rate firm?", "What is the appointment type?", "What are the detention terms?", "Any special requirements?"];

// Choose a load, talk to its broker, negotiate, confirm and finalize: all inside one dispatch.
function dealOn(s, slug, loadId, extra = 100) {
  const load = getLoad(loadId);
  s = readyForChoice(s, slug);
  s = scoped(s, slug, (p) => P4.chooseBest(p, loadId));
  s = scoped(s, slug, (p) => C.startMission(p));
  s = scoped(s, slug, (p) => C.selectBroker(p, load.brokerId));
  s = scoped(s, slug, (p) => C.reviewDetails(p));
  for (const q of QUESTIONS) s = scoped(s, slug, (p) => C.sendMessage(p, q));
  s = scoped(s, slug, (p) => C.sendMessage(p, `Can you do $${load.rate + extra}? I have deadhead to the pickup.`));
  if (opsOf(s, slug).negotiation.status !== "agreed") s = scoped(s, slug, (p) => C.sendMessage(p, "That works for me, let's go with that."));
  s = scoped(s, slug, (p) => C.confirmAgreement(p));
  s = scoped(s, slug, (p) => C.finalizeLoad(p));
  assert.equal(opsOf(s, slug).loadFinalized, true);
  return s;
}

const suitableDrivers = (loadId) => getRoster().filter((e) => evaluateDriver(getLoad(loadId), e).suitable);

// Assign a driver the way the final step leaves it (the dispatch conversation is covered elsewhere).
function assign(s, slug, loadId, entry) {
  return scoped(s, slug, () => ({ patch: { assignedLoadId: loadId, assignedDriverId: entry.driver.id, assignedTruckId: entry.truck.id, assignmentTimestamp: simulationConfig.clock.now, selectedDriverId: entry.driver.id, dispatchSent: true, driverConfirmed: true } }));
}

// ---- A / B: creating dispatches -------------------------------------------------------------

test("A. the Load Board hands a shortlist to a NEW dispatch and the builder resets", () => {
  let s = fresh();
  for (const id of [A, B, Cc]) s = merge(s, P3.shortlistLoad(s, id).patch);
  assert.deepEqual(s.shortlistedLoadIds, [A, B, Cc]);

  const res = createDispatchFromShortlist(s, s.shortlistedLoadIds);
  assert.equal(res.ok, true);
  assert.equal(res.slug, "dispatch-0001");
  s = merge(s, res.patch);
  assert.deepEqual(opsOf(s, "dispatch-0001").shortlistedLoadIds, [A, B, Cc], "the shortlist lives in the dispatch");
  assert.deepEqual(s.shortlistedLoadIds, [], "0 / 3 on the next Load Board");
  assert.deepEqual(s.reviewedLoadIds, []);
  assert.equal(s.selectedLoadId, null);
  assert.equal(getDispatchResumeRoute(getDispatchBySlug(s, "dispatch-0001")), "/dispatcher/load-analysis/dispatch-0001");
});

test("A2. a failed creation leaves the builder untouched", () => {
  let s = fresh();
  s = merge(s, P3.shortlistLoad(s, A).patch); // one load: below the minimum
  const res = createDispatchFromShortlist(s, s.shortlistedLoadIds);
  assert.equal(res.ok, false);
  assert.equal(res.patch, undefined);
  assert.deepEqual(s.shortlistedLoadIds, [A]);
  assert.equal(getDispatches(s).length, 0);
});

test("B. a second dispatch starts fresh and leaves the first unchanged", () => {
  let { state: s } = newDispatch(fresh(), [A, B, Cc]);
  const before = snapshot(s, "dispatch-0001");
  const second = newDispatch(s, [B, "load-004"]);
  s = second.state;
  assert.equal(second.slug, "dispatch-0002");
  assert.deepEqual(opsOf(s, "dispatch-0002").shortlistedLoadIds, [B, "load-004"]);
  assert.equal(snapshot(s, "dispatch-0001"), before);
});

test("slugs are unique, padded and never reused", () => {
  assert.equal(createDispatchSlug(1), "dispatch-0001");
  assert.equal(createDispatchSlug(12), "dispatch-0012");
  const s = { ...fresh(), dispatches: [{ sequenceNumber: 1 }, { sequenceNumber: 2 }, { sequenceNumber: 4 }] };
  assert.equal(nextSequenceNumber(s), 5, "not derived from array length");
  assert.equal(nextSequenceNumber({ ...fresh(), dispatches: [{ sequenceNumber: 1 }], dispatchSeq: 7 }), 8, "a removed record's number is not reused");
  const { state } = newDispatch(fresh(), [A, B]);
  assert.equal(new Set(getDispatches(state).map((d) => d.slug)).size, 1);
});

// ---- C / D / E / F: isolation ---------------------------------------------------------------

test("C. analysis selections are isolated per dispatch", () => {
  let s = newDispatch(fresh(), [A, B, Cc]).state;
  s = newDispatch(s, [A, B, "load-004"]).state;
  s = readyForChoice(readyForChoice(s, "dispatch-0001"), "dispatch-0002");
  s = scoped(s, "dispatch-0001", (p) => P4.chooseBest(p, A));
  const first = snapshot(s, "dispatch-0001");
  s = scoped(s, "dispatch-0002", (p) => P4.chooseBest(p, B));
  assert.equal(opsOf(s, "dispatch-0001").selectedBestLoadId, A);
  assert.equal(opsOf(s, "dispatch-0002").selectedBestLoadId, B);
  assert.equal(snapshot(s, "dispatch-0001"), first, "updating dispatch-0002 did not touch dispatch-0001");
  // a candidate can still be changed inside one dispatch
  s = scoped(s, "dispatch-0001", (p) => P4.chooseBest(p, B));
  assert.equal(opsOf(s, "dispatch-0001").selectedBestLoadId, B);
  assert.equal(opsOf(s, "dispatch-0002").selectedBestLoadId, B);
});

test("D. broker conversations and agreed rates never overwrite each other", () => {
  let s = newDispatch(fresh(), [A, B]).state;
  s = newDispatch(s, [A, B]).state;
  s = dealOn(s, "dispatch-0001", A, 100);
  const first = snapshot(s, "dispatch-0001");
  s = dealOn(s, "dispatch-0002", B, 40);
  const o1 = opsOf(s, "dispatch-0001");
  const o2 = opsOf(s, "dispatch-0002");
  assert.equal(o1.negotiatedLoadId, A);
  assert.equal(o2.negotiatedLoadId, B);
  assert.equal(o1.selectedBrokerId, getLoad(A).brokerId);
  assert.equal(o2.selectedBrokerId, getLoad(B).brokerId);
  assert.notEqual(o1.agreedRate, o2.agreedRate);
  assert.equal(snapshot(s, "dispatch-0001"), first);
  assert.equal(s.negotiatedLoadId, null, "no global agreed deal exists");
});

test("E. driver assignments are independent", () => {
  let s = newDispatch(fresh(), [A, B]).state;
  s = newDispatch(s, [A, B]).state;
  s = dealOn(s, "dispatch-0001", A);
  s = dealOn(s, "dispatch-0002", B);
  const dA = suitableDrivers(A)[0];
  const dB = suitableDrivers(B).find((e) => e.id !== dA.id) ?? suitableDrivers(B)[0];
  s = assign(s, "dispatch-0001", A, dA);
  const first = snapshot(s, "dispatch-0001");
  s = assign(s, "dispatch-0002", B, dB);
  assert.equal(opsOf(s, "dispatch-0001").assignedDriverId, dA.driver.id);
  assert.equal(opsOf(s, "dispatch-0002").assignedDriverId, dB.driver.id);
  assert.equal(snapshot(s, "dispatch-0001"), first);
});

test("driver availability follows active dispatches (configurable)", () => {
  let s = newDispatch(fresh(), [A, B]).state;
  s = newDispatch(s, [A, B]).state;
  s = dealOn(s, "dispatch-0001", A);
  s = dealOn(s, "dispatch-0002", A);
  const d = suitableDrivers(A)[0];
  s = assign(s, "dispatch-0001", A, d);
  const id2 = getDispatchBySlug(s, "dispatch-0002").id;
  assert.equal(isDriverAvailableForDispatch(s, d.driver.id, id2), true, "reuse is allowed by default");
  simulationConfig.allowDriverReuse = false;
  try {
    assert.equal(isDriverAvailableForDispatch(s, d.driver.id, id2), false);
    const blocked = scoped(s, "dispatch-0002", (p) => D.selectDriver(D.startMission(p).patch ? { ...p, ...D.startMission(p).patch } : p, d.driver.id));
    assert.equal(opsOf(blocked, "dispatch-0002").selectedDriverId, null, "an assigned driver cannot be chosen elsewhere");
  } finally {
    simulationConfig.allowDriverReuse = true;
  }
});

test("F. tracking progresses independently per dispatch", () => {
  let s = newDispatch(fresh(), [A, B]).state;
  s = newDispatch(s, [A, B]).state;
  s = dealOn(s, "dispatch-0001", A);
  s = dealOn(s, "dispatch-0002", B);
  s = assign(s, "dispatch-0001", A, suitableDrivers(A)[0]);
  s = assign(s, "dispatch-0002", B, suitableDrivers(B)[0]);
  const second = snapshot(s, "dispatch-0002");
  s = scoped(s, "dispatch-0001", (p) => T.startMission(p));
  s = scoped(s, "dispatch-0001", (p) => T.startTrip(p));
  s = scoped(s, "dispatch-0001", (p) => T.advance(p));
  assert.ok(opsOf(s, "dispatch-0001").trackingStep >= 1);
  assert.equal(opsOf(s, "dispatch-0002").trackingStep, 0);
  assert.equal(snapshot(s, "dispatch-0002"), second, "dispatch-0002 did not change");
  // switching away and back keeps dispatch-0001's progress
  const step = opsOf(s, "dispatch-0001").trackingStep;
  s = scoped(s, "dispatch-0002", (p) => T.startMission(p));
  assert.equal(opsOf(s, "dispatch-0001").trackingStep, step);
});

// ---- G / H: completion and the dashboard ---------------------------------------------------

function completeDispatch(s, slug) {
  return scoped(s, slug, (p) => ({ patch: { missionRuns: { ...p.missionRuns, "mission-06": { ...p.missionRuns["mission-06"], started: true, completed: true } }, arrivalConfirmed: true } }));
}

test("G. a completed dispatch stays in history, is read-only, and the Load Board still serves the next one", () => {
  let s = newDispatch(fresh(), [A, B]).state;
  s = dealOn(s, "dispatch-0001", A);
  s = assign(s, "dispatch-0001", A, suitableDrivers(A)[0]);
  s = completeDispatch(s, "dispatch-0001");
  const done = getDispatchBySlug(s, "dispatch-0001");
  assert.equal(done.completion.isCompleted, true);
  assert.equal(done.workflowStage, "COMPLETED");
  assert.ok(done.completedAt);
  assert.equal(getCompletedDispatches(s).length, 1);
  assert.equal(getActiveDispatches(s).length, 0);

  const frozen = snapshot(s, "dispatch-0001");
  const attempt = applyScopedPatch(s, "dispatch-0001", { selectedBestLoadId: B });
  assert.equal(attempt, null, "completed dispatches reject writes");
  assert.equal(snapshot(s, "dispatch-0001"), frozen);

  const next = newDispatch(s, [B, Cc]);
  assert.equal(next.slug, "dispatch-0002");
  assert.equal(snapshot(next.state, "dispatch-0001"), frozen);
  assert.equal(getDispatchResumeRoute(done), "/dispatcher/dispatches/dispatch-0001");
});

test("H. the dashboard aggregates every dispatch without double counting", () => {
  let s = newDispatch(fresh(), [A, B]).state;
  s = newDispatch(s, [A, B]).state;
  s = newDispatch(s, [A, B]).state;
  // 0001 completed, 0002 in transit, 0003 negotiated (pending)
  s = dealOn(s, "dispatch-0001", A);
  s = assign(s, "dispatch-0001", A, suitableDrivers(A)[0]);
  s = completeDispatch(s, "dispatch-0001");
  s = dealOn(s, "dispatch-0002", B);
  s = assign(s, "dispatch-0002", B, suitableDrivers(B)[0]);
  s = scoped(s, "dispatch-0002", (p) => T.startMission(p));
  s = scoped(s, "dispatch-0002", (p) => T.startTrip(p));
  s = scoped(s, "dispatch-0002", (p) => T.advance(p));
  s = dealOn(s, "dispatch-0003", A);

  const dash = getDashboard(s);
  assert.deepEqual({ total: dash.stats.total, active: dash.stats.active, pending: dash.stats.pending, completed: dash.stats.completed }, { total: 3, active: 1, pending: 1, completed: 1 });
  assert.equal(dash.records.length, 3);
  assert.deepEqual(dash.records.map((r) => r.slug), ["dispatch-0003", "dispatch-0002", "dispatch-0001"]);
  for (const r of dash.records) assert.equal(r.resumeRoute.endsWith(r.slug), true, "every Resume goes to its own dispatch");
  assert.ok(dash.activity.every((e) => /^Dispatch #\d{3} — /.test(e.message)), "aggregated activity is tagged by dispatch");
  assert.ok(!dash.activity.some((e) => e.dispatchSlug === "dispatch-0003" && /Dispatch #001/.test(e.message)), "activity is not mixed between dispatches");
});

// ---- I / J / K: refresh, invalid slug, old routes -------------------------------------------

test("I. a refresh restores the same dispatch from the saved state alone", () => {
  let s = newDispatch(fresh(), [A, B]).state;
  s = newDispatch(s, [A, B]).state;
  s = dealOn(s, "dispatch-0002", B);
  const reloaded = { ...initialGameState, ...JSON.parse(JSON.stringify(s)) };
  assert.deepEqual(opsOf(reloaded, "dispatch-0002"), opsOf(s, "dispatch-0002"));
  const view = projectDispatchState(reloaded, getDispatchBySlug(reloaded, "dispatch-0002"));
  assert.equal(view.negotiatedLoadId, B);
  assert.equal(C.readComms(view).comms.selectedBrokerId, getLoad(B).brokerId);
  assert.equal(opsOf(reloaded, "dispatch-0001").negotiatedLoadId, null);
});

test("J. an unknown slug resolves to nothing and cannot be written", () => {
  const s = newDispatch(fresh(), [A, B]).state;
  assert.equal(getDispatchBySlug(s, "dispatch-9999"), null);
  assert.equal(applyScopedPatch(s, "dispatch-9999", { selectedBestLoadId: A }), null);
});

test("K. old non-slug routes resolve to the matching dispatch, the hub, or the Load Board", () => {
  let s = fresh();
  assert.equal(resolveLegacyRoute(s, "brokers"), "/dispatcher/load-board", "no dispatches: start a new one");
  assert.equal(resolveLegacyRoute(s, "analysis"), "/dispatcher/load-board");
  s = newDispatch(s, [A, B]).state;
  assert.equal(resolveLegacyRoute(s, "analysis"), "/dispatcher/load-analysis/dispatch-0001", "exactly one: go to it");
  assert.equal(resolveLegacyRoute(s, "tracking"), "/dispatcher/dispatches", "none at that stage: the hub");
  s = newDispatch(s, [A, B]).state;
  assert.equal(resolveLegacyRoute(s, "analysis"), "/dispatcher/dispatches", "several: let the student choose");
});

// ---- L: migration -----------------------------------------------------------------------------

function legacySave() {
  const base = { ...initialGameState };
  delete base.schemaVersion;
  delete base.dispatches;
  delete base.dispatchSeq;
  delete base.trainingLedger;
  const select = mission03.tasks.length;
  return {
    ...base,
    xp: 480,
    stars: 6,
    completedLevels: [1, 2, 3, 4],
    currentLevel: 5,
    shortlistedLoadIds: [A, B, Cc],
    selectedBestLoadId: A,
    commsLoadId: A,
    selectedBrokerId: getLoad(A).brokerId,
    negotiatedLoadId: A,
    agreedRate: 2700,
    brokerConfirmed: true,
    loadFinalized: true,
    missionRuns: {
      ...base.missionRuns,
      "mission-03": { ...base.missionRuns["mission-03"], started: true, completed: true, currentTask: select, completedTasks: mission03.tasks.map((t) => t.id) },
      "mission-04": { ...base.missionRuns["mission-04"], started: true, completed: true, completedTasks: ["select-broker"] },
    },
  };
}

test("L. an old single-dispatch save becomes dispatch-0001 once, losing nothing", () => {
  const saved = legacySave();
  const merged = { ...initialGameState, ...saved };
  const migrated = migrateState(merged, undefined, "2026-10-08T09:00:00.000Z");
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(getDispatches(migrated).length, 1);
  const d = getDispatches(migrated)[0];
  assert.equal(d.slug, "dispatch-0001");
  assert.equal(d.ops.selectedBestLoadId, A);
  assert.equal(d.ops.negotiatedLoadId, A);
  assert.equal(d.ops.agreedRate, 2700);
  assert.deepEqual(d.ops.shortlistedLoadIds, [A, B, Cc]);
  assert.equal(migrated.xp, 480);
  assert.equal(migrated.stars, 6);
  assert.deepEqual(migrated.completedLevels, [1, 2, 3, 4]);
  assert.deepEqual(migrated.shortlistedLoadIds, [], "the Load Board starts fresh");
  assert.ok(migrated.trainingLedger.missions.includes("mission-03"), "earned rewards are in the ledger");
  assert.ok(migrated.trainingLedger.tasks.includes("mission-04:select-broker"));

  // idempotent: running it again (or on an already migrated save) never adds a second dispatch
  assert.equal(getDispatches(migrateState(migrated, 2)).length, 1);
  assert.equal(getDispatches(migrateState({ ...migrated, schemaVersion: undefined }, undefined)).length, 1, "existing records are never duplicated");
  assert.equal(nextSequenceNumber(migrated), 2);
});

test("L2. a save with no operational progress migrates without inventing a dispatch", () => {
  const migrated = migrateState({ ...initialGameState, xp: 20 }, undefined);
  assert.equal(getDispatches(migrated).length, 0);
  assert.equal(migrated.schemaVersion, 2);
});

// ---- M: rewards -------------------------------------------------------------------------------

test("M. practice repeats across dispatches but one-time XP and mission rewards are paid once", () => {
  let s = newDispatch(fresh(), [A, B]).state;
  s = newDispatch(s, [A, B]).state;
  s = newDispatch(s, [A, B]).state;
  s = dealOn(s, "dispatch-0001", A);
  const xpAfterFirst = s.xp;
  assert.ok(xpAfterFirst > 0, "the first pass earns XP");
  s = scoped(s, "dispatch-0001", (p) => C.completeMission(p));
  const starsAfterFirst = s.stars;
  assert.ok(starsAfterFirst > 0);
  assert.equal(getDispatchBySlug(s, "dispatch-0001").missionRuns["mission-04"].completed, true);

  s = dealOn(s, "dispatch-0002", B, 40);
  s = dealOn(s, "dispatch-0003", A, 60);
  assert.equal(s.xp, xpAfterFirst, "the same tasks in later dispatches pay no XP");
  s = scoped(s, "dispatch-0002", (p) => C.completeMission(p));
  s = scoped(s, "dispatch-0003", (p) => C.completeMission(p));
  assert.equal(s.stars, starsAfterFirst, "no repeated mission reward");
  assert.equal(getDispatchBySlug(s, "dispatch-0003").missionRuns["mission-04"].completed, true, "but each dispatch can finish its own practice");
  assert.equal(opsOf(s, "dispatch-0003").negotiatedLoadId, A, "practice itself is fully allowed");
});

// ---- N: switching -----------------------------------------------------------------------------

test("N. switching between dispatches always shows the dispatch in the URL", () => {
  let s = newDispatch(fresh(), [A, B]).state;
  s = newDispatch(s, [A, B]).state;
  s = newDispatch(s, [A, B]).state;
  s = dealOn(s, "dispatch-0002", B);
  for (const slug of ["dispatch-0003", "dispatch-0001", "dispatch-0002", "dispatch-0001"]) {
    const record = getDispatchBySlug(s, slug);
    const view = projectDispatchState(s, record);
    assert.equal(record.slug, slug);
    assert.equal(view.activeDispatchId, record.id);
    assert.equal(view.negotiatedLoadId, slug === "dispatch-0002" ? B : null);
    assert.ok(getDispatchResumeRoute(record).endsWith(slug));
  }
});

// ---- O: no singleton dependence in the operational UI ---------------------------------------

test("O. operational components resolve everything through a dispatch", () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/components");
  const dirs = ["brokers", "dispatch", "tracking", "analysis", "practice"];
  const legacy = /\bstate\.(selectedBestLoadId|agreedRate|assignedDriverId|assignedTruckId|trackingStep|negotiatedLoadId|assignedLoadId)\b/;
  for (const dir of dirs) {
    for (const file of readdirSync(path.join(root, dir)).filter((f) => f.endsWith(".js"))) {
      const src = readFileSync(path.join(root, dir, file), "utf8");
      assert.ok(!/from "@\/hooks\/useGameProgress"/.test(src), `${dir}/${file} must use a dispatch scope, not the global store`);
      if (legacy.test(src)) assert.ok(src.includes("projectDispatchState"), `${dir}/${file} reads singleton fields without projecting a dispatch`);
    }
  }
});
