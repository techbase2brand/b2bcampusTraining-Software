// Dashboard configuration: which dispatch status belongs to which dashboard category, badge tones,
// card copy and quick actions. No dispatch data lives here: every number on the Dashboard is
// calculated from the saved simulation state by src/lib/dashboardStats.js.
//
// Status ids are the canonical ones already used by the simulation:
//   dispatch (Phase 6, data/dispatchComms.js assignmentStatuses): negotiated, ready-for-assignment,
//     assigned, driver-confirmed, ready-for-pickup
//   tracking (Phase 7, data/phase7Missions.js trackingStatuses): ready-for-pickup, en-route-pickup,
//     arrived-pickup, loading, picked-up, in-transit, monitoring, arrived-delivery
// "ready-for-pickup" is the same status in both. Later statuses (delivered, completed, closed) are
// listed so the dashboard keeps working when those phases add them.

export const statusCategories = {
  // Early stages of a dispatch (load analysis / broker communication): counted in the total only.
  draft: ["draft", "negotiating"],
  pending: ["negotiated", "ready-for-assignment", "assigned", "driver-confirmed"],
  active: ["ready-for-pickup", "en-route-pickup", "arrived-pickup", "loading", "picked-up", "in-transit", "monitoring"],
  completed: ["arrived-delivery", "delivered", "completed", "closed"],
};

// Shipment health values (from the tracker) that count as "delayed / at risk".
export const attentionHealth = ["AT RISK", "DELAYED", "LATE"];

// Badge tone per status id (mapped to classes in components/dashboard/StatusBadge.js).
export const statusTones = {
  draft: "cyan",
  negotiating: "amber",
  negotiated: "cyan",
  "ready-for-assignment": "amber",
  assigned: "blue",
  "driver-confirmed": "blue",
  "ready-for-pickup": "cyan",
  "en-route-pickup": "cyan",
  "arrived-pickup": "cyan",
  loading: "cyan",
  "picked-up": "cyan",
  "in-transit": "green",
  monitoring: "green",
  "arrived-delivery": "green",
  delivered: "green",
  completed: "green",
  closed: "green",
};

export const healthTones = { "ON TRACK": "green", "AT RISK": "amber", DELAYED: "red", LATE: "red" };

export const dashboardCopy = {
  stats: {
    total: { label: "Total Dispatches", supporting: "Loads entered dispatch workflow", empty: "No dispatch started yet", route: null },
    active: { label: "Active Tracking", supporting: "Shipment currently monitored", supportingMany: "Shipments currently monitored", empty: "No shipment in motion", navId: "tracking" },
    pending: { label: "Pending", supporting: "Waiting for next operational step", empty: "Nothing waiting", navId: "dispatch" },
    completed: { label: "Completed", supporting: "Shipment workflow completed", supportingMany: "Shipment workflows completed", empty: "None completed yet", navId: "reports" },
    delayed: { label: "Delayed / At Risk", supporting: "Needs attention", empty: "No active exceptions", navId: "tracking" },
  },
  emptyShipment: "No active shipment is currently being tracked.",
  allClear: "All active operations are on track.",
};

// Quick actions. Only the ones whose sidebar module is unlocked are shown.
export const quickActions = [
  { navId: "load-board", label: "Open Load Board", icon: "PackageSearch" },
  { navId: "brokers", label: "View Brokers", icon: "Handshake" },
  { navId: "dispatch", label: "Open Dispatch", icon: "Send" },
  { navId: "tracking", label: "Track Shipment", icon: "MapPinned" },
  { navId: "drivers", label: "View Drivers", icon: "Users" },
  { navId: "reports", label: "View Reports", icon: "BarChart3" },
];
