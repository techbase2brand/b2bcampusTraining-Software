// P0 usability tests: visible task checklists, one-primary-action rules, hidden unfinished UI,
// reset safety, and the multi-dispatch guarantees those changes must not break.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { initialGameState } from "@/data/users";
import { features } from "@/data/features";
import { dispatcherNav, homeNav } from "@/data/navigation";
import { mission02 } from "@/data/phase3Missions";
import { mission03 } from "@/data/phase4Missions";
import { mission04 } from "@/data/phase5Missions";
import { mission05 } from "@/data/phase6Missions";
import { mission06 } from "@/data/phase7Missions";
import { simulationConfig } from "@/data/simulationConfig";
import { getLoad } from "@/lib/loadSelectors";
import { getRoster } from "@/lib/dispatchRoster";
import { evaluateDriver } from "@/lib/driverRules";
import * as P3 from "@/lib/phase3Actions";
import * as P4 from "@/lib/phase4Actions";
import * as C from "@/lib/commsActions";
import * as D from "@/lib/dispatchActions";
import { createDispatchFromShortlist, getDispatchBySlug, projectDispatchState, applyScopedPatch } from "@/lib/dispatchRecords";
import { getBoardChecklist, getAnalysisChecklist, getBrokerChecklist, getDispatchChecklist, getTrackingChecklist, checklistProgress, missingItems, missingText } from "@/lib/taskChecklists";
import { orderChips } from "@/lib/chipOrder";
import { getShortlistCta } from "@/lib/shortlistCta";
import { isResetConfirmed, RESET_WORD } from "@/lib/resetSafety";
import { getCompletionStats } from "@/lib/completionStats";
import { resolveNav, canAccessRoute } from "@/lib/access";
import { validateShortlist } from "@/lib/loadRules";
import { commsTopics } from "@/data/brokerComms";

const A = "load-001";
const B = "load-002";
const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");

// ---- helpers (same projection + scoped-patch path the pages use) ---------------------------------

const merge = (s, patch) => ({ ...s, ...patch });
function newDispatch(s, ids = [A, B]) {
  for (const id of ids) s = merge(s, P3.shortlistLoad(s, id).patch);
  const res = createDispatchFromShortlist(s, s.shortlistedLoadIds, "2026-10-08T10:00:00.000Z");
  assert.equal(res.ok, true);
  return { state: merge(s, res.patch), slug: res.slug };
}
function scoped(s, slug, fn) {
  const out = fn(projectDispatchState(s, getDispatchBySlug(s, slug)));
  const global = applyScopedPatch(s, slug, out.patch, "2026-10-08T11:00:00.000Z");
  return global ? merge(s, global) : s;
}
const view = (s, slug) => projectDispatchState(s, getDispatchBySlug(s, slug));
function readyForChoice(s, slug) {
  const select = mission03.tasks.findIndex((t) => t.id === "select-best");
  const record = getDispatchBySlug(s, slug);
  const run = { ...record.missionRuns["mission-03"], started: true, currentTask: select, completedTasks: mission03.tasks.slice(0, select).map((t) => t.id) };
  return merge(s, { dispatches: s.dispatches.map((d) => (d.slug === slug ? { ...d, missionRuns: { ...d.missionRuns, "mission-03": run } } : d)) });
}
// Start Mission 4 on a dispatch with load `loadId` chosen and the right broker selected + reviewed.
function atBrokerChat(s, slug, loadId) {
  s = readyForChoice(s, slug);
  s = scoped(s, slug, (p) => P4.chooseBest(p, loadId));
  s = scoped(s, slug, (p) => C.startMission(p));
  s = scoped(s, slug, (p) => C.selectBroker(p, getLoad(loadId).brokerId));
  return scoped(s, slug, (p) => C.reviewDetails(p));
}
const ask = (s, slug, text) => scoped(s, slug, (p) => C.sendMessage(p, text));
const brokerList = (s, slug) => getBrokerChecklist(view(s, slug));

// ---- 1. checklist progress and missing labels --------------------------------------------------------

test("checklist: topics asked update the broker checklist from real state", () => {
  let { state: s, slug } = newDispatch(initialGameState);
  s = atBrokerChat(s, slug, A);
  // first task (availability) is a single action: no checklist
  assert.equal(brokerList(s, slug), null);
  s = ask(s, slug, "Is the load still available?");

  let c = brokerList(s, slug);
  assert.equal(c.title, "Verify the load details");
  assert.equal(c.items.length, 7);
  assert.deepEqual(checklistProgress(c), { done: 0, total: 7 });
  assert.equal(missingText(c).startsWith("Still to do: Commodity"), true);

  s = ask(s, slug, "What is the commodity?");
  s = ask(s, slug, "What is the weight?");
  c = brokerList(s, slug);
  assert.deepEqual(checklistProgress(c), { done: 2, total: 7 });
  assert.deepEqual(c.items.filter((i) => i.done).map((i) => i.label), ["Commodity", "Weight"]);
  assert.ok(!missingItems(c).some((i) => i.label === "Weight"));

  for (const q of ["Confirm the equipment type", "What is the pickup date and time?", "What is the delivery date and time?", "What is the appointment type?", "Any special requirements?"]) s = ask(s, slug, q);
  // all seven covered: the engine moves on to the next task, whose checklist is rate + terms
  c = brokerList(s, slug);
  assert.equal(c.title, "Ask about rate and terms");
  assert.deepEqual(c.items.map((i) => i.label), ["Posted rate", "Detention / layover"]);
});

test("checklist: items come from the task rule, not a hardcoded list", () => {
  const rule = mission04.tasks.find((t) => t.id === "verify-requirements").rule.topics;
  let { state: s, slug } = newDispatch(initialGameState);
  s = atBrokerChat(s, slug, A);
  s = ask(s, slug, "Is the load still available?");
  assert.deepEqual(brokerList(s, slug).items.map((i) => i.id), rule);
  for (const i of brokerList(s, slug).items) assert.equal(commsTopics.some((t) => t.id === i.id), true);
});

test("checklist: negotiation shows requested, offer, agreed and confirmed", () => {
  let { state: s, slug } = newDispatch(initialGameState);
  s = atBrokerChat(s, slug, A);
  for (const q of ["Is the load still available?", "What is the commodity?", "What is the weight?", "Confirm the equipment type", "What is the pickup date and time?", "What is the delivery date and time?", "What is the appointment type?", "Any special requirements?", "Is the posted rate firm?", "What are the detention terms?"]) s = ask(s, slug, q);
  let c = brokerList(s, slug);
  assert.equal(c.title, "Negotiate and confirm the rate");
  assert.deepEqual(c.items.map((i) => i.done), [false, false, false, false]);

  const load = getLoad(A);
  s = ask(s, slug, `Can you do $${load.rate + 100}? I have deadhead to the pickup.`);
  c = brokerList(s, slug);
  assert.equal(c.items.find((i) => i.id === "asked").done, true);
  assert.equal(c.items.find((i) => i.id === "offer").done, true);
  if (!c.items.find((i) => i.id === "agreed").done) s = ask(s, slug, "That works for me, let's go with that.");
  c = brokerList(s, slug);
  assert.equal(c.items.find((i) => i.id === "agreed").done, true);
  assert.equal(c.items.find((i) => i.id === "confirmed").done, false);
  s = scoped(s, slug, (p) => C.confirmAgreement(p));
  assert.equal(brokerList(s, slug), null, "all tasks are done: nothing left to list");
});

test("checklist: suggested chips follow the missing items", () => {
  const chips = [{ id: "availability" }, { id: "commodity" }, { id: "weight" }, { id: "equipment" }];
  const checklist = { items: [{ id: "commodity", topicId: "commodity", done: true }, { id: "weight", topicId: "weight", done: false }, { id: "equipment", topicId: "equipment", done: false }] };
  const out = orderChips(chips, checklist, ["availability", "commodity"]);
  assert.deepEqual(out.map((c) => c.id), ["weight", "equipment", "availability", "commodity"], "missing first, covered last");
  assert.deepEqual(out.map((c) => c.needed), [true, true, false, false]);
  assert.deepEqual(out.map((c) => c.covered), [false, false, true, true]);
});

test("checklist: driver verification and communication use the dispatch's own state", () => {
  let { state: s, slug } = newDispatch(initialGameState);
  s = atBrokerChat(s, slug, A);
  s = scoped(s, slug, (p) => ({ patch: { negotiatedLoadId: A, agreedRate: getLoad(A).rate, loadFinalized: true } }));
  const entry = getRoster().find((e) => evaluateDriver(getLoad(A), e).suitable);
  s = scoped(s, slug, (p) => D.startMission(p));
  s = scoped(s, slug, (p) => D.reviewLoad(p));
  s = scoped(s, slug, (p) => D.selectDriver(p, entry.id));
  let c = getDispatchChecklist(view(s, slug));
  assert.equal(c.title, "Verify the driver");
  assert.deepEqual(c.items.map((i) => i.id), ["equipment", "availability", "hos", "pickup"]);
  assert.deepEqual(checklistProgress(c), { done: 0, total: 4 });
  s = scoped(s, slug, (p) => D.revealDriverChecks(p, entry.id, ["equipment", "hos"]));
  c = getDispatchChecklist(view(s, slug));
  assert.deepEqual(c.items.filter((i) => i.done).map((i) => i.id), ["equipment", "hos"]);
  assert.match(missingText(c), /Truck \/ Driver Availability, Pickup Feasibility/);
});

test("checklist: tracking delay handling and the Load Board / analysis lists", () => {
  // tracking: handle-delay lists the four sub-steps from the flags
  const idx = mission06.tasks.findIndex((t) => t.id === "handle-delay");
  const entry = getRoster().find((e) => evaluateDriver(getLoad(A), e).suitable);
  const state = {
    ...initialGameState,
    negotiatedLoadId: A,
    assignedLoadId: A,
    assignedDriverId: entry.driver.id,
    assignedTruckId: entry.truck.id,
    trackingLoadId: A,
    trackingFlags: { ...initialGameState.trackingFlags, ack: true, etaSolved: true },
    missionRuns: { ...initialGameState.missionRuns, "mission-06": { ...initialGameState.missionRuns["mission-06"], started: true, currentTask: idx } },
  };
  const t = getTrackingChecklist(state);
  assert.ok(t, "tracking checklist exists for the delay task");
  assert.equal(t.title, "Handle the delay");
  assert.deepEqual(t.items.map((i) => i.done), [true, true, false, false]);

  // load board: the shortlist task shows count and suitability
  const sIdx = mission02.tasks.findIndex((t2) => t2.id === "shortlist-loads");
  const base = { ...initialGameState, missionRuns: { ...initialGameState.missionRuns, "mission-02": { ...initialGameState.missionRuns["mission-02"], started: true, currentTask: sIdx } } };
  let board = getBoardChecklist(base);
  assert.deepEqual(board.items.map((i) => i.done), [false, false]);
  board = getBoardChecklist({ ...base, shortlistedLoadIds: [A] });
  assert.deepEqual(board.items.map((i) => i.done), [false, true]);
  board = getBoardChecklist({ ...base, shortlistedLoadIds: [A, B] });
  assert.deepEqual(board.items.map((i) => i.done), [true, true]);

  // analysis: review-shortlist lists each shortlisted load
  const { state: s, slug } = newDispatch(initialGameState);
  const started = scoped(s, slug, (p) => P4.startAnalysis(p));
  let a = getAnalysisChecklist(view(started, slug));
  assert.equal(a.title, "Open every shortlisted load");
  assert.equal(a.items.length, 2);
  const viewed = scoped(started, slug, (p) => P4.viewLoad(p, A));
  a = getAnalysisChecklist(view(viewed, slug));
  assert.deepEqual(a.items.map((i) => i.done), [true, false]);
});

// ---- 2. checklist isolation and rewards across dispatches ------------------------------------------

test("checklists are dispatch-specific and do not duplicate rewards", () => {
  let first = newDispatch(initialGameState);
  let s = first.state;
  s = newDispatch(s).state;
  s = atBrokerChat(s, "dispatch-0001", A);
  s = atBrokerChat(s, "dispatch-0002", B);
  s = ask(s, "dispatch-0001", "Is the load still available?");
  s = ask(s, "dispatch-0002", "Is the load still available?");

  for (const q of ["What is the commodity?", "What is the weight?", "Confirm the equipment type"]) s = ask(s, "dispatch-0001", q);
  assert.deepEqual(checklistProgress(brokerList(s, "dispatch-0001")), { done: 3, total: 7 });
  assert.deepEqual(checklistProgress(brokerList(s, "dispatch-0002")), { done: 0, total: 7 }, "dispatch-0002 is untouched");

  const before = JSON.stringify(s.dispatches.find((d) => d.slug === "dispatch-0001"));
  const xp = s.xp;
  for (const q of ["What is the commodity?", "What is the weight?", "Confirm the equipment type"]) s = ask(s, "dispatch-0002", q);
  assert.deepEqual(checklistProgress(brokerList(s, "dispatch-0002")), { done: 3, total: 7 });
  assert.equal(JSON.stringify(s.dispatches.find((d) => d.slug === "dispatch-0001")), before, "dispatch-0001 did not change");
  assert.ok(s.xp >= xp);
  // finishing the same checklist in both dispatches pays task XP once
  for (const q of ["What is the pickup date and time?", "What is the delivery date and time?", "What is the appointment type?", "Any special requirements?"]) s = ask(s, "dispatch-0001", q);
  const afterFirst = s.xp;
  for (const q of ["What is the pickup date and time?", "What is the delivery date and time?", "What is the appointment type?", "Any special requirements?"]) s = ask(s, "dispatch-0002", q);
  assert.equal(s.xp, afterFirst, "the same tasks in another dispatch pay no XP");
});

// ---- 3. one primary action: CTA rules ---------------------------------------------------------------

test("Load Board CTA: disabled until the shortlist is valid and the mission is complete", () => {
  const ok = validateShortlist([A, B]);
  const base = { min: 2, validity: ok, missionDone: false, tasksDone: false, tasksLeft: 2 };
  let cta = getShortlistCta({ ...base, count: 1, validity: validateShortlist([A]) });
  assert.equal(cta.disabled, true);
  assert.match(cta.text, /^1 \/ 2 minimum shortlisted\. Add 1 more suitable load\.$/);
  cta = getShortlistCta({ ...base, count: 0, validity: validateShortlist([]) });
  assert.match(cta.text, /Add 2 more suitable loads/);
  cta = getShortlistCta({ ...base, count: 2 });
  assert.equal(cta.disabled, true);
  assert.match(cta.text, /Finish the 2 remaining mission tasks/);
  cta = getShortlistCta({ ...base, count: 2, tasksDone: true });
  assert.deepEqual({ label: cta.label, kind: cta.kind, disabled: cta.disabled }, { label: "Complete Mission", kind: "complete", disabled: false });
  cta = getShortlistCta({ ...base, count: 2, missionDone: true });
  assert.deepEqual({ label: cta.label, kind: cta.kind, disabled: cta.disabled }, { label: "Continue to Analysis", kind: "continue", disabled: false });
  cta = getShortlistCta({ ...base, count: 2, missionDone: true, creating: true });
  assert.equal(cta.disabled, true, "no double submit while the dispatch is being created");
  cta = getShortlistCta({ ...base, count: 2, validity: validateShortlist(["load-005", B]), missionDone: true });
  assert.equal(cta.disabled, true);
  assert.match(cta.text, /cannot move/);
  assert.equal(simulationConfig.shortlist.min, 2);
});

test("commit language is consistent: no retired button labels remain", () => {
  const retired = ["Keep This Deal", "FINALIZE LOAD", "Finalize load?", "Mark as Completed", "Finish Analysis", "Select as Best Load", "Select as Current Choice", "Use AI Suggestion", "Complete Mission 01"];
  const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(path.join(dir, f)).isDirectory() ? walk(path.join(dir, f)) : [path.join(dir, f)]));
  for (const file of walk(path.join(SRC, "components")).concat(walk(path.join(SRC, "data"))).filter((f) => f.endsWith(".js"))) {
    const text = readFileSync(file, "utf8");
    for (const label of retired) {
      if (label === "Complete Mission 01") continue; // a sentence about unlocking, not a button
      assert.ok(!text.includes(label), `${path.relative(SRC, file)} still uses "${label}"`);
    }
  }
  const mt = readFileSync(path.join(SRC, "components/game/MissionTaskBar.js"), "utf8");
  assert.ok(mt.includes("Complete Mission"));
});

test("completion screens share the same four numbers", () => {
  const run = { completedTasks: ["a", "b", "c"], attempts: 1, hintsUsed: 2, xpEarned: 80 };
  for (const mission of [mission02, mission03, mission04, mission05, mission06]) {
    const stats = getCompletionStats(run, mission);
    assert.deepEqual(stats.map(([label]) => label), ["Tasks", "Accuracy", "Hints Used", "XP"]);
    assert.equal(stats[0][1], `3 / ${mission.tasks.length}`);
    assert.equal(stats[2][1], 2);
    assert.equal(stats[3][1], "+80");
  }
});

// ---- 4. fake / unfinished UI is hidden but nothing breaks -------------------------------------------

test("unfinished features are flagged off, saved values are kept, routes still resolve", () => {
  for (const key of ["notifications", "globalSearch", "aiAssistant", "aiCall", "callExtras", "coins", "streak"]) assert.equal(features[key], false, key);

  const state = { ...initialGameState, currentLevel: 6, completedLevels: [1, 2, 3, 4, 5], coins: 120, streak: 4 };
  assert.ok(!resolveNav(dispatcherNav, state).some((i) => i.id === "ai-assistant"), "no AI Assistant in the sidebar");
  assert.ok(!resolveNav(homeNav, state).some((i) => i.id === "ai-assistant"));
  assert.ok(resolveNav(dispatcherNav, state).some((i) => i.id === "tracking"), "other modules are untouched");
  assert.equal(state.coins, 120);
  assert.equal(state.streak, 4);
  assert.equal(canAccessRoute(dispatcherNav, "/dispatcher/ai-assistant", state), true, "the route itself still works");
  assert.ok(existsSync(path.join(SRC, "app/dispatcher/ai-assistant/page.js")));
  for (const route of ["load-board", "dispatches", "brokers", "dispatch", "tracking", "load-analysis"]) assert.ok(existsSync(path.join(SRC, "app/dispatcher", route, "page.js")), route);
});

test("the top bar and call screens no longer ship fake controls", () => {
  const top = readFileSync(path.join(SRC, "components/game/GameTopBar.js"), "utf8");
  assert.ok(/features\.notifications &&/.test(top) && /features\.coins &&/.test(top) && /features\.streak &&/.test(top));
  const layout = readFileSync(path.join(SRC, "components/dispatcher/DispatcherLayout.js"), "utf8");
  assert.ok(/features\.globalSearch &&/.test(layout));
  const controls = readFileSync(path.join(SRC, "components/game/CallControls.js"), "utf8");
  assert.ok(/if \(!features\.callExtras\) return end;/.test(controls));
  for (const f of ["components/analysis/AgentPanel.js"]) assert.ok(!/AI Assistant/.test(readFileSync(path.join(SRC, f), "utf8")), "no AI Assistant tab in Load Analysis");
});

// ---- 5. reset safety --------------------------------------------------------------------------------

test("reset needs the typed confirmation word", () => {
  assert.equal(RESET_WORD, "RESET");
  assert.equal(isResetConfirmed(""), false);
  assert.equal(isResetConfirmed("reset"), false);
  assert.equal(isResetConfirmed("RESE"), false);
  assert.equal(isResetConfirmed("RESET NOW"), false);
  assert.equal(isResetConfirmed(" RESET "), true);
  assert.equal(isResetConfirmed("RESET"), true);
  const page = readFileSync(path.join(SRC, "components/modules/ModulePage.js"), "utf8");
  assert.ok(page.includes("<ResetProgress"), "Settings uses the confirmation component");
  assert.ok(!page.includes("Log out &amp; reset progress (dev)"));
  const modal = readFileSync(path.join(SRC, "components/modules/ResetProgress.js"), "utf8");
  assert.ok(/disabled=\{!isResetConfirmed\(typed\)\}/.test(modal), "the destructive button stays disabled until confirmed");
});
