// Profile popup: every number is resolved from the saved state (lib/profileSummary.js).

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { initialGameState } from "@/data/users";
import * as P3 from "@/lib/phase3Actions";
import { createDispatchFromShortlist, getDispatchBySlug, projectDispatchState, applyScopedPatch } from "@/lib/dispatchRecords";
import { migrateState } from "@/lib/dispatchMigration";
import { getDashboard } from "@/lib/dashboardStats";
import { getProfileSummary, getMilestones, getTrainingAccuracy } from "@/lib/profileSummary";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");
const read = (f) => readFileSync(path.join(SRC, f), "utf8");

const merge = (s, patch) => ({ ...s, ...patch });
function newDispatch(s, ids = ["load-001", "load-002"]) {
  for (const id of ids) s = merge(s, P3.shortlistLoad(s, id).patch);
  const res = createDispatchFromShortlist(s, s.shortlistedLoadIds, "2026-10-08T10:00:00.000Z");
  assert.equal(res.ok, true);
  return merge(s, res.patch);
}
function patchDispatch(s, slug, patchFn) {
  const out = patchFn(projectDispatchState(s, getDispatchBySlug(s, slug)));
  return merge(s, applyScopedPatch(s, slug, out, "2026-10-08T11:00:00.000Z"));
}

test("student info, rewards and level come straight from the saved state", () => {
  const state = { ...initialGameState, profile: { ...initialGameState.profile, name: "Asha", id: "student-777" }, xp: 240, nextLevelXp: 500, stars: 7, coins: 90, streak: 3, currentLevel: 3, completedLevels: [1, 2] };
  const s = getProfileSummary(state);
  assert.deepEqual({ name: s.student.name, id: s.student.id, level: s.student.level, xp: s.student.xp, pct: s.student.xpPercent }, { name: "Asha", id: "student-777", level: 3, xp: 240, pct: 48 });
  assert.deepEqual(s.rewards, { stars: 7, coins: 90, xp: 240, streak: 3 });
  assert.equal(s.stats.missionsCompleted, 2);
  assert.equal(s.progress.level, 3);
  assert.ok(s.progress.mission, "the current mission is resolved from the level data");
});

test("dispatch counts are the Dashboard's counts", () => {
  let state = newDispatch(initialGameState);
  state = newDispatch(state, ["load-001", "load-003"]);
  state = newDispatch(state, ["load-002", "load-004"]);
  // complete the first dispatch
  state = patchDispatch(state, "dispatch-0001", (p) => ({ missionRuns: { ...p.missionRuns, "mission-06": { ...p.missionRuns["mission-06"], started: true, completed: true } } }));
  const dash = getDashboard(state);
  const s = getProfileSummary(state);
  assert.equal(s.stats.totalDispatches, dash.stats.total);
  assert.equal(s.stats.completedDispatches, dash.stats.completed);
  assert.deepEqual([s.stats.totalDispatches, s.stats.completedDispatches, s.stats.activeDispatches], [3, 1, 2]);
  assert.equal(getProfileSummary(initialGameState).stats.totalDispatches, 0);
});

test("current dispatch follows the last opened unfinished dispatch", () => {
  let state = newDispatch(initialGameState);
  state = newDispatch(state, ["load-002", "load-003"]);
  assert.equal(getProfileSummary(state).progress.dispatch.label, "Dispatch #002");
  assert.equal(getProfileSummary(state).progress.dispatch.route, "/dispatcher/load-analysis/dispatch-0002");
  assert.equal(getProfileSummary({ ...state, activeDispatchSlug: "dispatch-0001" }).progress.dispatch.label, "Dispatch #001");
  assert.equal(getProfileSummary(initialGameState).progress.dispatch, null);
});

test("milestones are derived from real progress only", () => {
  const none = getMilestones(initialGameState).map((m) => m.done);
  assert.deepEqual(none, [false, false, false, false]);
  let state = { ...newDispatch(initialGameState), completedLevels: [1] };
  assert.deepEqual(getMilestones(state).map((m) => m.done), [true, true, false, false]);
  state = patchDispatch(state, "dispatch-0001", () => ({ negotiation: { ...initialGameState.negotiation, status: "agreed", agreedRate: 2600, attempts: 1 } }));
  assert.equal(getMilestones(state).find((m) => m.id === "first-negotiation").done, true);
  state = patchDispatch(state, "dispatch-0001", (p) => ({ missionRuns: { ...p.missionRuns, "mission-06": { ...p.missionRuns["mission-06"], started: true, completed: true } } }));
  assert.equal(getMilestones(state).find((m) => m.id === "first-completed-load").done, true);
});

test("hints and accuracy count every run once", () => {
  let state = { ...initialGameState, missionProgress: { ...initialGameState.missionProgress, hintsUsed: 1, attempts: 1, completedTasks: ["a", "b"] }, missionRuns: { ...initialGameState.missionRuns, "mission-02": { ...initialGameState.missionRuns["mission-02"], hintsUsed: 3, attempts: 2, completedTasks: ["x"] } } };
  assert.equal(getProfileSummary(state).stats.hintsUsed, 4);
  state = newDispatch(state);
  state = patchDispatch(state, "dispatch-0001", (p) => ({ missionRuns: { ...p.missionRuns, "mission-04": { ...p.missionRuns["mission-04"], hintsUsed: 2, attempts: 1 } } }));
  assert.equal(getProfileSummary(state).stats.hintsUsed, 6);
  const acc = getTrainingAccuracy(state);
  assert.equal(acc.attempts, 1 + 2 + 1);
  assert.equal(acc.percent, Math.round((acc.tasksDone / (acc.tasksDone + acc.attempts)) * 100));
  assert.equal(getProfileSummary(initialGameState).stats.accuracy, null, "no activity: no percentage");
});

test("a migrated save is not counted twice", () => {
  const legacy = {
    ...initialGameState,
    selectedBestLoadId: "load-001",
    missionRuns: { ...initialGameState.missionRuns, "mission-03": { ...initialGameState.missionRuns["mission-03"], started: true, hintsUsed: 4, attempts: 2 } },
  };
  const migrated = migrateState(legacy, undefined, "2026-10-08T09:00:00.000Z");
  assert.equal(getProfileSummary(migrated).stats.hintsUsed, 4, "the legacy global run and its dispatch copy count once");
  assert.equal(getProfileSummary(legacy).stats.hintsUsed, 4, "before migration the legacy run is used");
});

test("popup behaviour: opens from the profile button, closes on outside click, Escape and actions", () => {
  const menu = read("components/game/ProfileMenu.js");
  assert.match(menu, /aria-haspopup="dialog"/);
  assert.match(menu, /aria-expanded=\{open\}/);
  assert.match(menu, /role="dialog"/);
  assert.match(menu, /e\.key === "Escape"/);
  assert.match(menu, /addEventListener\("mousedown"/);
  assert.match(menu, /sm:w-\[23rem\]/, "about 370px dropdown on desktop");
  assert.match(menu, /fixed inset-x-0 bottom-0/, "bottom sheet on small screens");
  const go = menu.slice(menu.indexOf("const go ="), menu.indexOf("const logOut"));
  assert.match(go, /setOpen\(false\)/, "navigating closes the popup");
  for (const target of ['go("/dispatcher")', "go(ROUTES.hub)", 'go("/dispatcher/settings")']) assert.ok(menu.includes(target), target);
  assert.match(menu, /isAuthenticated: false/, "Log Out keeps progress and signs out");
  assert.ok(!/resetGameState|reset\(/.test(menu), "logging out never resets progress");
  const bar = read("components/game/GameTopBar.js");
  assert.match(bar, /<ProfileMenu/);
});
