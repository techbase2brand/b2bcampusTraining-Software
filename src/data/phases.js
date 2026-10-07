// Training journey shown in onboarding: four headline phases, then the later stages.

export const journeyPhases = [
  { id: "foundation", title: "Foundation", blurb: "Setup & Basics", levels: "Level 1-5", icon: "Flag", tone: "text-blue" },
  { id: "load-search", title: "Load Search", blurb: "Find & Analyze Loads", levels: "Level 6-10", icon: "PackageSearch", tone: "text-success" },
  { id: "communication", title: "Communication", blurb: "Broker & Driver Calling", levels: "Level 11-15", icon: "Phone", tone: "text-gold-bright" },
  { id: "negotiation", title: "Negotiation", blurb: "Get the Best Rates", levels: "Level 16-20", icon: "Handshake", tone: "text-danger" },
];

export const laterStages = ["Dispatch Operations", "Tracking", "Advanced Operations", "Final Assessment"];

// Product build phases, referenced by levels (levels.js) and missions (phaseId).
export const trainingPhases = [
  { id: "phase-1", title: "Login & Onboarding" },
  { id: "phase-2", title: "Dispatcher Desk Setup" },
  { id: "phase-3", title: "Load Board & Finding Loads" },
  { id: "phase-4", title: "Load Analysis & Matching" },
  { id: "phase-5", title: "Broker Communication" },
];
