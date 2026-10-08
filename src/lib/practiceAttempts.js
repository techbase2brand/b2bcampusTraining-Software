// Practice-session helpers (pure functions over the saved game state; nothing here touches React or
// storage). The simulator is a sandbox until the student finalizes a load:
//
//   CURRENT ATTEMPT   the broker conversation for the current candidate load, held in the existing
//                     Mission 4 fields (commsLoadId, selectedBrokerId, coveredTopics, negotiation...)
//   ATTEMPT HISTORY   state.attemptHistory: IDs and results of attempts that were left behind
//   FINAL RESULT      negotiatedLoadId / agreedRate / loadFinalized, written only by finalizeLoad()
//
// Leaving an attempt archives it and resets ONLY the attempt-specific fields. Completed tasks, XP,
// hints and global progression are never touched.

import { mission04 } from "@/data/phase5Missions";
import { initialNegotiation } from "./brokerNegotiation";
import { getLoad } from "./loadSelectors";
import { analyzeLoad, calculateAllInRpm, calculateEstimatedProfit } from "./loadCalculations";
import { getTruckContext } from "./loadRules";

// The Mission 4 fields that belong to one attempt (everything the student did with one load).
export const FRESH_ATTEMPT = {
  commsLoadId: null,
  selectedBrokerId: null,
  detailsReviewed: false,
  coveredTopics: [],
  commsMessages: [],
  negotiation: initialNegotiation,
  callNotes: [],
  communicationMode: null,
  brokerConfirmed: false,
  commsStats: { sent: 0, professional: 0 },
};

// Final mission result: a finalized load (or a completed Mission 4, for older saves) is locked.
export const isFinalized = (state) => Boolean(state.loadFinalized) || Boolean(state.missionRuns?.[mission04.id]?.completed);

// Did the student actually do anything in the current attempt?
export const hasAttemptActivity = (state) => Boolean(state.commsLoadId) && (state.selectedBrokerId != null || (state.commsMessages?.length ?? 0) > 0);

export function attemptRecord(state) {
  const n = state.negotiation ?? initialNegotiation;
  const agreed = n.status === "agreed";
  return {
    id: `attempt-${(state.attemptHistory ?? []).length + 1}`,
    loadId: state.commsLoadId,
    brokerId: state.selectedBrokerId ?? null,
    topics: state.coveredTopics?.length ?? 0,
    negotiationAttempts: n.attempts ?? 0,
    offeredRate: n.counter ?? null,
    agreedRate: agreed ? n.agreedRate : null,
    result: state.brokerConfirmed ? "agreement" : agreed ? "agreed" : (n.attempts ?? 0) > 0 ? "negotiating" : "abandoned",
  };
}

// Patch that leaves the current attempt: archives it (if anything happened) and starts a clean one.
// The Mission 4 task pointer restarts for guidance; the ledger of completed tasks is untouched.
export function leaveAttemptPatch(state) {
  if (!state.commsLoadId) return {};
  const run = state.missionRuns?.[mission04.id];
  return {
    ...FRESH_ATTEMPT,
    attemptHistory: hasAttemptActivity(state) ? [...(state.attemptHistory ?? []), attemptRecord(state)] : state.attemptHistory ?? [],
    ...(run ? { missionRuns: { ...state.missionRuns, [mission04.id]: { ...run, currentTask: 0 } } } : {}),
  };
}

// Every attempt, oldest first: history plus the live one (when it has activity).
function allAttempts(state) {
  const live = hasAttemptActivity(state) ? [attemptRecord(state)] : [];
  return [...(state.attemptHistory ?? []), ...live];
}

// Compact counts for the "3 Loads Compared / 2 Broker Conversations / 2 Negotiated Deals" strip.
export function getPracticeSummary(state) {
  const attempts = allAttempts(state);
  return {
    loadsCompared: new Set(attempts.map((a) => a.loadId)).size,
    brokerConversations: attempts.filter((a) => a.brokerId).length,
    negotiatedDeals: attempts.filter((a) => a.agreedRate != null).length,
    attemptCount: attempts.length,
  };
}

// One row per load that reached an agreement (the latest agreement wins), with numbers from the
// existing calculators evaluated at the AGREED rate. Nothing here is invented.
export function getDeals(state, ctx = getTruckContext()) {
  const latest = new Map();
  for (const a of allAttempts(state)) if (a.agreedRate != null) latest.set(a.loadId, a);
  return [...latest.values()].map((a) => {
    const load = getLoad(a.loadId);
    const analysis = analyzeLoad(load, ctx);
    return {
      loadId: a.loadId,
      brokerId: a.brokerId,
      ref: load.referenceNumber,
      postedRate: load.rate,
      agreedRate: a.agreedRate,
      rpm: calculateAllInRpm(a.agreedRate, analysis.totalMiles),
      deadheadMiles: analysis.deadheadMiles,
      margin: calculateEstimatedProfit(a.agreedRate, analysis.totalMiles),
      finalized: Boolean(state.loadFinalized) && state.negotiatedLoadId === a.loadId,
    };
  });
}
