// Fleet selectors for the Trucks page: pure functions over the EXISTING trucks, drivers and dispatch
// records. Nothing here is stored or copied; every row is resolved by ID each time.

import { trucks } from "@/data/trucks";
import { drivers } from "@/data/drivers";
import { dispatchTrucks, dispatchDrivers } from "@/data/dispatchFleet";
import { getActiveDispatches } from "./dispatchRecords";
import { describeDispatch } from "./dispatchView";

export const ALL_TRUCKS = [...trucks, ...dispatchTrucks];
const ALL_DRIVERS = [...drivers, ...dispatchDrivers];

// Order used for the default sort and the summary chips. Any other status sorts after these.
export const STATUS_ORDER = ["Available", "On Load", "In Maintenance", "Unavailable"];
export const SORT_OPTIONS = [
  { id: "default", label: "Status (default)" },
  { id: "id", label: "Truck ID" },
  { id: "location", label: "Location" },
  { id: "equipment", label: "Equipment" },
  { id: "driver", label: "Driver" },
];

const statusRank = (s) => {
  const i = STATUS_ORDER.indexOf(s);
  return i === -1 ? STATUS_ORDER.length : i;
};

// A truck's active dispatch: an unfinished dispatch whose ASSIGNED driver belongs to the truck.
function activeDispatchByTruck(state) {
  const byTruck = new Map();
  for (const record of getActiveDispatches(state ?? {})) {
    const driverId = record.ops?.assignedDriverId;
    const driver = driverId ? ALL_DRIVERS.find((d) => d.id === driverId) : null;
    if (driver?.truckId && !byTruck.has(driver.truckId)) byTruck.set(driver.truckId, describeDispatch(record));
  }
  return byTruck;
}

// One row per truck: { truck, driver, status, dispatch, driverFlag }.
export function getFleetRows(state) {
  const dispatches = activeDispatchByTruck(state);
  return ALL_TRUCKS.map((truck) => {
    const driver = ALL_DRIVERS.find((d) => d.id === truck.driverId) ?? null;
    // The driver's own state, only surfaced when it differs from what the truck status already says.
    const driverFlag = driver && truck.status === "Available" && (driver.availability === "Unavailable" || driver.dutyStatus === "Off Duty") ? driver.dutyStatus : null;
    return { truck, driver, status: truck.status, dispatch: dispatches.get(truck.id) ?? null, driverFlag };
  });
}

export function fleetCounts(rows) {
  const byStatus = {};
  for (const r of rows) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  const total = rows.length;
  const operational = (byStatus.Available ?? 0) + (byStatus["On Load"] ?? 0);
  // Health is only meaningful with trucks to measure; no fleet means no percentage.
  return { total, byStatus, operational, healthPct: total ? Math.round((operational / total) * 100) : null };
}

// Statuses present in the data, in display order (so "Unavailable" only appears if a truck has it).
export function statusesPresent(rows) {
  const present = [...new Set(rows.map((r) => r.status))];
  return present.sort((a, b) => statusRank(a) - statusRank(b) || a.localeCompare(b));
}

export const fleetOptions = (rows) => ({
  equipment: [...new Set(rows.map((r) => r.truck.equipment))].sort(),
  locations: [...new Set(rows.map((r) => r.truck.location))].sort(),
});

// filters: { query, status, equipment, location, dispatch: "" | "assigned" | "free" }
export function filterFleet(rows, { query = "", status = "", equipment = "", location = "", dispatch = "" } = {}) {
  const q = query.trim().toLowerCase();
  return rows.filter((r) => {
    if (status && r.status !== status) return false;
    if (equipment && r.truck.equipment !== equipment) return false;
    if (location && r.truck.location !== location) return false;
    if (dispatch === "assigned" && !r.dispatch) return false;
    if (dispatch === "free" && r.dispatch) return false;
    if (!q) return true;
    return [r.truck.id, r.truck.model, r.truck.equipment, r.truck.location, r.driver?.name, r.driver?.id].some((v) => v && String(v).toLowerCase().includes(q));
  });
}

export function sortFleet(rows, sort = "default") {
  const byId = (a, b) => a.truck.id.localeCompare(b.truck.id);
  const cmp = {
    default: (a, b) => statusRank(a.status) - statusRank(b.status) || byId(a, b),
    id: byId,
    location: (a, b) => a.truck.location.localeCompare(b.truck.location) || byId(a, b),
    equipment: (a, b) => a.truck.equipment.localeCompare(b.truck.equipment) || byId(a, b),
    driver: (a, b) => (a.driver?.name ?? "").localeCompare(b.driver?.name ?? "") || byId(a, b),
  }[sort] ?? byId;
  return [...rows].sort(cmp);
}

export const getFleetRow = (rows, truckId) => rows.find((r) => r.truck.id === truckId) ?? null;
