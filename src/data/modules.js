// Content for the sidebar modules that open after Phase 6: AI Assistant, Reports, Learning, Settings.
// They are accessible shells for now (the full features come in later phases); copy lives here.

export const moduleShells = {
  "ai-assistant": {
    navId: "ai-assistant",
    route: "/dispatcher/ai-assistant",
    eyebrow: "AI Assistant",
    title: "Your Dispatch Co-Pilot",
    subtitle: "A training assistant that will answer dispatch questions, explain rules and review your decisions.",
    badge: "Preview",
    features: [
      { title: "Ask a dispatch question", text: "Get plain-language answers about HOS, deadhead, rate per mile and appointments." },
      { title: "Review my decision", text: "Explain why a load, driver or ETA call was right or wrong." },
      { title: "Draft a message", text: "Suggest broker or driver wording for rate talks, dispatch sheets and delay updates." },
      { title: "AI-assisted calls", text: "Practice live calls with a simulated broker or driver." },
    ],
    note: "Coming later. For now, the Training Agent in each mission guides you step by step.",
  },
  reports: {
    navId: "reports",
    route: "/dispatcher/reports",
    eyebrow: "Reports",
    title: "Training Reports",
    subtitle: "Your progress so far. Operational reports (lanes, profit, on-time performance) arrive with later phases.",
    badge: "Early access",
    features: [
      { title: "Mission results", text: "Stars, XP and accuracy for every completed mission." },
      { title: "Lane & profit reports", text: "Rate per mile, deadhead and margin across the loads you booked." },
      { title: "On-time performance", text: "ETA accuracy and exception handling from shipment monitoring." },
    ],
    note: "Full reports are coming later.",
  },
  learning: {
    navId: "learning",
    route: "/dispatcher/learning",
    eyebrow: "Learning",
    title: "Learning Center",
    subtitle: "Replay any mission and revisit the ideas behind it.",
    badge: "Early access",
    features: [
      { title: "Mission library", text: "Every mission with what it teaches." },
      { title: "Dispatch glossary", text: "Deadhead, HOS, RPM, FCFS, detention, POD and more." },
      { title: "Practice scenarios", text: "Extra drills for rate negotiation, check calls and exceptions." },
    ],
    note: "The glossary and drills are coming later.",
  },
  settings: {
    navId: "settings",
    route: "/dispatcher/settings",
    eyebrow: "Settings",
    title: "Settings",
    subtitle: "Your profile and training preferences.",
    badge: "Early access",
    features: [
      { title: "Profile", text: "Your name, role and avatar." },
      { title: "Training preferences", text: "Hints, sound and guided highlights will be adjustable here." },
      { title: "Progress", text: "Your saved progress stays on this device." },
    ],
    note: "More options are coming later.",
  },
};
