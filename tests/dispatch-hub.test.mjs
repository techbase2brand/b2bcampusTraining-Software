// Dispatches hub: grouping, stats, search, filters, sorting, resume routing, read-only behaviour.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initialGameState } from "@/data/users";
import { loads } from "@/data/loads";
import { createDispatchFromShortlist, getDispatches, ROUTES } from "@/lib/dispatchRecords";
import { filterHub, getHub, hubStats, sortHub, stageIndex, tabCounts } from "@/lib/dispatchHub";
import { setNow } from "@/lib/trackingClock";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");
const read = (f) => readFileSync(path.join(SRC, f), "utf8");
const ids = loads.slice(0, 3).map((l) => l.id);

// Five dispatches: analysis, broker, assignment (negotiated), tracking (assigned), completed.
function buildState() {
  let s = { ...initialGameState, isAuthenticated: true, onboardingCompleted: true, currentLevel: 7, completedLevels: [1, 2, 3, 4, 5, 6] };
  for (let i = 0; i < 5; i++) {
    const res = createDispatchFromShortlist(s, ids, `2026-10-0${i + 1}T10:00:00.000Z`);
    s = { ...s, ...res.patch };
  }
  const set = (i, ops, extra = {}) => { s.dispatches[i] = { ...s.dispatches[i], ops: { ...s.dispatches[i].ops, ...ops }, ...extra }; };
  set(1, { selectedBestLoadId: ids[0], commsLoadId: ids[0] }, { workflowStage: "BROKER_COMMUNICATION", operationalStatus: "negotiating" });
  set(2, { selectedBestLoadId: ids[0], negotiatedLoadId: ids[0], loadFinalized: true, agreedRate: 2400 }, { workflowStage: "ASSIGNMENT", operationalStatus: "negotiated" });
  set(3, { selectedBestLoadId: ids[1], negotiatedLoadId: ids[1], loadFinalized: true, agreedRate: 2900, assignedLoadId: ids[1], assignedDriverId: "DRV-201", assignedTruckId: "TRK-101", trackingLoadId: ids[1] }, { workflowStage: "TRACKING", operationalStatus: "ready-for-pickup" });
  set(4, { selectedBestLoadId: ids[2], negotiatedLoadId: ids[2], agreedRate: 1700, assignedLoadId: ids[2], assignedDriverId: "DRV-202", assignedTruckId: "TRK-102" }, { workflowStage: "COMPLETED", operationalStatus: "completed", completion: { isCompleted: true }, completedAt: "2026-10-09T10:00:00.000Z" });
  return s;
}

test("every existing dispatch appears exactly once", () => {
  const state = buildState();
  const { records } = getHub(state);
  assert.equal(records.length, getDispatches(state).length);
  assert.equal(new Set(records.map((r) => r.slug)).size, 5);
});

test("stats are computed from the records and add up", () => {
  setNow(new Date("2026-10-09T12:00:00Z"));
  const { records } = getHub(buildState());
  const s = hubStats(records);
  assert.equal(s.total, 5);
  assert.equal(s.completed, 1);
  assert.equal(s.active + s.progress + s.completed, s.total, "every dispatch is in exactly one bucket");
  assert.equal(s.progress, records.filter((r) => !r.completed && ["draft", "pending"].includes(r.category)).length);
  assert.deepEqual(tabCounts(records), { all: 5, active: s.active, progress: s.progress, completed: 1 });
  assert.equal(hubStats([]).total, 0);
  setNow(null);
});

test("filter tabs group correctly; completed never appears under Active or In Progress", () => {
  const { records } = getHub(buildState());
  const completed = filterHub(records, { tab: "completed" });
  assert.equal(completed.length, 1);
  assert.ok(completed[0].completed);
  for (const tab of ["active", "progress"]) assert.ok(filterHub(records, { tab }).every((r) => !r.completed), tab);
  assert.equal(filterHub(records, { tab: "all" }).length, 5);
  assert.equal(filterHub(records, { tab: "active" }).length + filterHub(records, { tab: "progress" }).length + completed.length, 5);
});

test("search matches dispatch number, slug, load, route, driver and truck", () => {
  const { records } = getHub(buildState());
  assert.deepEqual(filterHub(records, { query: "#003" }).map((r) => r.slug), ["dispatch-0003"]);
  assert.ok(filterHub(records, { query: "dispatch-0004" }).length === 1);
  const load = loads[1];
  assert.ok(filterHub(records, { query: load.referenceNumber }).some((r) => r.slug === "dispatch-0004"));
  assert.ok(filterHub(records, { query: "mike johnson" }).every((r) => r.driverName === "Mike Johnson"));
  assert.equal(filterHub(records, { query: "mike johnson" }).length, 1);
  assert.ok(filterHub(records, { query: "TRK-102" }).some((r) => r.slug === "dispatch-0005"));
  assert.equal(filterHub(records, { query: "no-such-thing" }).length, 0);
});

test("sorting: latest, oldest, status and highest rate", () => {
  const { records } = getHub(buildState());
  const slugs = (sort) => sortHub(records, sort).map((r) => r.slug);
  assert.deepEqual(slugs("latest"), ["dispatch-0005", "dispatch-0004", "dispatch-0003", "dispatch-0002", "dispatch-0001"]);
  assert.deepEqual(slugs("oldest"), [...slugs("latest")].reverse());
  assert.equal(slugs("status").at(-1), "dispatch-0005", "completed sorts last");
  const rates = sortHub(records, "rate").map((r) => r.agreedRate ?? r.postedRate ?? -1);
  assert.deepEqual(rates, [...rates].sort((a, b) => b - a));
  assert.equal(records.length, 5, "sorting never mutates the input");
});

test("Resume / View go to each dispatch's own dynamic route by stage", () => {
  const byStage = Object.fromEntries(getHub(buildState()).records.map((r) => [r.slug, r]));
  assert.equal(byStage["dispatch-0001"].resumeRoute, ROUTES.analysis("dispatch-0001"));
  assert.equal(byStage["dispatch-0002"].resumeRoute, ROUTES.brokers("dispatch-0002"));
  assert.equal(byStage["dispatch-0003"].resumeRoute, ROUTES.assignment("dispatch-0003"));
  assert.equal(byStage["dispatch-0004"].resumeRoute, ROUTES.tracking("dispatch-0004"));
  assert.equal(byStage["dispatch-0005"].resumeRoute, ROUTES.detail("dispatch-0005"));
  assert.deepEqual(["dispatch-0001", "dispatch-0002", "dispatch-0003", "dispatch-0004", "dispatch-0005"].map((k) => stageIndex(byStage[k])), [0, 1, 2, 3, 4]);
});

test("opening the hub reads state only: nothing is modified", () => {
  const state = buildState();
  const before = JSON.stringify(state);
  setNow(new Date("2026-10-09T12:00:00Z"));
  getHub(state);
  hubStats(getHub(state).records);
  setNow(null);
  assert.equal(JSON.stringify(state), before);
  const page = read("components/dispatches/DispatchHubPage.js");
  assert.ok(!/\bupdate\(|\breset\(|useGameProgress|setState|localStorage/.test(page), "the page has no write path");
});

test("the page wires New Dispatch to the load board and uses the shared design system", () => {
  const page = read("components/dispatches/DispatchHubPage.js");
  assert.match(page, /router\.push\(ROUTES\.board\)/);
  assert.match(page, /activeId="dispatches"/);
  assert.match(page, /All active dispatches are on track/);
  assert.match(page, /role="tablist"/);
  const card = read("components/dispatches/ActiveDispatchCard.js");
  assert.match(card, /liquid-border-strong/);
  assert.match(card, /onResume\(r\.resumeRoute\)/);
  assert.match(read("components/dispatches/CompletedDispatchRow.js"), /liquid-border-subtle/);
  assert.match(read("components/dispatches/CompletedDispatchRow.js"), /onView\(r\.resumeRoute\)/);
  assert.ok(!/@keyframes|conic-gradient/.test(page + card), "no page-specific border CSS");
});
