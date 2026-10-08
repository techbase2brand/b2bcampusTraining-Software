// Practice-session tests: the simulator is a sandbox until a load is finalized.
// Run with `npm test`. Everything here is pure state-in / state-out (no React, no storage).

import test from "node:test";
import assert from "node:assert/strict";

import { initialGameState } from "@/data/users";
import { mission03 } from "@/data/phase4Missions";
import { mission04 } from "@/data/phase5Missions";
import { getLoad } from "@/lib/loadSelectors";
import * as P3 from "@/lib/phase3Actions";
import * as P4 from "@/lib/phase4Actions";
import * as C from "@/lib/commsActions";
import { getNegotiatedLoad } from "@/lib/driverChat";
import { getPracticeSummary, getDeals, isFinalized } from "@/lib/practiceAttempts";

const A = "load-001"; // LD-2101
const B = "load-002"; // LD-2102
const brokerOf = (id) => getLoad(id).brokerId;

// A session at the point of choosing a load: shortlist built, every earlier analysis task done,
// Mission 4 started. apply() merges an action's patch the way the game store does.
function session() {
  const select = mission03.tasks.findIndex((t) => t.id === "select-best");
  return {
    ...initialGameState,
    shortlistedLoadIds: [A, B, "load-003"],
    missionRuns: {
      ...initialGameState.missionRuns,
      "mission-03": { ...initialGameState.missionRuns["mission-03"], started: true, currentTask: select, completedTasks: mission03.tasks.slice(0, select).map((t) => t.id) },
      "mission-04": { ...initialGameState.missionRuns["mission-04"], started: true },
    },
  };
}
const apply = (s, out) => ({ ...s, ...out.patch });
const refresh = (s) => ({ ...initialGameState, ...JSON.parse(JSON.stringify(s)) }); // what the store does on reload

const QUESTIONS = [
  "Is the load still available?",
  "What is the commodity?",
  "What is the weight?",
  "Confirm the equipment type",
  "What is the pickup date and time?",
  "What is the delivery date and time?",
  "Is the posted rate firm?",
  "What is the appointment type?",
  "What are the detention terms?",
  "Any special requirements?",
];

// Walk the broker flow for the current candidate and reach a confirmed agreement.
function reachAgreement(s, loadId, extra = 100) {
  const load = getLoad(loadId);
  s = apply(s, C.selectBroker(s, load.brokerId));
  s = apply(s, C.reviewDetails(s));
  for (const q of QUESTIONS) s = apply(s, C.sendMessage(s, q));
  s = apply(s, C.sendMessage(s, `Can you do $${load.rate + extra}? I have deadhead to the pickup.`));
  if (C.readComms(s).comms.negotiation.status !== "agreed") s = apply(s, C.sendMessage(s, "That works for me, let's go with that."));
  assert.equal(C.readComms(s).comms.negotiation.status, "agreed");
  s = apply(s, C.confirmAgreement(s));
  assert.equal(C.readComms(s).comms.confirmed, true);
  return s;
}

test("1-3. a candidate can be compared, changed to another load and returned to", () => {
  let s = session();
  s = apply(s, P4.chooseBest(s, A));
  assert.equal(s.selectedBestLoadId, A);
  s = apply(s, P4.chooseBest(s, B));
  assert.equal(s.selectedBestLoadId, B);
  s = apply(s, P4.chooseBest(s, A));
  assert.equal(s.selectedBestLoadId, A);
  assert.equal(s.negotiatedLoadId, null, "choosing a candidate must not commit a final result");
});

test("4. the shortlist can be changed repeatedly (A,B,C -> remove C -> add D)", () => {
  let s = { ...initialGameState };
  for (const id of [A, B, "load-003"]) s = apply(s, P3.shortlistLoad(s, id));
  assert.deepEqual(s.shortlistedLoadIds, [A, B, "load-003"]);
  s = apply(s, P3.removeFromShortlist(s, "load-003"));
  s = apply(s, P3.shortlistLoad(s, "load-010"));
  assert.deepEqual(s.shortlistedLoadIds, [A, B, "load-010"]);
  s = apply(s, P3.clearShortlist(s));
  assert.deepEqual(s.shortlistedLoadIds, []);
  for (const id of [B, A]) s = apply(s, P3.shortlistLoad(s, id)); // previously shortlisted loads stay available
  assert.deepEqual(s.shortlistedLoadIds, [B, A]);
});

test("5-9. broker conversations for two loads keep separate results and IDs", () => {
  let s = session();
  s = apply(s, P4.chooseBest(s, A));
  s = reachAgreement(s, A, 50);
  const a = C.readComms(s).comms.negotiation.agreedRate;
  assert.equal(C.readComms(s).comms.selectedBrokerId, brokerOf(A));

  // leave A without finalizing: the candidate changes to B
  s = apply(s, P4.chooseBest(s, B));
  assert.equal(s.attemptHistory.length, 1);
  const h = s.attemptHistory[0];
  assert.deepEqual({ loadId: h.loadId, brokerId: h.brokerId, agreedRate: h.agreedRate, result: h.result }, { loadId: A, brokerId: brokerOf(A), agreedRate: a, result: "agreement" });
  const fresh = C.readComms(s).comms;
  assert.equal(fresh.selectedBrokerId, null, "B starts a clean conversation");
  assert.equal(fresh.negotiation.status, "none");
  assert.equal(fresh.messages.length, 0);

  s = reachAgreement(s, B, 30);
  const b = C.readComms(s).comms.negotiation.agreedRate;
  assert.notEqual(a, b);
  assert.equal(C.readComms(s).comms.selectedBrokerId, brokerOf(B));
  assert.equal(s.attemptHistory[0].agreedRate, a, "A's saved result is not overwritten");

  s = apply(s, C.tryAnotherLoad(s));
  assert.equal(s.selectedBestLoadId, null);
  assert.deepEqual(
    s.attemptHistory.map((x) => [x.loadId, x.brokerId, x.agreedRate]),
    [[A, brokerOf(A), a], [B, brokerOf(B), b]],
  );
  for (const x of s.attemptHistory) assert.equal(getLoad(x.loadId).brokerId, x.brokerId, "load and broker IDs are never mixed");
});

test("10-11. XP is awarded once and completed tasks survive retries", () => {
  let s = session();
  s = apply(s, P4.chooseBest(s, A));
  s = reachAgreement(s, A);
  const xp = s.xp;
  assert.equal(xp > session().xp, true, "the first pass does award XP");
  const ledger = [...s.missionRuns["mission-04"].completedTasks];
  const earned = s.missionRuns["mission-04"].xpEarned;
  assert.equal(ledger.length, mission04.tasks.length);

  for (const id of [B, A, B]) {
    s = apply(s, P4.chooseBest(s, id));
    s = reachAgreement(s, id, 40);
  }
  assert.equal(s.xp, xp, "no XP for replaying tasks");
  assert.equal(s.missionRuns["mission-04"].xpEarned, earned);
  assert.deepEqual(s.missionRuns["mission-04"].completedTasks, ledger);
  assert.equal(new Set(ledger).size, ledger.length, "no duplicate task entries");
});

test("12. a refresh preserves the current practice state", () => {
  let s = session();
  s = apply(s, P4.chooseBest(s, A));
  s = reachAgreement(s, A);
  s = apply(s, P4.chooseBest(s, B));
  s = apply(s, C.selectBroker(s, brokerOf(B)));
  const back = refresh(s);
  assert.equal(back.selectedBestLoadId, B);
  assert.equal(C.readComms(back).comms.selectedBrokerId, brokerOf(B));
  assert.deepEqual(back.attemptHistory, s.attemptHistory);
  assert.deepEqual(back.missionRuns["mission-04"].completedTasks, s.missionRuns["mission-04"].completedTasks);
});

test("13-15. only FINALIZE commits the result, and Dispatch receives only that load", () => {
  let s = session();
  s = apply(s, P4.chooseBest(s, A));
  s = reachAgreement(s, A, 50);
  assert.equal(getNegotiatedLoad(s), null, "an unfinalized deal never reaches dispatch");
  assert.equal(s.negotiatedLoadId, null);
  assert.equal(C.completeMission(s).completed, false, "the mission cannot complete before finalizing");

  s = apply(s, P4.chooseBest(s, B));
  s = reachAgreement(s, B, 30);
  const b = C.readComms(s).comms.negotiation.agreedRate;
  const a = s.attemptHistory.find((x) => x.loadId === A).agreedRate;
  s = apply(s, C.finalizeLoad(s));
  assert.equal(s.negotiatedLoadId, B);
  assert.equal(s.agreedRate, b);
  assert.equal(s.loadFinalized, true);
  assert.equal(s.finalizedBrokerId, brokerOf(B));
  const neg = getNegotiatedLoad(s);
  assert.equal(neg.load.id, B);
  assert.equal(neg.agreedRate, b);
  assert.notEqual(a, b);
  assert.equal(s.attemptHistory.find((x) => x.loadId === A).agreedRate, a, "the earlier attempt keeps its own result");

  // locked after finalizing
  assert.equal(isFinalized(s), true);
  assert.deepEqual(P4.chooseBest(s, A).patch, {});
  assert.deepEqual(C.tryAnotherLoad(s).patch, {});
  assert.deepEqual(C.sendMessage(s, "hello").patch, {});
  s = apply(s, C.completeMission(s));
  assert.equal(s.missionRuns["mission-04"].completed, true);
  assert.equal(s.negotiatedLoadId, B);
});

test("finalize needs a confirmed agreement", () => {
  let s = session();
  s = apply(s, P4.chooseBest(s, A));
  s = apply(s, C.selectBroker(s, brokerOf(A)));
  assert.deepEqual(C.finalizeLoad(s).patch, {});
});

test("16. old saved states without the practice fields still load", () => {
  const old = JSON.parse(JSON.stringify(session()));
  for (const key of ["attemptHistory", "candidateDecision", "loadFinalized", "finalizedBrokerId", "finalDecisionReasonIds"]) delete old[key];
  old.selectedBestLoadId = A;
  old.commsLoadId = B; // a stale conversation belonging to a different load
  old.selectedBrokerId = brokerOf(B);
  const s = { ...initialGameState, ...old };
  assert.doesNotThrow(() => {
    P4.readAnalysis(s);
    getPracticeSummary(s);
    getDeals(s);
  });
  const { comms, run } = C.readComms(s);
  assert.equal(comms.selectedBrokerId, null);
  assert.equal(run.currentTask, 0);

  // an old completed mission counts as finalized, with its result intact
  const done = { ...s, negotiatedLoadId: A, agreedRate: 2650, missionRuns: { ...s.missionRuns, "mission-04": { ...s.missionRuns["mission-04"], completed: true } } };
  assert.equal(isFinalized(done), true);
  assert.equal(getNegotiatedLoad(done).agreedRate, 2650);
});

test("17. there is no limit on practice attempts", () => {
  let s = session();
  const xpBefore = s.xp;
  for (let i = 0; i < 12; i++) {
    const id = i % 2 ? B : A;
    s = apply(s, P4.chooseBest(s, id));
    s = apply(s, C.selectBroker(s, brokerOf(id)));
    s = apply(s, C.tryAnotherLoad(s));
  }
  assert.equal(s.attemptHistory.length, 12);
  assert.equal(isFinalized(s), false);
  assert.equal(s.xp >= xpBefore, true);
  s = apply(s, P4.chooseBest(s, A));
  assert.equal(s.selectedBestLoadId, A);
});

test("compare deals uses the existing calculators at the agreed rate", () => {
  let s = session();
  s = apply(s, P4.chooseBest(s, A));
  s = reachAgreement(s, A, 50);
  s = apply(s, P4.chooseBest(s, B));
  s = reachAgreement(s, B, 30);
  const sum = getPracticeSummary(s);
  assert.deepEqual([sum.loadsCompared, sum.brokerConversations, sum.negotiatedDeals], [2, 2, 2]);
  const deals = getDeals(s);
  assert.equal(deals.length, 2);
  for (const d of deals) {
    assert.equal(typeof d.rpm, "number");
    assert.equal(typeof d.margin, "number");
    assert.equal(d.agreedRate >= d.postedRate, true);
  }
});

test("a decision is feedback only: a choice can be dropped and another picked", () => {
  let s = session();
  s = apply(s, P4.chooseBest(s, A));
  s = apply(s, P4.submitDecision(s, ["strong-rpm"]));
  s = apply(s, P4.compareAgain(s));
  assert.equal(s.selectedBestLoadId, null);
  assert.equal(s.candidateDecision, null);
  s = apply(s, P4.chooseBest(s, B));
  assert.equal(s.selectedBestLoadId, B);
});
