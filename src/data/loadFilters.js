// Load Board filter defaults and option lists (UI configuration, API-style).

export const defaultLoadFilters = {
  sourceId: "all", // board tabs are a view filter; "all" shows every board
  pickupLocationId: null,
  pickupRadiusMiles: 300, // wide by default so valid loads are not hidden silently
  destinationLocationId: null,
  destinationRadiusMiles: 100,
  pickupDateFrom: null, // "YYYY-MM-DD"
  pickupDateTo: null,
  equipmentTypes: [], // empty = all equipment
  loadTypes: [], // "FTL" | "LTL"; empty = all
  minRate: null,
  maxRate: null,
  maxWeight: null, // lbs; hides loads heavier than this
  maxLengthFt: null,
  sortBy: "rate-desc",
};

export const loadBoardSources = [
  { id: "all", label: "All Boards" },
  { id: "main-board", label: "Main Load Board" },
  { id: "partner-board", label: "Partner Board" },
  { id: "direct-brokers", label: "Direct Brokers" },
];

export const radiusOptions = [25, 50, 100, 150, 200, 300, 500];

export const equipmentOptions = ["Dry Van", "Reefer", "Flatbed", "Power Only", "Step Deck"];

export const loadTypeOptions = [
  { id: "FTL", label: "Full Truck Load (FTL)" },
  { id: "LTL", label: "Partial (LTL)" },
];

export const sortOptions = [
  { id: "rate-desc", label: "Rate (High to Low)" },
  { id: "rate-asc", label: "Rate (Low to High)" },
  { id: "pickup-asc", label: "Pickup (Earliest)" },
  { id: "distance-asc", label: "Distance (Shortest)" },
  { id: "distance-desc", label: "Distance (Longest)" },
];

// Filter panel layout (labels only; values live in defaultLoadFilters / option lists above).
export const filterSections = [
  { id: "pickup", label: "Pickup Location", kind: "location-radius", highlight: "filter-pickup" },
  { id: "destination", label: "Destination", kind: "location-radius" },
  { id: "dates", label: "Pickup Date", kind: "date-range" },
  { id: "equipment", label: "Equipment Type", kind: "equipment", highlight: "filter-equipment" },
  { id: "requirements", label: "Load Requirements", kind: "load-types" },
  { id: "rate", label: "Rate ($)", kind: "min-max" },
  { id: "size", label: "Weight / Length", kind: "weight-length", highlight: "filter-weight" },
];

// Results table columns, in display order.
export const loadBoardColumns = [
  { id: "loadId", label: "Load ID" },
  { id: "pickup", label: "Pickup" },
  { id: "destination", label: "Destination" },
  { id: "equipment", label: "Equipment" },
  { id: "weight", label: "Weight" },
  { id: "loadedMiles", label: "Loaded Miles" },
  { id: "rate", label: "Posted Rate" },
  { id: "pickupTime", label: "Pickup Time" },
  { id: "actions", label: "Action" },
];
