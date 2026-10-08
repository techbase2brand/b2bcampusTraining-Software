// Phase 3: Level 2 mission "Finding Loads". Pure definition data.
// `rule` objects are descriptors interpreted by src/lib/phase3Engine.js; no logic here.
// Placeholders in messages ({loadEquipment}, {truckEquipment}, ...) are filled by the engine.

export const mission02 = {
  id: "mission-02",
  levelId: 2,
  phaseId: "phase-3",
  title: "Finding Loads",
  intro:
    "Your truck is available and ready for freight. Use the Load Board to find suitable loads based on equipment, location, weight, distance and pickup timing.",
  objectives: [
    "Open the Load Board",
    "Filter compatible equipment",
    "Search near your truck",
    "Remove overweight loads",
    "Remove unreachable pickups",
    "Shortlist 2-3 suitable loads",
  ],
  tasks: [
    {
      id: "open-load-board",
      title: "Open Load Board",
      instruction: "Open the Load Board.",
      hint: "Click \"Load Board\" in the left sidebar.",
      highlight: "nav-load-board",
      rule: { type: "navigate", target: "load-board" },
    },
    {
      id: "filter-equipment",
      title: "Filter Equipment",
      instruction: "Your assigned truck is a {truckEquipment}. Filter for compatible equipment.",
      hint: "Start by checking the equipment your truck can pull.",
      highlight: "filter-equipment",
      rule: { type: "filter-equipment-matches-truck" },
    },
    {
      id: "set-pickup-area",
      title: "Set Pickup Area",
      instruction: "Find freight near the truck's current location ({truckLocation}).",
      hint: "Look at how far the truck is from the pickup. Search around the truck's current location.",
      highlight: "filter-pickup",
      rule: { type: "filter-pickup-near-truck", maxRadiusMiles: 300, warnWhenHidingValidLoads: true },
    },
    {
      id: "check-weight",
      title: "Check Weight",
      instruction: "Remove loads that exceed the truck's supported capacity ({truckMaxWeight} lbs).",
      hint: "Compare each load's weight with your truck's maximum capacity. Set the max weight filter, or use Check on a load's Weight.",
      highlight: "filter-weight",
      rule: { type: "check-weight" },
    },
    {
      id: "check-timing",
      title: "Check Pickup Timing",
      instruction: "Check which loads cannot be reached within the pickup window. Review a load's Pickup Timing and HOS.",
      hint: "Make sure the pickup time is realistic: use Check on Pickup Timing and HOS Feasibility for a load.",
      highlight: "load-results",
      rule: { type: "check-pickup-feasibility", codes: ["timing", "hos"] }, // reviewed a load that is unreachable for time OR HOS
    },
    {
      id: "shortlist-loads",
      title: "Shortlist Suitable Loads",
      instruction: "Shortlist the best {shortlistMin}-{shortlistMax} suitable loads for further analysis.",
      hint: "Open a load, run its compatibility checks, then use Shortlist Load on suitable ones.",
      highlight: "shortlist",
      rule: { type: "shortlist-valid" },
    },
  ],

  // Why a load is not suitable. Keyed by issue code from src/lib/loadRules.js.
  issueMessages: {
    equipment: "This load requires {loadEquipment} equipment, while your assigned truck is a {truckEquipment}.",
    weight: "This load weighs {loadWeight} lbs, which exceeds your truck's {truckMaxWeight} lb capacity.",
    timing:
      "The pickup window closes at {windowEnd}, but your truck would not reach {pickupCity} until about {arrival} ({distanceToPickup} miles away).",
    hos: "{pickupCity} is about {distanceToPickup} miles away, which needs about {driveTime} of driving. The driver only has {remainingHos} of HOS left, so the truck cannot reach the pickup in time.",
  },

  // Phase 3 uses neutral wording; the term "deadhead" is introduced in Phase 4.
  terms: { distanceToPickup: "Distance to pickup" },

  // Feedback for filter-based tasks (placeholders filled by src/lib/phase3Engine.js).
  filterFeedback: {
    equipmentWrong: "Your truck is a {truckEquipment}, so it cannot pull {pickedEquipment} freight. Choose the equipment your truck can pull.",
    equipmentMixed: "{pickedEquipment} is not compatible with your {truckEquipment}. Keep only the equipment your truck can pull.",
    pickupWrongPlace: "Search near your truck's current location ({truckLocation}), not {pickedCity}.",
    pickupTooWide: "A {pickedRadius}-mile radius is too wide for a realistic pickup. Keep it within {maxRadius} miles of the truck.",
    weightTooLow: "A {pickedWeight} lb limit is below your truck's {truckMaxWeight} lb capacity, so it would hide loads you can legally pull.",
    weightTooHigh: "A {pickedWeight} lb limit is above your truck's {truckMaxWeight} lb capacity, so overweight loads would still appear.",
    hiddenValidLoads: "Heads up: these filters hide {count} load(s) that could suit your truck. A tighter search is not always a better one.",
  },
  // Shown when a task is completed by the student's filter state.
  successMessages: {
    "open-load-board": "Load Board open. Now narrow the results to freight your truck can actually move.",
    "filter-equipment": "Correct. Filtering for {truckEquipment} keeps only freight your truck can pull.",
    "set-pickup-area": "Good. Searching around {truckLocation} keeps pickups close to your truck.",
    "check-weight": "Correct. Always compare a load's weight with your truck's {truckMaxWeight} lb capacity before committing.",
    "check-timing": "Good catch. A pickup is only workable if the truck can get there in time and within the driver's HOS.",
    "shortlist-loads": "Your shortlist is ready for deeper analysis.",
  },

  // Feedback copy for the shortlist actions.
  feedback: {
    shortlistAdded: "This load meets the truck's current operational requirements. It is on your shortlist for deeper analysis.",
    shortlistTooMany: "You can compare a maximum of {shortlistMax} loads. Remove one before adding another.",
    shortlistRejected: "Not suitable for your truck: {reasons}",
    shortlistRemoved: "Removed from your shortlist.",
    shortlistTooFew: "Shortlist at least {shortlistMin} suitable loads so you have something to compare.",
  },

  // Compatibility review rows shown for a selected load. The student reveals each with Check.
  compatibilityChecks: [
    { code: "equipment", label: "Equipment" },
    { code: "weight", label: "Weight" },
    { code: "distance", label: "Pickup Location / Distance" },
    { code: "timing", label: "Pickup Timing" },
    { code: "hos", label: "HOS Feasibility" },
  ],
  // Result text when a check passes (failures use issueMessages).
  checkPassMessages: {
    equipment: "{loadEquipment} matches your {truckEquipment}.",
    weight: "{loadWeight} lbs is within your {truckMaxWeight} lb limit.",
    distance: "{distanceToPickup} miles from your truck to the pickup ({suitability}).",
    timing: "Your truck arrives about {arrival}; the pickup window closes {windowEnd}.",
    hos: "About {driveTime} of driving to the pickup, within the driver's {remainingHos} of HOS.",
  },
  distanceWords: { good: "close", fair: "moderate", poor: "far" },

  // Training Agent lines for the current action (data-driven; filled by phase3Engine).
  agentMessages: {
    noSelection: "Select a load to review its requirements.",
    reviewPrompt: "Use the compatibility checks to compare this load with your truck.",
    equipment: "Start with equipment compatibility. Your truck is a {truckEquipment}.",
    weight: "Compare the load weight with your truck's maximum capacity.",
    timing: "Check whether the truck can reach the pickup before the window closes.",
    hos: "The driver needs enough HOS to reach this pickup. Review the drive time against the HOS left.",
    valid: "This load is operationally compatible. You may shortlist it for further analysis.",
    shortlistEnough: "You have enough candidates to continue, but you may add one more.",
    shortlistFull: "Your shortlist is ready for deeper analysis.",
  },
};

// Shown on completion
export const phase3CompletionMetrics = [
  "Loads Reviewed",
  "Compatible Loads Found",
  "Shortlisted Loads",
  "Incorrect Selections",
  "Hints Used",
  "Accuracy",
  "XP Earned",
  "Stars Earned",
];

// Page copy for the Phase 3 header and the "how it works" strip.
export const phase3Page = {
  eyebrow: "Mission 2",
  title: "Load Board & Finding Loads",
  subtitle:
    "Search, filter and find the best loads for your truck. Learn to analyze lanes, equipment, rates and requirements.",
  boardTitle: "Load Board",
  completion: {
    title: "LOAD SEARCH COMPLETE",
    subtitle: "Your shortlist is ready for deeper analysis.",
    unlocked: "Level 3: Load Analysis & Matching unlocked",
    cta: "Continue to Load Analysis",
    secondary: "Return to Level Map",
  },
  emptyDetails: "Select a load to view its details here.",
  howItWorks: [
    { id: "filters", title: "Apply Filters", text: "Set pickup, destination, date and equipment to find suitable loads." },
    { id: "browse", title: "Browse Load Results", text: "Review available loads and compare rate, distance and requirements." },
    { id: "analyze", title: "Analyze Load Details", text: "Check weight, timing and pickup details before you decide." },
    { id: "shortlist", title: "Shortlist Loads", text: "Add the best 2-3 suitable loads to your shortlist for analysis." },
  ],
};
