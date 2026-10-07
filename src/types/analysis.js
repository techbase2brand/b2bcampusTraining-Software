// JSDoc types for Phase 3/4 results produced by src/lib/ helpers.

/**
 * One reason a load is not suitable for the assigned truck.
 * @typedef {Object} LoadIssue
 * @property {"equipment"|"weight"|"timing"|"hos"} code
 * @property {string} message   explanation shown to the student
 */

/**
 * @typedef {Object} LoadCompatibilityResult
 * @property {string} loadId
 * @property {boolean} compatible
 * @property {LoadIssue[]} issues
 * @property {number} deadheadMiles
 * @property {number} hosMarginMinutes   remaining HOS minus drive time to pickup
 */

/**
 * @typedef {Object} LoadAnalysisResult
 * @property {string} loadId
 * @property {number} lineHaulRate
 * @property {number} loadedMiles
 * @property {number} deadheadMiles
 * @property {number} totalMiles
 * @property {number} rpm              rate / loaded miles
 * @property {number} allInRpm         rate / total miles
 * @property {number} fuelCost
 * @property {number} estimatedCost    fuel + operating
 * @property {number} estimatedProfit
 * @property {number} profitPerMile
 * @property {number} deliveryMinutes
 * @property {number} hosMarginMinutes
 */

/**
 * @typedef {Object} LoadMatchScore
 * @property {string} loadId
 * @property {number} score            0-1, hidden until the decision is confirmed
 * @property {Record<string, number>} parts   per-metric normalised contribution
 * @property {1|2|3|4|5} stars
 */

export {};
