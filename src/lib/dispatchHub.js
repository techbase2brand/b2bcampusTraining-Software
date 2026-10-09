// Selectors for the Dispatches hub page. Read-only: everything is derived from the existing dispatch
// records via lib/dashboardStats.js (the same records the Dashboard uses), so the two always agree.
// Nothing here writes state or creates a second dispatch list.

import { attentionHealth } from "@/data/dashboardStatus";
import { getAttentionItems, getDispatchRecords, getRecentOperationalActivity } from "./dashboardStats";

// Workflow order shown as a mini stepper on each card.
export const STAGE_STEPS = [
  { id: "ANALYSIS", label: "Analysis" },
  { id: "BROKER_COMMUNICATION", label: "Broker" },
  { id: "ASSIGNMENT", label: "Assign" },
  { id: "TRACKING", label: "Tracking" },
];

export const HUB_TABS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
];

export const HUB_SORTS = [
  { id: "latest", label: "Latest updated" },
  { id: "oldest", label: "Oldest" },
  { id: "status", label: "Status" },
  { id: "rate", label: "Highest rate" },
];

// "In progress" = still being worked before the truck moves (analysis, broker, assignment).
// "Active" = the shipment is moving (tracking). Unfinished = both.
const isProgress = (r) => !r.completed && (r.category === "draft" || r.category === "pending");
const isActive = (r) => !r.completed && r.category === "active";

export function getHub(state) {
  const records = getDispatchRecords(state);
  return {
    records,
    attention: getAttentionItems(state, records),
    activity: getRecentOperationalActivity(state, 6),
  };
}

export function hubStats(records) {
  return {
    total: records.length,
    active: records.filter(isActive).length,
    progress: records.filter(isProgress).length,
    completed: records.filter((r) => r.completed).length,
    atRisk: records.filter((r) => isActive(r) && attentionHealth.includes(r.health)).length,
  };
}

export const tabCounts = (records) => {
  const s = hubStats(records);
  return { all: s.total, active: s.active, progress: s.progress, completed: s.completed };
};

export function filterHub(records, { query = "", tab = "all" } = {}) {
  const q = query.trim().toLowerCase();
  return records.filter((r) => {
    if (tab === "active" && !isActive(r)) return false;
    if (tab === "progress" && !isProgress(r)) return false;
    if (tab === "completed" && !r.completed) return false;
    if (!q) return true;
    return [r.label, r.number, `#${r.number}`, r.slug, r.reference, r.loadId, r.route, r.origin, r.destination, r.driverName, r.truckId, r.brokerName, r.stageLabel, r.statusLabel].some((v) => v && String(v).toLowerCase().includes(q));
  });
}

const rank = (r) => (r.completed ? 4 : { active: 0, pending: 1, draft: 2 }[r.category] ?? 3);
const rate = (r) => r.agreedRate ?? r.postedRate ?? -1;

export function sortHub(records, sort = "latest") {
  const byNumber = (a, b) => Number(b.number) - Number(a.number);
  const cmp = {
    latest: (a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "") || byNumber(a, b),
    oldest: (a, b) => (a.updatedAt ?? "").localeCompare(b.updatedAt ?? "") || byNumber(b, a),
    status: (a, b) => rank(a) - rank(b) || byNumber(a, b),
    rate: (a, b) => rate(b) - rate(a) || byNumber(a, b),
  }[sort] ?? byNumber;
  return [...records].sort(cmp);
}

// Where a stage sits in the four-step workflow: index of the current step (completed = all done).
export function stageIndex(record) {
  if (record.completed) return STAGE_STEPS.length;
  return Math.max(0, STAGE_STEPS.findIndex((s) => s.id === record.stage));
}
