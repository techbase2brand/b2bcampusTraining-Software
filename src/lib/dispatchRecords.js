// Multi-dispatch model. Pure functions over the saved game state (no React, no storage).
//
//   GLOBAL TRAINING PROGRESS   xp, stars, coins, streak, level/unlocks, trainingLedger (one-time
//                              rewards already earned), the Load Board builder.
//   DISPATCH RECORD            everything about ONE dispatch: shortlist, candidate/selected load,
//                              broker conversation, agreed rate, driver/truck, tracking, activity.
//                              Stored in state.dispatches (runtime data, never in src/data).
//
// The mission engines (phase4Actions, commsActions, dispatchActions, trackingActions) are written
// against one flat state object. Instead of rewriting them, every dispatch is PROJECTED into that
// flat shape (projectDispatchState), the engine runs unchanged, and its patch is split back:
// operational keys go to the dispatch (by id), rewards go to the global state through the ledger
// (applyScopedPatch). A page therefore can only ever read or write the dispatch in its URL.

import { initialGameState, initialMissionProgress } from "@/data/users";
import { defaultLoadFilters } from "@/data/loadFilters";
import { simulationConfig } from "@/data/simulationConfig";
import { taskXp } from "@/data/rewards";
import { getLoad, getBroker } from "./loadSelectors";
import { getRosterEntry } from "./dispatchRoster";
import { readDispatch, getAssignmentStatus } from "./dispatchActions";

// ---- Which saved fields belong to a dispatch ----------------------------------------------

export const OPS_KEYS = [
  // analysis (Phase 4) and practice
  "shortlistedLoadIds", "selectedBestLoadId", "decisionReasonIds", "candidateDecision", "analysisViewedLoadIds", "answeredTaskIds",
  // broker communication (Mission 4) and the finalized deal
  "commsLoadId", "selectedBrokerId", "detailsReviewed", "coveredTopics", "commsMessages", "negotiation", "callNotes", "commsStats",
  "communicationMode", "brokerConfirmed", "negotiatedLoadId", "agreedRate", "loadFinalized", "finalizedBrokerId", "finalDecisionReasonIds", "attemptHistory",
  // driver assignment (Mission 5)
  "dispatchLoadId", "loadReviewed", "viewedDriverIds", "selectedDriverId", "driverChecks", "driverTopics", "driverMessages", "driverCallNotes",
  "driverCommMode", "dispatchReviewed", "dispatchSent", "driverResponse", "driverAsk", "driverConfirmed", "assignedLoadId", "assignedDriverId",
  "assignedTruckId", "assignmentTimestamp", "loadAssignmentStatus",
  // tracking (Mission 6)
  "trackingLoadId", "trackingStep", "trackingFlags", "currentShipmentStatus", "lastKnownLocation", "checkCallLog", "activityLog", "delayEvents",
  "brokerUpdates", "trackingMessages", "trackingNotes", "trackingCommMode", "currentETA", "arrivalConfirmed", "phase7Completed",
];
const OPS_SET = new Set(OPS_KEYS);

// Mission runs that are tracked per dispatch (guidance, task pointers). Rewards stay global.
export const DISPATCH_MISSIONS = ["mission-03", "mission-04", "mission-05", "mission-06"];
const TRACKING_MISSION = "mission-06";

// The Load Board builder: fresh state for the NEXT dispatch.
export const BUILDER_RESET = {
  shortlistedLoadIds: [],
  reviewedLoadIds: [],
  rejectedLoadIds: [],
  selectedLoadId: null,
  loadChecks: {},
  loadFilters: defaultLoadFilters,
};

const clone = (v) => JSON.parse(JSON.stringify(v));
const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, clone(obj[k])]));
export const freshOps = () => pick(initialGameState, OPS_KEYS);

// ---- Slugs and ids ------------------------------------------------------------------------

export const createDispatchSlug = (sequenceNumber) => `dispatch-${String(sequenceNumber).padStart(4, "0")}`;

// Highest sequence ever used + 1. Never derived from array length, so a slug is never reused even
// if a record is removed from view.
export function nextSequenceNumber(state) {
  const used = (state.dispatches ?? []).map((d) => d.sequenceNumber ?? 0);
  return Math.max(state.dispatchSeq ?? 0, ...used) + 1;
}

const newId = (seq) => globalThis.crypto?.randomUUID?.() ?? `dsp-${seq}-${Math.random().toString(36).slice(2, 10)}`;
export const nowIso = () => new Date().toISOString();

// ---- Selectors ----------------------------------------------------------------------------

export const getDispatches = (state) => state.dispatches ?? [];
export const getDispatchById = (state, id) => getDispatches(state).find((d) => d.id === id) ?? null;
export const getDispatchBySlug = (state, slug) => getDispatches(state).find((d) => d.slug === slug) ?? null;
export const isDispatchCompleted = (d) => Boolean(d?.completion?.isCompleted);

export const getActiveDispatches = (state) => getDispatches(state).filter((d) => !isDispatchCompleted(d));
export const getCompletedDispatches = (state) => getDispatches(state).filter(isDispatchCompleted);
// Pending = finalized deal, not yet moving (assignment stage or ready for pickup).
export const getPendingDispatches = (state) => getActiveDispatches(state).filter((d) => d.workflowStage === "ASSIGNMENT");
export const getDispatchesByStatus = (state, status) => getDispatches(state).filter((d) => d.operationalStatus === status);

// The flat, engine-shaped view of one dispatch (global progress + the dispatch's own fields).
export function projectDispatchState(state, dispatch) {
  return {
    ...state,
    ...freshOps(),
    ...dispatch.ops,
    missionRuns: { ...state.missionRuns, ...dispatch.missionRuns },
    activeDispatchId: dispatch.id,
  };
}

// What the dispatch currently refers to, resolved from IDs and static data.
export function getDispatchSummary(dispatch) {
  const o = dispatch.ops;
  const finalLoadId = o.negotiatedLoadId ?? null;
  const loadId = finalLoadId ?? o.selectedBestLoadId ?? null;
  const load = loadId ? getLoad(loadId) : null;
  return {
    loadId,
    finalLoadId,
    candidateLoadId: o.selectedBestLoadId ?? null,
    load,
    brokerId: load?.brokerId ?? null,
    agreedRate: o.agreedRate ?? null,
    driverId: o.assignedDriverId ?? o.selectedDriverId ?? null,
    truckId: o.assignedTruckId ?? null,
    shortlistLoadIds: o.shortlistedLoadIds ?? [],
  };
}
export const getDispatchLoad = (dispatch) => getDispatchSummary(dispatch).load;
export const getDispatchBroker = (dispatch) => {
  const load = getDispatchLoad(dispatch);
  return load ? getBroker(load.brokerId) : null;
};
export const getDispatchDriver = (dispatch) => {
  const id = getDispatchSummary(dispatch).driverId;
  return id ? getRosterEntry(id)?.driver ?? null : null;
};
export const getDispatchTruck = (dispatch) => {
  const id = getDispatchSummary(dispatch).driverId;
  return id ? getRosterEntry(id)?.truck ?? null : null;
};

// ---- Stage, status and routes -------------------------------------------------------------

export const STAGES = { ANALYSIS: "ANALYSIS", BROKER: "BROKER_COMMUNICATION", ASSIGNMENT: "ASSIGNMENT", TRACKING: "TRACKING", COMPLETED: "COMPLETED" };

export function deriveStage(state, dispatch) {
  const proj = projectDispatchState(state, dispatch);
  const o = dispatch.ops;
  if (isDispatchCompleted(dispatch)) return { workflowStage: STAGES.COMPLETED, operationalStatus: "completed" };
  if (o.assignedDriverId) {
    const started = dispatch.missionRuns?.[TRACKING_MISSION]?.started && o.trackingLoadId === o.assignedLoadId;
    return { workflowStage: STAGES.TRACKING, operationalStatus: started ? o.currentShipmentStatus ?? "ready-for-pickup" : "ready-for-pickup" };
  }
  if (o.negotiatedLoadId) return { workflowStage: STAGES.ASSIGNMENT, operationalStatus: getAssignmentStatus(readDispatch(proj).d) };
  if (o.selectedBestLoadId && (o.commsLoadId || o.candidateDecision?.accepted)) return { workflowStage: STAGES.BROKER, operationalStatus: "negotiating" };
  return { workflowStage: STAGES.ANALYSIS, operationalStatus: "draft" };
}

export const STAGE_LABELS = { ANALYSIS: "Load Analysis", BROKER_COMMUNICATION: "Broker Communication", ASSIGNMENT: "Driver Assignment", TRACKING: "Tracking", COMPLETED: "Completed" };

export const ROUTES = {
  board: "/dispatcher/load-board",
  hub: "/dispatcher/dispatches",
  analysis: (slug) => `/dispatcher/load-analysis/${slug}`,
  brokers: (slug) => `/dispatcher/brokers/${slug}`,
  assignment: (slug) => `/dispatcher/dispatch/${slug}`,
  tracking: (slug) => `/dispatcher/tracking/${slug}`,
  detail: (slug) => `/dispatcher/dispatches/${slug}`,
};

// Where "Open" / "Resume" goes for a dispatch.
export function getDispatchResumeRoute(dispatch) {
  switch (dispatch.workflowStage) {
    case STAGES.BROKER:
      return ROUTES.brokers(dispatch.slug);
    case STAGES.ASSIGNMENT:
      return ROUTES.assignment(dispatch.slug);
    case STAGES.TRACKING:
      return ROUTES.tracking(dispatch.slug);
    case STAGES.COMPLETED:
      return ROUTES.detail(dispatch.slug);
    default:
      return ROUTES.analysis(dispatch.slug);
  }
}

// ---- Old (non-slug) routes ----------------------------------------------------------------

const LEGACY = {
  analysis: { stage: STAGES.ANALYSIS, route: ROUTES.analysis },
  brokers: { stage: STAGES.BROKER, route: ROUTES.brokers },
  assignment: { stage: STAGES.ASSIGNMENT, route: ROUTES.assignment },
  tracking: { stage: STAGES.TRACKING, route: ROUTES.tracking },
};

// Where an old URL (/dispatcher/brokers ...) should go: the one matching dispatch, the Dispatches
// hub when several match (or none match but others exist), or the Load Board when there are no
// dispatches at all.
export function resolveLegacyRoute(state, kind) {
  const { stage, route } = LEGACY[kind];
  const matches = getActiveDispatches(state).filter((d) => d.workflowStage === stage);
  if (matches.length === 1) return route(matches[0].slug);
  if (matches.length > 1) return ROUTES.hub;
  return getDispatches(state).length === 0 || kind === "analysis" ? ROUTES.board : ROUTES.hub;
}

// ---- Creating a dispatch ------------------------------------------------------------------

// Validates the shortlist, builds the record and returns the patch that adds it AND resets the Load
// Board builder in one step. Nothing is reset unless the record was built successfully.
export function createDispatchFromShortlist(state, shortlistIds, now = nowIso()) {
  const ids = [...new Set(shortlistIds ?? [])];
  const { min, max } = simulationConfig.shortlist;
  if (ids.length < min) return { ok: false, reason: "too-few", message: `Shortlist at least ${min} loads to continue.` };
  if (ids.length > max) return { ok: false, reason: "too-many", message: `You can compare a maximum of ${max} loads.` };
  if (ids.some((id) => !getLoad(id))) return { ok: false, reason: "unknown-load", message: "One of the shortlisted loads no longer exists." };

  const sequenceNumber = nextSequenceNumber(state);
  const ledger = state.trainingLedger?.missions ?? [];
  const runs = Object.fromEntries(DISPATCH_MISSIONS.map((id) => [id, { ...initialMissionProgress, missionId: id, started: ledger.includes(id) }]));
  const record = {
    id: newId(sequenceNumber),
    slug: createDispatchSlug(sequenceNumber),
    sequenceNumber,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    workflowStage: STAGES.ANALYSIS,
    operationalStatus: "draft",
    ops: { ...freshOps(), shortlistedLoadIds: ids },
    missionRuns: runs,
    completion: { isCompleted: false },
  };
  return {
    ok: true,
    slug: record.slug,
    record,
    patch: { dispatches: [...getDispatches(state), record], dispatchSeq: sequenceNumber, activeDispatchSlug: record.slug, ...clone(BUILDER_RESET) },
  };
}

// ---- Scoped updates -----------------------------------------------------------------------

const REWARD_KEYS = ["stars", "coins", "streak", "completedLevels", "currentLevel"];

// Applies an engine patch (computed against projectDispatchState) to ONE dispatch, by slug.
// Returns the patch for the global state, or null when nothing may change (unknown or completed).
// Task XP and mission rewards go through trainingLedger, so replaying a task or finishing a
// mission again in another dispatch never pays twice.
export function applyScopedPatch(state, slug, patch, now = nowIso()) {
  const dispatch = getDispatchBySlug(state, slug);
  if (!dispatch || isDispatchCompleted(dispatch)) return null;
  const before = projectDispatchState(state, dispatch);

  const opsPatch = {};
  const global = {};
  for (const [key, value] of Object.entries(patch ?? {})) {
    if (key === "missionRuns") continue;
    if (OPS_SET.has(key)) opsPatch[key] = value;
    else global[key] = value;
  }

  const ledger = { tasks: [...(state.trainingLedger?.tasks ?? [])], missions: [...(state.trainingLedger?.missions ?? [])] };
  const runs = {};
  let xpDelta = (global.xp ?? state.xp) - state.xp;
  let stripRewards = false;
  for (const [id, run] of Object.entries(patch?.missionRuns ?? {})) {
    const prev = before.missionRuns[id];
    if (run === prev) continue;
    if (!DISPATCH_MISSIONS.includes(id)) {
      global.missionRuns = { ...state.missionRuns, ...global.missionRuns, [id]: run };
      continue;
    }
    let next = run;
    let refund = 0;
    for (const task of run.completedTasks.filter((t) => !prev.completedTasks.includes(t))) {
      const key = `${id}:${task}`;
      if (ledger.tasks.includes(key)) refund += taskXp[task] ?? 0;
      else ledger.tasks.push(key);
    }
    if (refund) {
      xpDelta -= refund;
      next = { ...next, xpEarned: Math.max(0, next.xpEarned - refund) };
    }
    if (next.completed && !prev.completed) {
      if (ledger.missions.includes(id)) stripRewards = true;
      else ledger.missions.push(id);
    }
    runs[id] = next;
  }
  if (stripRewards) for (const key of REWARD_KEYS) delete global[key];
  if (xpDelta !== 0) global.xp = state.xp + xpDelta;
  else delete global.xp;

  let next = { ...dispatch, ops: { ...dispatch.ops, ...opsPatch }, missionRuns: { ...dispatch.missionRuns, ...runs }, updatedAt: now };
  const finished = next.missionRuns[TRACKING_MISSION]?.completed;
  if (finished) next = { ...next, completion: { isCompleted: true }, completedAt: dispatch.completedAt ?? now };
  next = { ...next, ...deriveStage({ ...state, ...global }, next) };

  return {
    ...global,
    dispatches: getDispatches(state).map((d) => (d.id === dispatch.id ? next : d)),
    trainingLedger: ledger,
    activeDispatchSlug: slug,
  };
}

export { allowResourceReuse, isDriverAvailableForDispatch, isTruckAvailableForDispatch } from "./dispatchAvailability";

// ---- Practiced loads (informational only; static loads are never "used up") ---------------

export const getPracticedLoadIds = (state) => [...new Set(getCompletedDispatches(state).map((d) => d.ops.negotiatedLoadId).filter(Boolean))];
