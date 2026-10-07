// Phase 4 numbers. The ONLY place RPM, fuel, operating cost, margin and ETA are calculated.
// Inputs come from loads/trucks/config; nothing here is hardcoded per load.

import { simulationConfig } from "@/data/simulationConfig";
import { parseSimTime, addMinutes, round2 } from "./text";
import { evaluatePickup, isEquipmentCompatible, isWeightCompatible, getTruckContext } from "./loadRules";

export const calculateTotalMiles = (loadedMiles, deadheadMiles) => loadedMiles + deadheadMiles;

// Rate per loaded mile (what the board shows).
export const calculateRpm = (rate, loadedMiles) => round2(rate / loadedMiles);

// Rate per total mile: the posted rate spread over loaded + deadhead miles.
export const calculateAllInRpm = (rate, totalMiles) => round2(rate / totalMiles);

export function calculateEstimatedFuelCost(totalMiles) {
  const { pricePerGallon, milesPerGallon } = simulationConfig.fuel;
  return round2((totalMiles / milesPerGallon) * pricePerGallon);
}

export const calculateOperatingCost = (totalMiles) => round2(totalMiles * simulationConfig.operatingCostPerMile);

// Estimated margin after fuel and operating costs (a training simulation, not full accounting).
export function calculateEstimatedProfit(rate, totalMiles) {
  return round2(rate - calculateEstimatedFuelCost(totalMiles) - calculateOperatingCost(totalMiles));
}

export const calculateProfitPerMile = (profit, totalMiles) => round2(profit / totalMiles);

// Pickup-to-delivery minutes: driving time plus a rest after each full driving stint.
export function calculateTransitMinutes(loadedMiles) {
  const { maxDriveHoursBeforeRest, restHours } = simulationConfig.hos;
  const driveHours = loadedMiles / simulationConfig.averageSpeedMph;
  const rests = Math.max(0, Math.ceil(driveHours / maxDriveHoursBeforeRest) - 1);
  return Math.round((driveHours + rests * restHours) * 60);
}

export function analyzeLoad(load, ctx = getTruckContext()) {
  const pickup = evaluatePickup(load, ctx);
  const deadheadMiles = pickup.distanceToPickup;
  const totalMiles = calculateTotalMiles(load.loadedMiles, deadheadMiles);
  const fuelCost = calculateEstimatedFuelCost(totalMiles);
  const operatingCost = calculateOperatingCost(totalMiles);
  const estimatedProfit = calculateEstimatedProfit(load.rate, totalMiles);
  const pickupStart = parseSimTime(load.pickupWindow.start);
  const departAt = pickup.arrival > pickupStart ? pickup.arrival : pickupStart;
  const transitMinutes = calculateTransitMinutes(load.loadedMiles);

  return {
    loadId: load.id,
    lineHaulRate: load.rate,
    loadedMiles: load.loadedMiles,
    deadheadMiles,
    totalMiles,
    rpm: calculateRpm(load.rate, load.loadedMiles),
    allInRpm: calculateAllInRpm(load.rate, totalMiles),
    fuelCost,
    operatingCost,
    estimatedCost: round2(fuelCost + operatingCost),
    estimatedProfit,
    profitPerMile: calculateProfitPerMile(estimatedProfit, totalMiles),
    transitMinutes,
    deliveryEta: addMinutes(departAt, transitMinutes),
    deliveryMinutes: transitMinutes,
    hosMarginMinutes: pickup.hosMarginMinutes,
    pickupSlackMinutes: pickup.slackMinutes,
    equipmentOk: isEquipmentCompatible(load, ctx),
    weightOk: isWeightCompatible(load, ctx),
    timingOk: pickup.code !== "timing",
    hosOk: pickup.code !== "hos",
  };
}
