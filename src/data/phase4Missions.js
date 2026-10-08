// Phase 4: Level 3 mission "Load Analysis & Matching". Pure definition data.
// `question` tasks compare shortlisted loads on a metric computed in src/lib/loadCalculations.js.
// Nothing here reveals which load is best: the answer is derived from the student's shortlist.

export const mission03 = {
  id: "mission-03",
  levelId: 3,
  phaseId: "phase-4",
  title: "Load Analysis & Matching",
  intro:
    "You found suitable loads. Now compare them carefully and select the load that makes the most operational and financial sense for your truck.",
  objectives: [
    "Review your shortlist",
    "Find the lowest deadhead",
    "Calculate total miles",
    "Analyze RPM",
    "Compare fuel cost and profit",
    "Check pickup and HOS feasibility",
    "Select the best load",
  ],
  // Step tracker shown in the header (matches the reference design)
  steps: ["Review Shortlist", "Analyze & Compare", "Select Best Load", "Proceed to Broker Call"],
  tabs: [
    { id: "comparison", label: "Comparison View" },
    { id: "route", label: "Route & Map" },
    { id: "cost", label: "Cost Breakdown" },
    { id: "broker", label: "Broker Details" },
  ],
  tasks: [
    {
      id: "review-shortlist",
      title: "Review Shortlisted Loads",
      instruction: "Open each of your shortlisted loads and review the details.",
      hint: "Click each load card so it appears in the Load Details panel.",
      highlight: "shortlist-cards",
      rule: { type: "view-all-shortlisted" },
    },
    {
      id: "lowest-deadhead",
      title: "Identify Lowest Deadhead",
      instruction: "Which load requires the least unpaid travel? Deadhead is distance driven without paying freight.",
      hint: "Compare the Deadhead Miles (to Pickup) row.",
      highlight: "row-deadhead",
      question: { metric: "deadheadMiles", goal: "min", kind: "pick-load" },
    },
    {
      id: "total-miles",
      title: "Calculate Total Miles",
      instruction: "What are the total miles for {targetLoad}? Total miles = loaded miles + deadhead miles.",
      hint: "Add Loaded Miles and Deadhead Miles for that load.",
      highlight: "row-total-miles",
      question: { metric: "totalMiles", kind: "value", target: "first-shortlisted" },
    },
    {
      id: "analyze-rpm",
      title: "Analyze RPM",
      instruction: "Which load pays the best effective RPM (rate per TOTAL mile, including deadhead)? A high posted rate does not automatically mean a high RPM.",
      hint: "Effective RPM is the posted rate divided by loaded plus deadhead miles. Compare that row, not the posted rate.",
      highlight: "row-rpm",
      question: { metric: "allInRpm", goal: "max", kind: "pick-load" },
    },
    {
      id: "compare-fuel",
      title: "Compare Estimated Fuel Costs",
      instruction: "Which load has the lowest estimated fuel cost?",
      hint: "Fuel cost follows total miles, including the deadhead.",
      highlight: "row-fuel",
      question: { metric: "fuelCost", goal: "min", kind: "pick-load" },
    },
    {
      id: "compare-profit",
      title: "Compare Estimated Margin",
      instruction: "Which load has the highest estimated margin per mile (after fuel and operating costs)?",
      hint: "Margin = rate minus fuel and operating costs. Divide by total miles for margin per mile.",
      highlight: "row-profit",
      question: { metric: "profitPerMile", goal: "max", kind: "pick-load" },
    },
    {
      id: "check-feasibility",
      title: "Check Pickup / HOS Feasibility",
      instruction: "Which load leaves the driver the smallest HOS margin after the deadhead to pickup?",
      hint: "HOS margin = remaining HOS minus the drive time to the pickup.",
      highlight: "row-hos",
      question: { metric: "hosMarginMinutes", goal: "min", kind: "pick-load" },
    },
    {
      id: "select-best",
      title: "Select Best Load",
      instruction: "Select the load that makes the most sense for your truck, then explain why.",
      hint: "Weigh RPM, deadhead, profit and timing together. The highest posted rate is not always the best load.",
      highlight: "select-best",
      rule: { type: "select-best" },
    },
  ],

  // Explain-your-decision options. `evidence` names the metric the reason is tested against;
  // `misleading` reasons never count as support for the chosen load.
  decisionReasons: [
    // Tested decision reasons: each is checked against the numbers for the chosen load.
    { id: "strong-rpm", label: "Strong RPM", evidence: { metric: "allInRpm", goal: "max" } },
    { id: "low-deadhead", label: "Low Deadhead", evidence: { metric: "deadheadMiles", goal: "min" } },
    { id: "better-profit", label: "Better Profit / Margin", evidence: { metric: "estimatedProfit", goal: "max" } },
    // Informational confirmations: true for every valid candidate, so never scored.
    { id: "equipment", label: "Compatible Equipment", informational: true },
    { id: "pickup-timing", label: "Good Pickup Timing", informational: true },
    { id: "hos-feasible", label: "Driver / HOS Feasible", informational: true },
    // Distractors: attractive but never a valid justification on their own.
    { id: "highest-rate", label: "Highest Posted Rate", misleading: true },
    { id: "longest-haul", label: "Longest Distance", misleading: true },
  ],

  // Comparison table rows. `hidden: true` rows stay blank until the decision is confirmed.
  comparisonMetrics: [
    { key: "lineHaulRate", label: "Line Haul Rate", format: "currency" },
    { key: "loadedMiles", label: "Total Miles (Loaded)", format: "miles" },
    { key: "deadheadMiles", label: "Deadhead Miles (to Pickup)", format: "miles", highlightId: "row-deadhead" },
    { key: "totalMiles", label: "Total Miles (Loaded + Deadhead)", format: "miles", highlightId: "row-total-miles" },
    { key: "rpm", label: "Rate per Loaded Mile", format: "currencyPerMile" },
    { key: "allInRpm", label: "Effective RPM (Rate per Total Mile)", format: "currencyPerMile", highlightId: "row-rpm" },
    { key: "fuelCost", label: "Estimated Fuel Cost", format: "currency", highlightId: "row-fuel" },
    { key: "estimatedCost", label: "Estimated Total Cost (Fuel + Other)", format: "currency" },
    { key: "estimatedProfit", label: "Estimated Margin (after fuel & operating costs)", format: "currency", highlightId: "row-profit" },
    { key: "profitPerMile", label: "Margin per Mile", format: "currencyPerMile" },
    { key: "deliveryTime", label: "Delivery Time", format: "duration" },
    { key: "hosMarginMinutes", label: "HOS Margin after Deadhead", format: "duration", highlightId: "row-hos" },
    { key: "overallScore", label: "Overall Score", format: "stars", hidden: true },
  ],

  feedback: {
    strongMatch: {
      title: "STRONG MATCH",
      text: "This load provides a strong balance of RPM, low deadhead, compatible equipment and practical pickup timing.",
    },
    acceptable: {
      title: "ACCEPTABLE MATCH",
      text: "This is a workable load, but another shortlisted load balances rate, deadhead and profit better. Review the comparison again.",
    },
    review: {
      title: "REVIEW YOUR DECISION",
      // {betterLoad} is the top-ranked shortlisted load; {weakMetrics} lists where the pick falls short.
      text: "{betterLoad} looks stronger overall. Your pick is weaker on {weakMetrics}. Compare again before deciding.",
    },
    reasonMismatch: "Check your reasons: {reasons} does not hold up for this load compared with the others.",
    reasonsHelp: "Choose the reasons that are actually supported by the numbers.",
  },

  trainerLines: {
    intro: "A high posted rate does not automatically make a load profitable.",
    deadhead: "Deadhead is distance driven without paying freight.",
  },

  aiPreview: {
    prompt: "Ask AI for analysis",
    // Predefined, data-driven observation templates (no LLM).
    observations: [
      "Compare rate per mile, not just the posted rate.",
      "Deadhead adds fuel and time but earns nothing.",
      "Check that the driver's remaining HOS covers the trip to pickup.",
    ],
  },
};

export const phase4CompletionMetrics = [
  "Loads Compared",
  "Calculation Accuracy",
  "Deadhead Awareness",
  "RPM Understanding",
  "Profitability Decision",
  "Decision Quality",
  "Hints Used",
  "XP Earned",
  "Stars Earned",
];

// Page copy, flow strip and completion for Phase 4.
export const phase4Page = {
  eyebrow: "Mission 3",
  title: "Load Analysis & Matching",
  subtitle: "Compare your shortlisted loads, analyze rates and calculate profitability to choose the best load for your truck.",
  truckTitle: "Your Assigned Truck",
  shortlistTitle: "Shortlisted Loads",
  shortlistSub: "Analyze and compare these loads to find the best match for your truck.",
  flow: [
    { id: "review", title: "Review Shortlisted Loads", text: "Check the loads you shortlisted on the Load Board." },
    { id: "factors", title: "Analyze Key Factors", text: "Check RPM, deadhead, total miles, fuel cost and estimated margin." },
    { id: "compare", title: "Compare Loads", text: "Use the comparison view to see which load makes the most sense." },
    { id: "route", title: "Check Route & Map", text: "View the route, deadhead distance and pickup / delivery locations." },
    { id: "select", title: "Select the Best Load", text: "Choose the load that best fits your truck, and explain why." },
  ],
  completion: {
    title: "LOAD ANALYSIS COMPLETE",
    subtitle: "You compared your shortlist and selected a load for your truck.",
    unlocked: "Level 4: Broker Calling & Communication unlocked",
    cta: "Next Mission: Broker Communication",
    secondary: "Return to Level Map",
  },
};

// Coaching for each question metric. {ref} = load reference, {value} = the answer value.
export const questionFeedback = {
  deadheadMiles: {
    rowLabel: "Deadhead Miles (to Pickup)",
    correct: "Correct. {ref} needs the least unpaid travel ({value} mi to the pickup).",
    wrong: "That load needs more unpaid travel to its pickup. Compare the Deadhead Miles row: deadhead is distance driven without paying freight.",
  },
  totalMiles: {
    rowLabel: "Total Miles (Loaded + Deadhead)",
    correct: "Correct. Total miles are loaded miles plus deadhead miles: {value} mi.",
    wrong: "Total miles must include the deadhead. Add the load's Loaded Miles and Deadhead Miles.",
  },
  allInRpm: {
    rowLabel: "Effective RPM (Rate per Total Mile)",
    correct: "Correct. {ref} pays {value} per total mile once deadhead is counted.",
    wrong: "That is not the best effective RPM. Divide each posted rate by its total miles, deadhead included. The highest posted rate is not always the highest RPM.",
  },
  fuelCost: {
    rowLabel: "Estimated Fuel Cost",
    correct: "Correct. {ref} has the lowest estimated fuel cost ({value}) because it needs the fewest total miles.",
    wrong: "Fuel cost follows total miles, deadhead included. Compare the Estimated Fuel Cost row.",
  },
  profitPerMile: {
    rowLabel: "Margin per Mile",
    correct: "Correct. {ref} keeps the most margin per mile ({value}).",
    wrong: "Margin per mile is the estimated margin divided by total miles. Compare that row, not the total margin.",
  },
  hosMarginMinutes: {
    rowLabel: "HOS Margin after Deadhead",
    correct: "Correct. {ref} leaves the smallest HOS buffer ({value}) after driving to the pickup.",
    wrong: "HOS margin is the driver's remaining HOS minus the drive time to the pickup. The load with the longest trip to its pickup leaves the least.",
  },
};

// Copy for choosing, confirming and explaining the best load.
export const selectionCopy = {
  selectButton: "Choose This Load",
  confirmTitle: "Choose this load?",
  confirmNote: "This is only your current choice. You can change it any time before you lock in a deal with the broker.",
  confirmButton: "CHOOSE LOAD",
  cancelButton: "Cancel",
  reasonsTitle: "Why did you choose this load?",
  reasonsHint: "Pick the reasons the numbers actually support.",
  informationalTitle: "Confirmed for every shortlisted load",
  submitReasons: "Submit decision",
  compareAgain: "COMPARE AGAIN",
  tryAnother: "TRY ANOTHER LOAD",
  continueWith: "Continue with This Load",
};
