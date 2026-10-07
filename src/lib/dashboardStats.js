// Dashboard selectors. Everything is derived from the saved simulation state (earlier phases' IDs,
// the dispatch slice and the tracker); nothing here creates data. Dispatch RECORDS are unique by load
// id, so one load moving through negotiated -> assigned -> in transit is still one dispatch.
//
// Today the simulation keeps one live training dispatch, so there is at most one record. The helpers
// work on an array of records: finished dispatches archived later (state.dispatchRecords) are merged
// in by load id and counted automatically, with no change to the Dashboard.

import { statusCategories, attentionHealth, statusTones, healthTones, dashboardCopy, quickActions } from "@/data/dashboardStatus";
import { assignmentStatuses } from "@/data/dispatchComms";
import { trackingStatuses } from "@/data/phase7Missions";
import { dispatcherNav } from "@/data/navigation";
import { levels } from "@/data/levels";
import { missions } from "@/data/missions";
import { getLoad, getBroker, formatLocation } from "./loadSelectors";
import { getRosterEntry } from "./dispatchRoster";
import { readDispatch, getAssignmentStatus } from "./dispatchActions";
import { readTracking, getTimelineAlerts } from "./trackingActions";
import { fmtDateTime } from "./trackingComms";
import { resolveNav, effectiveLevel } from "./access";
import { formatCurrency } from "./text";

const STATUS_LABELS = { ...assignmentStatuses, ...trackingStatuses };
export const getStatusLabel = (id) => STATUS_LABELS[id] ?? String(id).toUpperCase();

// "pending" | "active" | "completed" for a canonical status id (null if unknown).
export function getDispatchStatusCategory(statusId) {
  return Object.keys(statusCategories).find((cat) => statusCategories[cat].includes(statusId)) ?? null;
}

const cityOf = (locationId) => formatLocation(locationId).split(",")[0];

// The live training dispatch as a record, or null when no load has entered dispatch yet.
function currentRecord(state) {
  const loadId = state.assignedLoadId ?? state.negotiatedLoadId ?? null;
  const load = loadId ? getLoad(loadId) : null;
  if (!load) return null;

  const tracking = state.assignedLoadId ? readTracking(state) : null;
  const trackerOn = Boolean(tracking?.ok);
  const dispatch = readDispatch(state);
  const statusId = trackerOn ? tracking.snap.statusId : getAssignmentStatus(dispatch.d);
  const entry = trackerOn ? tracking.entry : dispatch.entry ?? null;
  const started = trackerOn && tracking.run.started;
  const snap = trackerOn ? tracking.snap : null;
  const lastCheck = started ? tracking.t.checkCalls.at(-1) ?? null : null;

  return {
    loadId: load.id,
    reference: load.referenceNumber,
    statusId,
    statusLabel: getStatusLabel(statusId),
    category: getDispatchStatusCategory(statusId),
    driverId: entry?.driver.id ?? null,
    driverName: entry?.driver.name ?? null,
    truckId: entry?.truck.id ?? null,
    brokerName: getBroker(load.brokerId)?.name ?? null,
    origin: formatLocation(load.originLocationId),
    destination: formatLocation(load.destinationLocationId),
    route: `${cityOf(load.originLocationId)} → ${cityOf(load.destinationLocationId)}`,
    agreedRate: state.agreedRate ?? load.rate,
    postedRate: load.rate,
    eta: snap ? fmtDateTime(snap.etaDelivery) : null,
    location: snap ? snap.location : null,
    milesRemaining: snap ? snap.remainingMiles : null,
    health: snap ? snap.health : null,
    trackingStarted: started,
    lastCheckCall: lastCheck ? { time: fmtDateTime(new Date(lastCheck.timestamp)), location: lastCheck.location } : null,
    live: true,
  };
}

// Archived dispatches (future): minimal records saved by later phases, keyed by load id.
function archivedRecords(state) {
  return (Array.isArray(state.dispatchRecords) ? state.dispatchRecords : [])
    .filter((r) => r && getLoad(r.loadId))
    .map((r) => {
      const load = getLoad(r.loadId);
      const entry = r.driverId ? getRosterEntry(r.driverId) : null;
      return {
        loadId: load.id,
        reference: load.referenceNumber,
        statusId: r.statusId,
        statusLabel: getStatusLabel(r.statusId),
        category: getDispatchStatusCategory(r.statusId),
        driverId: entry?.driver.id ?? null,
        driverName: entry?.driver.name ?? null,
        truckId: entry?.truck.id ?? null,
        brokerName: getBroker(load.brokerId)?.name ?? null,
        origin: formatLocation(load.originLocationId),
        destination: formatLocation(load.destinationLocationId),
        route: `${cityOf(load.originLocationId)} → ${cityOf(load.destinationLocationId)}`,
        agreedRate: r.agreedRate ?? load.rate,
        postedRate: load.rate,
        eta: null,
        location: null,
        milesRemaining: null,
        health: null,
        trackingStarted: false,
        lastCheckCall: null,
        live: false,
      };
    });
}

// One record per unique load id (the live dispatch wins over an archived copy of the same load).
export function getDispatchRecords(state) {
  const byLoad = new Map();
  for (const r of archivedRecords(state)) byLoad.set(r.loadId, r);
  const live = currentRecord(state);
  if (live) byLoad.set(live.loadId, live);
  return [...byLoad.values()];
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

// What needs the dispatcher's attention right now, derived from dispatch and tracker state.
export function getAttentionItems(state, records) {
  const items = [];
  const live = records.find((r) => r.live);
  if (!live) return items;
  const ref = live.reference;
  if (live.category === "pending") {
    const d = readDispatch(state).d;
    const text = {
      negotiated: `${ref} is negotiated. Select a driver.`,
      "ready-for-assignment": `${ref} has a driver selected. Send the dispatch.`,
      assigned: d.response === "needs-clarification" ? `Driver needs clarification on ${ref}.` : `Driver confirmation pending for ${ref}.`,
      "driver-confirmed": `${ref}: driver accepted. Confirm the assignment.`,
    }[live.statusId];
    if (text) items.push({ id: `pending-${live.statusId}`, tone: d.response === "needs-clarification" ? "amber" : "blue", text, navId: "dispatch" });
  }
  if (live.category === "active") {
    const c = readTracking(state);
    if (c.ok && !c.run.started) items.push({ id: "tracking-not-started", tone: "cyan", text: `${ref} is ready for pickup. Start tracking.`, navId: "tracking" });
    if (c.ok && c.run.started) {
      for (const a of getTimelineAlerts(c)) {
        if (a.tone === "info") continue;
        items.push({ id: a.id, tone: a.tone === "danger" ? "red" : "amber", text: `${a.title}: ${a.text}`, navId: "tracking" });
      }
    }
  }
  return items;
}

// Operational events in order (oldest first), from persisted state only. Once the tracker has started
// its activity log already holds the assignment events, so those are not repeated from flags.
function operationalEvents(state) {
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

export function getRecentOperationalActivity(state, limit = 8) {
  const seen = new Set();
  return operationalEvents(state)
    .filter((e) => {
      const key = `${e.type}|${e.message}|${e.timestamp}`;
      return seen.has(key) ? false : seen.add(key);
    })
    .map((e) => ({ ...e, time: e.timestamp ? fmtDateTime(new Date(e.timestamp)) : null }))
    .reverse()
    .slice(0, limit);
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
    progress: getTrainingProgress(state),
    actions: getQuickActions(state),
    pending: getPendingDispatches(records),
  };
}

export { statusTones, healthTones };
