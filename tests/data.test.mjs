// Seed data integrity: 30 loads, 10 trucks, 10 drivers, with valid references.

import test from "node:test";
import assert from "node:assert/strict";

import { loads } from "@/data/loads";
import { locations } from "@/data/locations";
import { brokers } from "@/data/brokers";
import { trucks as starterTrucks } from "@/data/trucks";
import { drivers as starterDrivers } from "@/data/drivers";
import { dispatchTrucks, dispatchDrivers } from "@/data/dispatchFleet";
import { loadBoardSources, equipmentOptions } from "@/data/loadFilters";
import { getRoster } from "@/lib/dispatchRoster";
import { getTruckContext, getLoadCompatibilityIssues } from "@/lib/loadRules";

const trucks = [...starterTrucks, ...dispatchTrucks];
const drivers = [...starterDrivers, ...dispatchDrivers];
const ids = (list) => list.map((x) => x.id);
const unique = (list) => new Set(list).size === list.length;

test("exactly 30 loads, 10 trucks and 10 drivers", () => {
  assert.equal(loads.length, 30);
  assert.equal(trucks.length, 10);
  assert.equal(drivers.length, 10);
  assert.equal(getRoster().length, 10);
});

test("no duplicate ids or load reference numbers", () => {
  assert.ok(unique(ids(loads)));
  assert.ok(unique(loads.map((l) => l.referenceNumber)));
  assert.ok(unique(ids(trucks)));
  assert.ok(unique(ids(drivers)));
});

test("every broker, location and driver/truck reference resolves", () => {
  const locationIds = new Set(ids(locations));
  const brokerIds = new Set(ids(brokers));
  const sources = new Set(loadBoardSources.map((s) => s.id));
  for (const l of loads) {
    assert.ok(brokerIds.has(l.brokerId), `${l.referenceNumber} broker`);
    assert.ok(locationIds.has(l.originLocationId), `${l.referenceNumber} origin`);
    assert.ok(locationIds.has(l.destinationLocationId), `${l.referenceNumber} destination`);
    assert.ok(sources.has(l.sourceId), `${l.referenceNumber} source`);
    assert.ok(equipmentOptions.includes(l.equipmentType), `${l.referenceNumber} equipment`);
  }
  for (const t of trucks) {
    assert.ok(locationIds.has(t.locationId), `${t.id} location`);
    const d = drivers.find((x) => x.id === t.driverId);
    assert.ok(d, `${t.id} driver`);
    assert.equal(d.truckId, t.id, `${t.id} and ${d.id} point at each other`);
  }
  for (const d of drivers) assert.ok(trucks.some((t) => t.id === d.truckId), `${d.id} truck`);
});

test("the original ten training loads keep their Phase 3 / 4 verdicts", () => {
  const ctx = getTruckContext();
  const verdict = (ref) => getLoadCompatibilityIssues(loads.find((l) => l.referenceNumber === ref), ctx).map((i) => i.code);
  for (const ref of ["LD-2101", "LD-2102", "LD-2103", "LD-2104", "LD-2110"]) assert.deepEqual(verdict(ref), [], ref);
  assert.deepEqual(verdict("LD-2105"), ["equipment"]);
  assert.deepEqual(verdict("LD-2106"), ["weight"]);
  assert.deepEqual(verdict("LD-2107"), ["timing"]);
  assert.deepEqual(verdict("LD-2108"), ["hos"]);
  assert.deepEqual(verdict("LD-2109"), ["equipment"]);
});

test("the data has real variety", () => {
  const count = (list, key) => list.reduce((m, x) => ({ ...m, [x[key]]: (m[x[key]] ?? 0) + 1 }), {});
  const le = count(loads, "equipmentType");
  assert.ok(le["Dry Van"] >= 15 && le.Reefer >= 2 && le.Flatbed >= 2);
  const ts = count(trucks, "status");
  assert.ok(ts.Available >= 1 && ts["On Load"] >= 1 && ts["In Maintenance"] >= 1);
  assert.ok(new Set(trucks.map((t) => t.equipment)).size >= 5);
  assert.ok(new Set(drivers.map((d) => d.dutyStatus)).size >= 4);
  const ctx = getTruckContext();
  const codes = new Set(loads.flatMap((l) => getLoadCompatibilityIssues(l, ctx).map((i) => i.code)));
  for (const c of ["equipment", "weight", "timing", "hos"]) assert.ok(codes.has(c), c);
});
