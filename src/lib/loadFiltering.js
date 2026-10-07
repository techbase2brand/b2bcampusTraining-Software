// Load Board filtering. Pure functions: filters in, loads out. Filters combine with AND.
// Distances use the shared geo helper (road miles from location to origin), never city names.

import { loads as allLoads } from "@/data/loads";
import { defaultLoadFilters, sortOptions } from "@/data/loadFilters";
import { roadMiles } from "./geo";
import { getLocation } from "./loadSelectors";
import { simDateKey } from "./text";

// Merge saved filters over the configured defaults (old saved states may miss newer keys).
export const normalizeFilters = (saved) => ({ ...defaultLoadFilters, ...(saved ?? {}) });

function matchesSource(load, f) {
  return f.sourceId === "all" || load.sourceId === f.sourceId;
}

function withinRadius(locationId, radius, targetLocationId) {
  const center = getLocation(locationId);
  const target = getLocation(targetLocationId);
  return Boolean(center && target) && roadMiles(center, target) <= radius;
}

export function matchesFilters(load, filters) {
  const f = normalizeFilters(filters);
  if (!matchesSource(load, f)) return false;
  if (f.equipmentTypes.length && !f.equipmentTypes.includes(load.equipmentType)) return false;
  if (f.loadTypes.length && !f.loadTypes.includes(load.loadType)) return false;
  if (f.pickupLocationId && !withinRadius(f.pickupLocationId, f.pickupRadiusMiles, load.originLocationId)) return false;
  if (f.destinationLocationId && !withinRadius(f.destinationLocationId, f.destinationRadiusMiles, load.destinationLocationId)) return false;

  // Pickup date range, inclusive, compared on the load's pickup day (simulation dates only).
  const day = simDateKey(load.pickupWindow.start);
  if (f.pickupDateFrom && day < f.pickupDateFrom) return false;
  if (f.pickupDateTo && day > f.pickupDateTo) return false;

  if (f.minRate != null && load.rate < f.minRate) return false;
  if (f.maxRate != null && load.rate > f.maxRate) return false;
  if (f.maxWeight != null && load.weight > f.maxWeight) return false;
  if (f.maxLengthFt != null && load.lengthFt > f.maxLengthFt) return false;
  return true;
}

const SORTERS = {
  "rate-desc": (a, b) => b.rate - a.rate,
  "rate-asc": (a, b) => a.rate - b.rate,
  "pickup-asc": (a, b) => a.pickupWindow.start.localeCompare(b.pickupWindow.start),
  "distance-asc": (a, b) => a.loadedMiles - b.loadedMiles,
  "distance-desc": (a, b) => b.loadedMiles - a.loadedMiles,
};

export function sortLoads(list, sortBy) {
  const id = sortOptions.some((o) => o.id === sortBy) ? sortBy : defaultLoadFilters.sortBy;
  return [...list].sort(SORTERS[id] ?? SORTERS["rate-desc"]);
}

export function filterLoads(filters, source = allLoads) {
  const f = normalizeFilters(filters);
  return sortLoads(source.filter((l) => matchesFilters(l, f)), f.sortBy);
}

// Compact chips for the filters currently applied (source tab and sort are not chips).
// Each chip carries the patch that clears just that filter.
export function describeActiveFilters(filters) {
  const f = normalizeFilters(filters);
  const d = defaultLoadFilters;
  const city = (id) => {
    const l = getLocation(id);
    return l ? `${l.city}, ${l.state}` : id;
  };
  const chips = [];
  if (f.equipmentTypes.length) chips.push({ id: "equipment", label: `Equipment: ${f.equipmentTypes.join(", ")}`, patch: { equipmentTypes: [] } });
  if (f.loadTypes.length) chips.push({ id: "loadTypes", label: `Type: ${f.loadTypes.join(", ")}`, patch: { loadTypes: [] } });
  if (f.pickupLocationId) chips.push({ id: "pickup", label: `Pickup: ${city(f.pickupLocationId)} +${f.pickupRadiusMiles} mi`, patch: { pickupLocationId: null, pickupRadiusMiles: d.pickupRadiusMiles } });
  if (f.destinationLocationId) chips.push({ id: "destination", label: `To: ${city(f.destinationLocationId)} +${f.destinationRadiusMiles} mi`, patch: { destinationLocationId: null, destinationRadiusMiles: d.destinationRadiusMiles } });
  if (f.pickupDateFrom || f.pickupDateTo) chips.push({ id: "dates", label: `Pickup: ${f.pickupDateFrom ?? "any"} to ${f.pickupDateTo ?? "any"}`, patch: { pickupDateFrom: null, pickupDateTo: null } });
  if (f.minRate != null || f.maxRate != null) chips.push({ id: "rate", label: `Rate: ${f.minRate ?? "any"}-${f.maxRate ?? "any"}`, patch: { minRate: null, maxRate: null } });
  if (f.maxWeight != null) chips.push({ id: "weight", label: `Max weight: ${f.maxWeight.toLocaleString("en-US")} lbs`, patch: { maxWeight: null } });
  if (f.maxLengthFt != null) chips.push({ id: "length", label: `Max length: ${f.maxLengthFt} ft`, patch: { maxLengthFt: null } });
  return chips;
}

export const resetFilters = () => ({ ...defaultLoadFilters });
