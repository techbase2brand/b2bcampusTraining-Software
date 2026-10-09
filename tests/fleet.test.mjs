// Trucks page: fleet selectors (counts, filters, sorting, relationships) and the page wiring.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initialGameState } from "@/data/users";
import { trucks } from "@/data/trucks";
import { drivers } from "@/data/drivers";
import { dispatchTrucks, dispatchDrivers } from "@/data/dispatchFleet";
import { loads } from "@/data/loads";
import { createDispatchFromShortlist } from "@/lib/dispatchRecords";
import { ALL_TRUCKS, fleetCounts, fleetOptions, filterFleet, getFleetRow, getFleetRows, sortFleet, statusesPresent } from "@/lib/fleet";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");
const read = (f) => readFileSync(path.join(SRC, f), "utf8");
const rows = getFleetRows(initialGameState);

test("all 10 trucks appear once, with no duplicates", () => {
  assert.equal(rows.length, trucks.length + dispatchTrucks.length);
  assert.equal(rows.length, 10);
  assert.equal(new Set(rows.map((r) => r.truck.id)).size, 10);
});

test("fleet counts are computed from the data, never hardcoded", () => {
  const c = fleetCounts(rows);
  assert.equal(c.total, 10);
  assert.equal(Object.values(c.byStatus).reduce((a, b) => a + b, 0), c.total);
  for (const s of Object.keys(c.byStatus)) assert.equal(c.byStatus[s], ALL_TRUCKS.filter((t) => t.status === s).length);
  assert.equal(c.operational, (c.byStatus.Available ?? 0) + (c.byStatus["On Load"] ?? 0));
  assert.equal(c.healthPct, Math.round((c.operational / c.total) * 100));
  assert.equal(fleetCounts([]).healthPct, null, "no fake percentage for an empty fleet");
  assert.ok(!statusesPresent(rows).includes("Unavailable"), "a status nobody has is not shown");
});

test("every truck resolves to its own driver and location from the existing data", () => {
  const allDrivers = [...drivers, ...dispatchDrivers];
  for (const r of rows) {
    assert.ok(r.driver, `${r.truck.id} has a driver`);
    assert.equal(r.driver.id, r.truck.driverId);
    assert.equal(r.driver.truckId, r.truck.id, "the driver points back at the same truck");
    assert.ok(allDrivers.includes(r.driver), "the driver object is the existing record, not a copy");
    assert.equal(r.status, r.truck.status);
  }
});

test("status filter, equipment, location and combined filters", () => {
  const c = fleetCounts(rows);
  assert.equal(filterFleet(rows, { status: "Available" }).length, c.byStatus.Available);
  assert.ok(filterFleet(rows, { status: "In Maintenance" }).every((r) => r.status === "In Maintenance"));
  const reefers = filterFleet(rows, { equipment: "Reefer" });
  assert.ok(reefers.length > 0 && reefers.every((r) => r.truck.equipment === "Reefer"));
  const city = fleetOptions(rows).locations[0];
  assert.ok(filterFleet(rows, { location: city }).every((r) => r.truck.location === city));
  assert.equal(filterFleet(rows, { status: "Available", equipment: "Reefer" }).length, reefers.filter((r) => r.status === "Available").length);
  assert.equal(filterFleet(rows, {}).length, 10);
});

test("search covers truck ID, model, driver, location and equipment", () => {
  assert.deepEqual(filterFleet(rows, { query: "trk-101" }).map((r) => r.truck.id), ["TRK-101"]);
  assert.equal(filterFleet(rows, { query: "cascadia" })[0].truck.id, "TRK-101");
  assert.equal(filterFleet(rows, { query: "sarah lopez" })[0].truck.id, "TRK-102");
  assert.ok(filterFleet(rows, { query: "houston" }).some((r) => r.truck.id === "TRK-102"));
  assert.ok(filterFleet(rows, { query: "step deck" }).every((r) => r.truck.equipment === "Step Deck"));
  assert.equal(filterFleet(rows, { query: "zzz-nothing" }).length, 0);
});

test("default sort is Available, On Load, Maintenance; other sorts are stable", () => {
  const order = sortFleet(rows).map((r) => r.status);
  const rank = { Available: 0, "On Load": 1, "In Maintenance": 2 };
  for (let i = 1; i < order.length; i++) assert.ok(rank[order[i - 1]] <= rank[order[i]]);
  const ids = sortFleet(rows, "id").map((r) => r.truck.id);
  assert.deepEqual(ids, [...ids].sort());
  assert.equal(sortFleet(rows, "driver").length, 10);
  assert.equal(rows.length, 10, "sorting never mutates the input");
});

test("a truck shows its ACTIVE dispatch only, resolved through the assigned driver", () => {
  const ids = loads.slice(0, 3).map((l) => l.id);
  const created = createDispatchFromShortlist(initialGameState, ids);
  let state = { ...initialGameState, ...created.patch };
  assert.ok(getFleetRows(state).every((r) => r.dispatch === null), "a draft with no assigned driver holds no truck");

  state.dispatches[0].ops = { ...state.dispatches[0].ops, assignedDriverId: "DRV-201", selectedBestLoadId: ids[0], negotiatedLoadId: ids[0] };
  const held = getFleetRows(state).filter((r) => r.dispatch);
  assert.deepEqual(held.map((r) => r.truck.id), ["TRK-101"]);
  assert.equal(held[0].dispatch.slug, "dispatch-0001");
  assert.match(held[0].dispatch.resumeRoute, /^\/dispatcher\//);
  assert.equal(filterFleet(getFleetRows(state), { dispatch: "assigned" }).length, 1);
  assert.equal(filterFleet(getFleetRows(state), { dispatch: "free" }).length, 9);

  state = { ...state, dispatches: [{ ...state.dispatches[0], completion: { isCompleted: true } }] };
  assert.ok(getFleetRows(state).every((r) => r.dispatch === null), "completed dispatches do not hold a truck");
});

test("a driver who is unavailable is flagged on an Available truck, without changing the truck status", () => {
  const r = getFleetRow(rows, "TRK-107");
  assert.equal(r.status, "Available");
  assert.equal(r.driverFlag, "On Break");
  assert.equal(getFleetRow(rows, "TRK-101").driverFlag, null);
});

test("the page uses the fleet selectors, a details drawer and the shared design system", () => {
  const list = read("components/dispatcher/TruckList.js");
  assert.match(list, /from "@\/lib\/fleet"/);
  assert.match(list, /<GameDrawer/);
  assert.match(list, /aria-pressed=\{active\}/, "status chips double as filters");
  assert.match(list, /aria-label="Sort trucks"/);
  assert.match(list, /List view/);
  assert.match(list, /No trucks match these filters/);
  assert.ok(!/trucks\.map|from "@\/data\/trucks"/.test(list), "no UI-only truck list; rows come from lib/fleet");
  const card = read("components/dispatcher/TruckCard.js");
  assert.match(card, /liquid-border-strong/);
  assert.match(card, /liquid-border-subtle/);
  assert.match(card, /View Dispatch/);
  const details = read("components/dispatcher/TruckDetails.js");
  for (const t of ["Current dispatch", "AVAILABLE FOR DISPATCH", "IN MAINTENANCE", "Remaining HOS", "Duty status"]) assert.ok(details.includes(t), t);
  assert.ok(!/maintenance(Reason|Date)/.test(details), "no invented maintenance data");
  assert.match(read("components/dispatcher/DispatcherApp.js"), /<TruckList onSelect=/, "the Mission 1 profile is still reachable");
});
