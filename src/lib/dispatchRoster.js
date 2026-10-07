// The Phase 6 driver roster: the Phase 2 fleet (trucks.js / drivers.js) plus the extra dispatch
// drivers (dispatchFleet.js), each joined to its truck. Resolved by ID; nothing is copied.

import { drivers } from "@/data/drivers";
import { trucks } from "@/data/trucks";
import { dispatchDrivers, dispatchTrucks } from "@/data/dispatchFleet";
import { rosterFilterOptions } from "@/data/dispatchComms";

const ALL_DRIVERS = [...drivers, ...dispatchDrivers];
const ALL_TRUCKS = [...trucks, ...dispatchTrucks];

export function getRoster() {
  return ALL_DRIVERS.map((driver) => ({ id: driver.id, driver, truck: ALL_TRUCKS.find((t) => t.id === driver.truckId) }));
}

export const getRosterEntry = (id) => getRoster().find((e) => e.id === id) ?? null;

// One status label for the list: Available | Driving | On Break | Off Duty | Unavailable.
export function displayStatus(entry) {
  const { dutyStatus, availability } = entry.driver;
  if (dutyStatus === "Off Duty") return "Off Duty";
  if (dutyStatus === "Driving") return "Driving";
  if (dutyStatus === "On Break") return "On Break";
  if (availability === "Unavailable" || availability === "On Load") return "Unavailable";
  return "Available";
}

export function getEquipmentOptions() {
  return [...new Set(getRoster().map((e) => e.truck.equipment))];
}

// Search / filter by name, truck, location, equipment, availability and minimum HOS.
export function filterRoster(roster, { query = "", equipment = "", availability = "", hos = "any" } = {}) {
  const q = query.trim().toLowerCase();
  const minHos = rosterFilterOptions.hos.find((o) => o.id === hos)?.minMinutes ?? 0;
  return roster.filter((e) => {
    if (equipment && e.truck.equipment !== equipment) return false;
    if (availability && displayStatus(e) !== availability) return false;
    if (e.driver.hosMinutes < minHos) return false;
    if (!q) return true;
    return [e.driver.name, e.driver.id, e.truck.id, e.truck.equipment, e.driver.location].some((v) => v.toLowerCase().includes(q));
  });
}
