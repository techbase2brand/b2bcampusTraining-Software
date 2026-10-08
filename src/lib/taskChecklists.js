// Visible task checklists. Several tasks complete only when SEVERAL things are true (every topic
// asked, every check run...). These selectors turn the saved mission state into a list of those
// conditions so the student can see what is done and what is still missing.
//
// Nothing here is stored or hardcoded as done: every item is derived from the same state the
// mission engines use to decide that the task is complete. Simple one-click tasks have no checklist.

import { mission02 } from "@/data/phase3Missions";
import { mission03 } from "@/data/phase4Missions";
import { mission04 } from "@/data/phase5Missions";
import { mission05 } from "@/data/phase6Missions";
import { mission06 } from "@/data/phase7Missions";
import { commsTopics } from "@/data/brokerComms";
import { suitabilityChecks } from "@/data/dispatchComms";
import { simulationConfig } from "@/data/simulationConfig";
import { readBoard } from "./phase3Actions";
import { readAnalysis } from "./phase4Actions";
import { readComms } from "./commsActions";
import { readDispatch, topicLabels } from "./dispatchActions";
import { requiredTopicsFor } from "./driverChat";
import { readTracking } from "./trackingActions";
import { validateShortlist } from "./loadRules";
import { getLoad } from "./loadSelectors";

const item = (id, label, done, extra = {}) => ({ id, label, done: Boolean(done), ...extra });
const list = (taskId, title, items) => ({ taskId, title, items });
const run = (r) => (r && !r.completed ? r : null);

export const checklistProgress = (c) => ({ done: c.items.filter((i) => i.done).length, total: c.items.length });
export const missingItems = (c) => c.items.filter((i) => !i.done);
export const isChecklistComplete = (c) => missingItems(c).length === 0;
// "Still to do: Appointment, Special requirements." for the Training Agent line.
export const missingText = (c) => (missingItems(c).length ? `Still to do: ${missingItems(c).map((i) => i.label).join(", ")}.` : null);

// ---- Mission 2: Load Board ------------------------------------------------------------------

export function getBoardChecklist(state) {
  const { run: r, board } = readBoard(state);
  if (!run(r) || !r.started) return null;
  const task = mission02.tasks[r.currentTask];
  if (task?.id !== "shortlist-loads") return null;
  const ids = board.shortlistedLoadIds;
  const { min } = simulationConfig.shortlist;
  const v = validateShortlist(ids);
  return list(task.id, "Build your shortlist", [
    item("count", `At least ${min} loads shortlisted (${ids.length} / ${min})`, ids.length >= min),
    item("suitable", "Every shortlisted load can be moved by your truck", ids.length > 0 && v.reason !== "incompatible"),
  ]);
}

// ---- Mission 3: Load Analysis ---------------------------------------------------------------

export function getAnalysisChecklist(state, ctx) {
  const a = readAnalysis(state, ctx);
  if (!run(a.run) || !a.run.started) return null;
  const task = mission03.tasks[a.run.currentTask];
  if (task?.id === "review-shortlist") {
    return list(task.id, "Open every shortlisted load", a.analyses.map((x) => item(x.loadId, `${getLoad(x.loadId).referenceNumber} reviewed`, a.viewedIds.includes(x.loadId))));
  }
  if (task?.id === "select-best") {
    return list(task.id, "Choose and justify", [item("chosen", "Choose a load", Boolean(a.selectedBestLoadId)), item("reasons", "Give reasons the numbers support", Boolean(a.decision?.accepted))]);
  }
  return null;
}

// ---- Mission 4: Broker communication --------------------------------------------------------

export function getBrokerChecklist(state, ctx) {
  const { cc, comms, run: r } = readComms(state, ctx);
  if (!cc || !run(r) || !r.started) return null;
  const task = mission04.tasks[r.currentTask];
  if (!task) return null;
  const n = comms.negotiation;

  if (task.rule?.type === "topics" && task.rule.topics.length > 1) {
    const titles = { "verify-requirements": "Verify the load details", "ask-rate-terms": "Ask about rate and terms" };
    return list(
      task.id,
      titles[task.id] ?? task.title,
      task.rule.topics.map((t) => item(t, commsTopics.find((x) => x.id === t)?.label ?? t, comms.coveredTopics.includes(t), { topicId: t })),
    );
  }
  if (task.id === "negotiate-rate" || task.id === "confirm-agreement") {
    return list("negotiate-and-confirm", "Negotiate and confirm the rate", [
      item("asked", "Rate requested", n.attempts - n.extremeCount >= 1),
      item("offer", "Counteroffer received", n.counter != null),
      item("agreed", "Agreement reached", n.status === "agreed"),
      item("confirmed", "Agreement confirmed", comms.confirmed),
    ]);
  }
  return null;
}

// ---- Mission 5: Driver assignment -----------------------------------------------------------

export function getDispatchChecklist(state) {
  const { neg, d, run: r } = readDispatch(state);
  if (!neg || !run(r) || !r.started) return null;
  const task = mission05.tasks[r.currentTask];
  if (!task) return null;

  if (task.id === "verify-hos" || task.id === "pickup-feasibility") {
    const shown = d.selectedDriverId ? d.driverChecks[d.selectedDriverId] ?? [] : [];
    return list("verify-driver", "Verify the driver", suitabilityChecks.map((c) => item(c.code, c.label, shown.includes(c.code), { topicId: c.code })));
  }
  if (task.id === "communicate-details") {
    return list(task.id, "Communicate the load", requiredTopicsFor(neg.load).map((t) => item(t, topicLabels[t] ?? t, d.topics.includes(t), { topicId: t })));
  }
  if (task.id === "send-dispatch") {
    return list(task.id, "Send the dispatch", [item("reviewed", "Dispatch sheet reviewed", d.dispatchReviewed), item("sent", "Dispatch sent to the driver", d.dispatchSent)]);
  }
  return null;
}

// ---- Mission 6: Tracking --------------------------------------------------------------------

export function getTrackingChecklist(state) {
  const c = readTracking(state);
  if (!c.ok || !run(c.run) || !c.run.started) return null;
  const task = mission06.tasks[c.run.currentTask];
  const f = c.t.flags;
  if (task?.id === "pickup-complete") {
    return list(task.id, "Complete the pickup", [item("arrived", "Arrival at pickup confirmed", f.arrived), item("loading", "Loading confirmed", f.loading), item("pickedUp", "Pickup complete confirmed", f.pickedUp)]);
  }
  if (task?.id === "handle-delay") {
    return list(task.id, "Handle the delay", [item("ack", "Driver acknowledged", f.ack), item("eta", "New ETA chosen", f.etaSolved), item("appt", "Appointment impact judged", f.apptSolved), item("recorded", "Event recorded", f.recorded)]);
  }
  return null;
}
