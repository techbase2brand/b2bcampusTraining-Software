// JSDoc types (the project is JavaScript). Import for editor hints only:
//   /** @type {import("@/types/load").Load[]} */

/**
 * @typedef {Object} Location
 * @property {string} id            e.g. "loc-dallas-tx"
 * @property {string} city
 * @property {string} state
 * @property {number} lat
 * @property {number} lng
 * @property {{x:number,y:number}} mapPos   % position on the stylized route preview
 */

/**
 * @typedef {Object} Broker
 * @property {string} id
 * @property {string} name
 * @property {number} rating
 * @property {number} reviewCount
 * @property {string} mcNumber
 * @property {string} paymentTerms
 * @property {string} avgResponse
 */

/**
 * @typedef {Object} TimeWindow
 * @property {string} start   local sim time "YYYY-MM-DDTHH:mm"
 * @property {string} end
 */

/**
 * @typedef {Object} Load
 * @property {string} id
 * @property {string} referenceNumber    e.g. "LD-2101"
 * @property {string} brokerId           -> Broker.id
 * @property {string} sourceId           -> loadBoardSources[].id
 * @property {string} originLocationId   -> Location.id
 * @property {string} destinationLocationId
 * @property {TimeWindow} pickupWindow
 * @property {TimeWindow} deliveryWindow
 * @property {string} equipmentType
 * @property {"FTL"|"LTL"} loadType
 * @property {number} weight             lbs
 * @property {number} lengthFt
 * @property {string} commodity
 * @property {number} loadedMiles
 * @property {number} rate               posted line-haul rate, USD
 * @property {string} status
 * @property {string} appointmentType
 * @property {string[]} specialRequirements
 */

/**
 * @typedef {Object} LoadFilterState
 * @property {string} sourceId
 * @property {string|null} pickupLocationId
 * @property {number} pickupRadiusMiles
 * @property {string|null} destinationLocationId
 * @property {number} destinationRadiusMiles
 * @property {string|null} pickupDateFrom
 * @property {string|null} pickupDateTo
 * @property {string[]} equipmentTypes
 * @property {string[]} loadTypes
 * @property {number|null} minRate
 * @property {number|null} maxRate
 * @property {number|null} maxWeight
 * @property {number|null} maxLengthFt
 * @property {string} sortBy
 */

export {};
