// Driver suitability for a load. Centralised gates (equipment & capacity, availability, HOS, pickup
// timing) built on the same helpers as the Phase 3 load rules, so there is one definition of
// "can this truck reach the pickup". Nothing here names a driver or a load.

import { simulationConfig } from "@/data/simulationConfig";
import { suitabilityMessages, suitabilityChecks } from "@/data/dispatchComms";
import { evaluatePickup, isEquipmentCompatible, isWeightCompatible } from "./loadRules";
import { getLocation } from "./loadSelectors";
import { displayStatus } from "./dispatchRoster";
import { fillTemplate, parseSimTime, formatSimTime, formatDuration } from "./text";

// The same shape the load rules expect: truck, driver, current location and the simulation clock.
export function driverContext(entry) {
  return { truck: entry.truck, driver: entry.driver, location: getLocation(entry.truck.locationId), now: parseSimTime(simulationConfig.clock.now) };
}

// Evaluate one driver against a load. Returns the four check results (each with a teaching
// message), the overall verdict, and the numbers behind them (deadhead, drive time, HOS margin).
export function evaluateDriver(load, entry) {
  const ctx = driverContext(entry);
  const pickup = evaluatePickup(load, ctx);
  const status = displayStatus(entry);
  const equipmentOk = isEquipmentCompatible(load, ctx);
  const weightOk = isWeightCompatible(load, ctx);
  const availabilityOk = status === "Available";
  const hosOk = pickup.hosMarginMinutes >= 0;
  const pickupOk = pickup.slackMinutes >= 0;

  const vars = {
    driver: entry.driver.name,
    truckEquipment: entry.truck.equipment,
    loadEquipment: load.equipmentType,
    loadWeight: load.weight.toLocaleString("en-US"),
    truckMax: entry.truck.maxWeightLbs.toLocaleString("en-US"),
    status: status.toLowerCase(),
    driveTime: formatDuration(pickup.driveMinutes),
    remainingHos: formatDuration(entry.driver.hosMinutes),
    arrival: formatSimTime(pickup.arrival),
    windowEnd: formatSimTime(parseSimTime(load.pickupWindow.end)),
    driverLocation: `${ctx.location.city}, ${ctx.location.state}`,
    distance: pickup.distanceToPickup,
  };
  const m = suitabilityMessages;
  const results = {
    equipment: { passed: equipmentOk && weightOk, message: fillTemplate(!equipmentOk ? m.equipment.failEquipment : !weightOk ? m.equipment.failWeight : m.equipment.pass, vars) },
    availability: { passed: availabilityOk, message: fillTemplate(availabilityOk ? m.availability.pass : m.availability.fail, vars) },
    hos: { passed: hosOk, message: fillTemplate(hosOk ? m.hos.pass : m.hos.fail, vars) },
    pickup: { passed: pickupOk, message: fillTemplate(pickupOk ? m.pickup.pass : m.pickup.fail, vars) },
  };
  const checks = suitabilityChecks.map((c) => ({ code: c.code, label: c.label, ...results[c.code] }));

  return {
    entryId: entry.id,
    checks,
    suitable: checks.every((c) => c.passed),
    firstFailure: checks.find((c) => !c.passed) ?? null,
    deadheadMiles: pickup.distanceToPickup,
    driveMinutes: pickup.driveMinutes,
    arrival: pickup.arrival,
    hosMarginMinutes: pickup.hosMarginMinutes,
    slackMinutes: pickup.slackMinutes,
    status,
  };
}
