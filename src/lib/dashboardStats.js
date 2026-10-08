// Dashboard selectors. Everything is derived from the saved simulation state (earlier phases' IDs,
// the dispatch slice and the tracker); nothing here creates data. Dispatch RECORDS are unique by load
// id, so one load moving through negotiated -> assigned -> in transit is still one dispatch.
//
// Today the simulation keeps one live training dispatch, so there is at most one record. The helpers
// work on an array of records: finished dispatches archived later (state.dispatchRecords) are merged
// in by load id and counted automatically, with no change to the Dashboard.

import { statusCategories, attentionHealth, statusTones, healthTones, dashboardCopy, quickActions } from "@/data/dashboardStatus";
import { dispatcherNav } from "@/data/navigation";
import { levels } from "@/data/levels";
import { missions } from "@/data/missions";
import { getLoad } from "./loadSelectors";
import { getRosterEntry } from "./dispatchRoster";
import { readDispatch } from "./dispatchActions";
import { getDispatches, projectDispatchState } from "./dispatchRecords";
import { describeDispatch, getStatusLabel, getStatusCategory } from "./dispatchView";
import { readTracking, getTimelineAlerts } from "./trackingActions";
import { fmtDateTime } from "./trackingComms";
import { resolveNav, effectiveLevel } from "./access";
import { formatCurrency } from "./text";

export { getStatusLabel, getStatusCategory as getDispatchStatusCategory };

// One display record per dispatch (all of them: draft, pending, active and completed), built from
// the dispatch's own saved state. Nothing is shared between dispatches.
function buildRecord(state, dispatch) {
  const base = describeDispatch(dispatch);
  const proj = projectDispatchState(state, dispatch);
  const tracking = dispatch.ops.assignedLoadId ? readTracking(proj) : null;
  const trackerOn = Boolean(tracking?.ok);
  const started = trackerOn && tracking.run.started;
  const snap = trackerOn ? tracking.snap : null;
  const lastCheck = started ? tracking.t.checkCalls.at(-1) ?? null : null;
  return {
    ...base,
    agreedRate: base.agreedRate ?? null,
    eta: snap ? fmtDateTime(snap.etaDelivery) : null,
    location: snap ? snap.location : null,
    milesRemaining: snap ? snap.remainingMiles : null,
    health: snap ? snap.health : null,
    trackingStarted: started,
    lastCheckCall: lastCheck ? { time: fmtDateTime(new Date(lastCheck.timestamp)), location: lastCheck.location } : null,
    live: !base.completed,
  };
}

// Every dispatch record, newest first.
export function getDispatchRecords(state) {
  return [...getDispatches(state)].sort((a, b) => b.sequenceNumber - a.sequenceNumber).map((d) => buildRecord(state, d));
}

const inCategory = (records, cat) => records.filter((r) => r.category === cat);
export const getPendingDispatches = (records) => inCategory(records, "pending");
export const getActiveShipments = (records) => inCategory(records, "active");
export const getCompletedDispatches = (records) => inCategory(records, "completed");
// Delayed / at risk is a health flag on shipments that are still moving; it does not remove them from Active.
export const getDelayedShipments = (records) => getActiveShipments(records).filter((r) => attentionHealth.includes(r.health));

export function getDashboardStats(records) {
  return {
    total: records.length,
    active: getActiveShipments(records).length,
    pending: getPendingDispatches(records).length,
    completed: getCompletedDispatches(records).length,
    delayed: getDelayedShipments(records).length,
  };
}

// ---- Supporting views ---------------------------------------------------------------------

// Stat cards with their (data-driven) supporting line; navId is set only when the destination is unlocked.
export function getStatCards(state, stats) {
  const items = resolveNav(dispatcherNav, state);
  const route = (navId) => {
    const item = items.find((i) => i.id === navId);
    return item && item.status === "enabled" && item.page ? item.route : null;
  };
  return Object.entries(dashboardCopy.stats).map(([id, copy]) => {
    const value = stats[id];
    const supporting = value === 0 ? copy.empty : value > 1 && copy.supportingMany ? copy.supportingMany : copy.supporting;
    const navId = value > 0 && copy.navId && route(copy.navId) ? copy.navId : null;
    return { id, label: copy.label, value, supporting, navId, anchor: id === "total" && value > 0 ? "#dispatch-overview" : null };
  });
}

// The current-dispatch card: the first active shipment (most advanced first), else nothing.
export function getCurrentShipment(records) {
  return getActiveShipments(records)[0] ?? null;
}

export function getTrackingSummary(records) {
  const r = getActiveShipments(records).find((x) => x.trackingStarted) ?? getCompletedDispatches(records).find((x) => x.trackingStarted) ?? null;
  if (!r) return null;
  return { reference: r.reference, location: r.location, milesRemaining: r.milesRemaining, eta: r.eta, health: r.health, lastCheckCall: r.lastCheckCall };
}

// What needs the dispatcher's attention right now, across ALL unfinished dispatches. Each item
// carries the dispatch's own resume route.
export function getAttentionItems(state, records) {
  const items = [];
  for (const r of records.filter((x) => x.live)) {
    const dispatch = getDispatches(state).find((d) => d.slug === r.slug);
    const proj = projectDispatchState(state, dispatch);
    const label = `${r.label}${r.reference ? ` (${r.reference})` : ""}`;
    const add = (id, tone, text) => items.push({ id: `${r.slug}-${id}`, tone, text, navId: null, route: r.resumeRoute });

    if (r.category === "draft") {
      add(r.stage, "cyan", r.stage === "BROKER_COMMUNICATION" ? `${label}: continue with the broker.` : `${label}: compare the shortlist and choose a load.`);
    } else if (r.category === "pending") {
      const d = readDispatch(proj).d;
      const text = {
        negotiated: `${label} is negotiated. Select a driver.`,
        "ready-for-assignment": `${label} has a driver selected. Send the dispatch.`,
        assigned: d.response === "needs-clarification" ? `Driver needs clarification on ${label}.` : `Driver confirmation pending for ${label}.`,
        "driver-confirmed": `${label}: driver accepted. Confirm the assignment.`,
      }[r.statusId];
      if (text) add(`pending-${r.statusId}`, d.response === "needs-clarification" ? "amber" : "blue", text);
    } else if (r.category === "active") {
      const c = readTracking(proj);
      if (c.ok && !c.run.started) add("tracking-not-started", "cyan", `${label} is ready for pickup. Start tracking.`);
      if (c.ok && c.run.started) {
        for (const a of getTimelineAlerts(c)) {
          if (a.tone === "info") continue;
          items.push({ id: `${r.slug}-${a.id}`, tone: a.tone === "danger" ? "red" : "amber", text: `${label}: ${a.title}. ${a.text}`, navId: null, route: r.resumeRoute });
        }
      }
    }
  }
  return items;
}

// Operational events of ONE dispatch in order (oldest first), from its persisted state only. Once the
// tracker has started its activity log already holds the assignment events, so those are not
// repeated from flags.
export function operationalEvents(state) {
  const events = [];
  const neg = state.negotiatedLoadId ? getLoad(state.negotiatedLoadId) : null;
  const picked = state.selectedBestLoadId ? getLoad(state.selectedBestLoadId) : null;
  if (picked) events.push({ id: "selected", type: "selected", timestamp: null, message: `Load ${picked.referenceNumber} selected` });
  if (neg && state.agreedRate != null) events.push({ id: "negotiated", type: "negotiated", timestamp: null, message: `Rate negotiated at ${formatCurrency(state.agreedRate)}` });

  const log = state.activityLog ?? [];
  const tracking = state.assignedLoadId && state.trackingLoadId === state.assignedLoadId && log.length > 0;
  if (tracking) {
    for (const a of log) events.push({ id: a.id, type: a.type, timestamp: a.timestamp, message: a.message });
  } else if (state.assignedLoadId) {
    const entry = state.assignedDriverId ? getRosterEntry(state.assignedDriverId) : null;
    const stamp = state.assignmentTimestamp ?? null;
    if (entry) events.push({ id: "assigned", type: "assigned", timestamp: stamp, message: `${entry.driver.name} assigned` });
    if (state.dispatchSent) events.push({ id: "dispatch-sent", type: "dispatch-sent", timestamp: stamp, message: "Dispatch sent" });
    if (state.driverConfirmed) events.push({ id: "driver-accepted", type: "driver-accepted", timestamp: stamp, message: "Driver accepted load" });
  }
  return events;
}

// Activity of one dispatch (newest first). Used by the dispatch detail page.
export function getDispatchActivity(state, dispatch, limit = 50) {
  const proj = projectDispatchState(state, dispatch);
  const created = { id: "created", type: "created", timestamp: null, message: `Dispatch created with ${dispatch.ops.shortlistedLoadIds.length} shortlisted loads` };
  const seen = new Set();
  return [created, ...operationalEvents(proj)]
    .filter((e) => {
      const key = `${e.type}|${e.message}|${e.timestamp}`;
      return seen.has(key) ? false : seen.add(key);
    })
    .map((e) => ({ ...e, time: e.timestamp ? fmtDateTime(new Date(e.timestamp)) : null }))
    .reverse()
    .slice(0, limit);
}

// Recent activity across all dispatches: dispatches by most recent update, newest event first
// within each, every line tagged with its dispatch.
export function getRecentOperationalActivity(state, limit = 8) {
  const out = [];
  for (const d of [...getDispatches(state)].sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))) {
    const tag = describeDispatch(d).label;
    for (const e of getDispatchActivity(state, d)) out.push({ ...e, id: `${d.slug}-${e.id}`, message: `${tag} — ${e.message}`, dispatchSlug: d.slug });
  }
  return out.slice(0, limit);
}

export function getTrainingProgress(state) {
  const playable = levels.filter((l) => l.missionId && missions[l.missionId]);
  const level = effectiveLevel(state);
  const current = playable.find((l) => l.id === level) ?? null;
  return {
    level,
    completed: state.completedLevels.length,
    totalMissions: playable.length,
    currentMission: current ? current.title : null,
    xp: state.xp,
    stars: state.stars,
    streak: state.streak,
  };
}

// Only unlocked modules are offered. Sections inside the workspace (Drivers) are always navigable.
export function getQuickActions(state) {
  const items = resolveNav(dispatcherNav, state);
  return quickActions.filter((a) => items.find((i) => i.id === a.navId)?.status === "enabled");
}

export function getDashboard(state) {
  const records = getDispatchRecords(state);
  const stats = getDashboardStats(records);
  return {
    records,
    stats,
    cards: getStatCards(state, stats),
    current: getCurrentShipment(records),
    tracking: getTrackingSummary(records),
    attention: getAttentionItems(state, records),
    activity: getRecentOperationalActivity(state),
    dispatches: getDispatches(state).length,
    progress: getTrainingProgress(state),
    actions: getQuickActions(state),
    pending: getPendingDispatches(records),
  };
}

export { statusTones, healthTones };
