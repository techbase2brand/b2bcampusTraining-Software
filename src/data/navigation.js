// Sidebar definitions. Access is decided centrally by src/lib/access.js (never by components):
//   unlockLevel: the level the student must have REACHED (cumulative; later missions never relock it).
//                null = not part of progression yet, so it keeps its static `status`.
//   route:       where an unlocked item goes. `page: true` = its own route (not a section of /dispatcher).
//   status:      fallback for items without an unlockLevel: "enabled" | "preview" | "locked".
// Level 2 is reached after Mission 1, Level 3 after Mission 2, Level 4 after Mission 3, and so on.
// Level 6 (reached once Mission 5 / Phase 6 is done) opens Tracking, AI Assistant, Reports, Learning, Settings.

export const dispatcherNav = [
  { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", status: "enabled", unlockLevel: 1, route: "/dispatcher" },
  { id: "trucks", label: "Trucks", icon: "Truck", status: "enabled", unlockLevel: 1, route: "/dispatcher" },
  { id: "drivers", label: "Drivers", icon: "Users", status: "enabled", unlockLevel: 1, route: "/dispatcher" },
  { id: "load-board", label: "Load Board", icon: "PackageSearch", status: "locked", unlockLevel: 2, route: "/dispatcher/load-board", page: true },
  { id: "brokers", label: "Brokers", icon: "Handshake", status: "locked", unlockLevel: 4, route: "/dispatcher/brokers", page: true },
  { id: "dispatch", label: "Dispatch", icon: "Send", status: "locked", unlockLevel: 5, route: "/dispatcher/dispatch", page: true },
  { id: "tracking", label: "Tracking", icon: "MapPinned", status: "locked", unlockLevel: 6, route: "/dispatcher/tracking", page: true },
  { id: "ai-assistant", label: "AI Assistant", icon: "Bot", status: "locked", unlockLevel: 6, route: "/dispatcher/ai-assistant", page: true },
  { id: "reports", label: "Reports", icon: "BarChart3", status: "locked", unlockLevel: 6, route: "/dispatcher/reports", page: true },
  { id: "learning", label: "Learning", icon: "GraduationCap", status: "locked", unlockLevel: 6, route: "/dispatcher/learning", page: true },
  { id: "settings", label: "Settings", icon: "Settings", status: "locked", unlockLevel: 6, route: "/dispatcher/settings", page: true },
];

// Level Map sidebar. Trucks and Drivers open once Mission 1 is done (inside the workspace they are
// always usable, since Mission 1 is played there).
export const homeNav = [
  { id: "home", label: "Home", icon: "House", status: "enabled", unlockLevel: 1, route: null },
  { id: "trucks", label: "Trucks", icon: "Truck", status: "locked", unlockLevel: 2, route: "/dispatcher" },
  { id: "drivers", label: "Drivers", icon: "Users", status: "locked", unlockLevel: 2, route: "/dispatcher" },
  { id: "load-board", label: "Load Board", icon: "PackageSearch", status: "locked", unlockLevel: 2, route: "/dispatcher/load-board", page: true },
  { id: "brokers", label: "Brokers", icon: "Handshake", status: "locked", unlockLevel: 4, route: "/dispatcher/brokers", page: true },
  { id: "dispatch", label: "Dispatch", icon: "Send", status: "locked", unlockLevel: 5, route: "/dispatcher/dispatch", page: true },
  { id: "tracking", label: "Tracking", icon: "MapPinned", status: "locked", unlockLevel: 6, route: "/dispatcher/tracking", page: true },
  { id: "ai-assistant", label: "AI Assistant", icon: "Bot", status: "locked", unlockLevel: 6, route: "/dispatcher/ai-assistant", page: true },
  { id: "reports", label: "Reports", icon: "BarChart3", status: "locked", unlockLevel: 6, route: "/dispatcher/reports", page: true },
  { id: "learning", label: "Learning", icon: "GraduationCap", status: "locked", unlockLevel: 6, route: "/dispatcher/learning", page: true },
  { id: "settings", label: "Settings", icon: "Settings", status: "locked", unlockLevel: 6, route: "/dispatcher/settings", page: true },
];
