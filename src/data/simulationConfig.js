// Simulation configuration. NOT production accounting: these values drive the
// training calculations in src/lib/ (distance, RPM, fuel, profit, match score).

export const simulationConfig = {
  // Truck used for Phase 3/4 (same Dry Van the student learned about in Phase 2).
  assignedTruckId: "TRK-101",

  // Simulation "now". Fixed so results are deterministic.
  clock: { now: "2026-10-12T08:00" },

  // Distance and travel
  roadCircuityFactor: 1.18, // straight-line miles -> approximate road miles
  averageSpeedMph: 50,
  // Deadhead guidance used for feedback wording (miles). Not hard compatibility rules.
  deadhead: { goodMaxMiles: 100, poorMinMiles: 200 },

  // Cost model
  fuel: { pricePerGallon: 3.9, milesPerGallon: 6.5 },
  operatingCostPerMile: 0.15, // maintenance, tires, insurance etc. (excludes fuel)

  // Multi-dispatch: may one driver / truck serve several unfinished dispatches at once? (training default: yes)
  allowDriverReuse: true,

  // Phase 3 shortlist limits
  shortlist: { min: 2, max: 3 },

  // Hours-of-Service model used for ETAs: after this many driving hours the driver takes a rest.
  hos: { maxDriveHoursBeforeRest: 11, restHours: 10 },

  // Phase 4 hidden match score (see src/lib/loadMatching.js).
  // Phase 3 compatibility (equipment, weight, pickup timing, HOS feasibility) are GATES: a load
  // that fails any gate is not a Phase 4 candidate and is never scored. Among candidates, four
  // INDEPENDENT factors are min-max normalised across the shortlist and weighted (sum = 1):
  //   allInRpm  = effective value per total mile (rate / (loaded + deadhead))
  //   profit    = estimated total margin after fuel and operating costs
  //   deadhead  = unpaid miles to the pickup (fewer is better)
  //   hosMargin = spare drive time left after the deadhead leg (schedule buffer)
  // Margin per mile is NOT weighted: it is allInRpm minus the constant cost per mile.
  matchScoreWeights: {
    allInRpm: 0.45,
    profit: 0.3,
    deadhead: 0.15,
    hosMargin: 0.1,
  },
  // Decision bands, relative to the best-scoring load in the shortlist:
  //   top-ranked pick = strong; within `acceptableWithin` of the top = acceptable; else review.
  decisionBands: { acceptableWithin: 0.15 },
};
