// Phase 3 compatibility rules. A load is suitable only if equipment, weight and pickup
// feasibility (time and HOS) all pass. No profitability here: that is Phase 4.

import { simulationConfig } from "@/data/simulationConfig";
import { mission02 } from "@/data/phase3Missions";
import { loads } from "@/data/loads";
import { roadMiles, driveMinutesForMiles } from "./geo";
import { getAssignedTruck, getAssignedDriver, getLocation, getLoad } from "./loadSelectors";
import { fillTemplate, parseSimTime, addMinutes, formatSimTime, formatDuration } from "./text";

// The truck/driver/clock every Phase 3/4 calculation is evaluated against.
export function getTruckContext() {
  const truck = getAssignedTruck();
  return {
    truck,
    driver: getAssignedDriver(),
    location: getLocation(truck.locationId),
    now: parseSimTime(simulationConfig.clock.now),
  };
}

export const isEquipmentCompatible = (load, ctx) => load.equipmentType === ctx.truck.equipment;
export const isWeightCompatible = (load, ctx) => load.weight <= ctx.truck.maxWeightLbs;

// Can the truck reach the pickup? HOS is checked first: if the trip needs more driving than the
// driver has left, timing cannot be judged without a rest, so the failure is reported as "hos" only.
export function evaluatePickup(load, ctx) {
  const origin = getLocation(load.originLocationId);
  const distanceToPickup = roadMiles(ctx.location, origin);
  const driveMinutes = driveMinutesForMiles(distanceToPickup);
  const hosMarginMinutes = ctx.driver.hosMinutes - driveMinutes;
  const arrival = addMinutes(ctx.now, driveMinutes);
  const slackMinutes = Math.round((parseSimTime(load.pickupWindow.end) - arrival) / 60000);

  let code = null;
  if (hosMarginMinutes < 0) code = "hos";
  else if (slackMinutes < 0) code = "timing";

  return { origin, distanceToPickup, driveMinutes, hosMarginMinutes, arrival, slackMinutes, code };
}

export const isPickupFeasible = (load, ctx) => evaluatePickup(load, ctx).code === null;

// Guidance wording only (not a pass/fail rule): good / fair / poor distance to the pickup.
export function calculatePickupDistanceSuitability(distanceToPickup) {
  const { goodMaxMiles, poorMinMiles } = simulationConfig.deadhead;
  if (distanceToPickup <= goodMaxMiles) return "good";
  if (distanceToPickup >= poorMinMiles) return "poor";
  return "fair";
}

export function isWithinRadius(load, centerLocationId, radiusMiles) {
  const center = getLocation(centerLocationId);
  return roadMiles(center, getLocation(load.originLocationId)) <= radiusMiles;
}

// Explained issues, each with a teaching message. Empty array = suitable.
export function getLoadCompatibilityIssues(load, ctx) {
  const msgs = mission02.issueMessages;
  const issues = [];

  if (!isEquipmentCompatible(load, ctx)) {
    issues.push({
      code: "equipment",
      message: fillTemplate(msgs.equipment, { loadEquipment: load.equipmentType, truckEquipment: ctx.truck.equipment }),
    });
  }
  if (!isWeightCompatible(load, ctx)) {
    issues.push({
      code: "weight",
      message: fillTemplate(msgs.weight, {
        loadWeight: load.weight.toLocaleString("en-US"),
        truckMaxWeight: ctx.truck.maxWeightLbs.toLocaleString("en-US"),
      }),
    });
  }
  const pickup = evaluatePickup(load, ctx);
  if (pickup.code === "timing") {
    issues.push({
      code: "timing",
      message: fillTemplate(msgs.timing, {
        windowEnd: formatSimTime(parseSimTime(load.pickupWindow.end)),
        arrival: formatSimTime(pickup.arrival),
        pickupCity: pickup.origin.city,
        distanceToPickup: pickup.distanceToPickup,
      }),
    });
  } else if (pickup.code === "hos") {
    issues.push({
      code: "hos",
      message: fillTemplate(msgs.hos, {
        pickupCity: pickup.origin.city,
        distanceToPickup: pickup.distanceToPickup,
        driveTime: formatDuration(pickup.driveMinutes),
        remainingHos: formatDuration(ctx.driver.hosMinutes),
      }),
    });
  }
  return issues;
}

export function checkLoadCompatibility(load, ctx = getTruckContext()) {
  const pickup = evaluatePickup(load, ctx);
  const issues = getLoadCompatibilityIssues(load, ctx);
  return {
    loadId: load.id,
    compatible: issues.length === 0,
    issues,
    deadheadMiles: pickup.distanceToPickup,
    hosMarginMinutes: pickup.hosMarginMinutes,
    slackMinutes: pickup.slackMinutes,
  };
}

export function checkLoadCompatibilityById(loadId, ctx = getTruckContext()) {
  return checkLoadCompatibility(getLoad(loadId), ctx);
}

export function listCompatibleLoadIds(ctx = getTruckContext()) {
  return loads.filter((l) => checkLoadCompatibility(l, ctx).compatible).map((l) => l.id);
}

// Shortlist rule: min..max loads, every one compatible. Returns { valid, reason }.
export function validateShortlist(loadIds, ctx = getTruckContext()) {
  const { min, max } = simulationConfig.shortlist;
  if (loadIds.length > max) return { valid: false, reason: "too-many" };
  if (loadIds.length < min) return { valid: false, reason: "too-few" };
  const bad = loadIds.filter((id) => !checkLoadCompatibilityById(id, ctx).compatible);
  return bad.length ? { valid: false, reason: "incompatible", loadIds: bad } : { valid: true, reason: null };
}

// The five Phase 3 compatibility checks for a load, in display order. Each result carries the
// teaching message. `passed` is null for the distance row (information only, not a gate).
// Timing and HOS are reported separately here: timing = arrival vs window, hos = drive time vs HOS.
export function getCheckResults(load, ctx = getTruckContext()) {
  const fail = mission02.issueMessages;
  const pass = mission02.checkPassMessages;
  const p = evaluatePickup(load, ctx);
  const vars = {
    loadEquipment: load.equipmentType,
    truckEquipment: ctx.truck.equipment,
    loadWeight: load.weight.toLocaleString("en-US"),
    truckMaxWeight: ctx.truck.maxWeightLbs.toLocaleString("en-US"),
    pickupCity: p.origin.city,
    distanceToPickup: p.distanceToPickup,
    suitability: mission02.distanceWords[calculatePickupDistanceSuitability(p.distanceToPickup)],
    arrival: formatSimTime(p.arrival),
    windowEnd: formatSimTime(parseSimTime(load.pickupWindow.end)),
    driveTime: formatDuration(p.driveMinutes),
    remainingHos: formatDuration(ctx.driver.hosMinutes),
  };
  const equipmentOk = isEquipmentCompatible(load, ctx);
  const weightOk = isWeightCompatible(load, ctx);
  const timingOk = p.slackMinutes >= 0;
  const hosOk = p.hosMarginMinutes >= 0;
  const outcome = (code, passed) => ({
    code,
    label: mission02.compatibilityChecks.find((c) => c.code === code).label,
    passed,
    message: fillTemplate(passed === false ? fail[code] : pass[code], vars),
  });
  return [
    outcome("equipment", equipmentOk),
    outcome("weight", weightOk),
    outcome("distance", null),
    outcome("timing", timingOk),
    outcome("hos", hosOk),
  ];
}
