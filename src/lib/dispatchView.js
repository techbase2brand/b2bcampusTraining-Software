// Display-ready description of a dispatch record (labels, route text, status, where to resume).
// Used by the dispatch switcher, the Dispatches hub and the Dashboard so they always agree.

import { assignmentStatuses } from "@/data/dispatchComms";
import { trackingStatuses } from "@/data/phase7Missions";
import { statusCategories } from "@/data/dashboardStatus";
import { formatLocation } from "./loadSelectors";
import { getRosterEntry } from "./dispatchRoster";
import { getBroker } from "./loadSelectors";
import { getDispatchResumeRoute, getDispatchSummary, isDispatchCompleted, STAGE_LABELS } from "./dispatchRecords";

const STATUS_LABELS = { ...assignmentStatuses, ...trackingStatuses, draft: "DRAFT", negotiating: "NEGOTIATING", completed: "COMPLETED" };
export const getStatusLabel = (id) => STATUS_LABELS[id] ?? String(id).toUpperCase();

// "draft" | "pending" | "active" | "completed" for a canonical status id (null if unknown).
export function getStatusCategory(statusId) {
  return Object.keys(statusCategories).find((cat) => statusCategories[cat].includes(statusId)) ?? null;
}

export const dispatchNumber = (dispatch) => String(dispatch.sequenceNumber).padStart(3, "0");
const cityOf = (locationId) => formatLocation(locationId).split(",")[0];

export function describeDispatch(dispatch) {
  const s = getDispatchSummary(dispatch);
  const load = s.load;
  const entry = s.driverId ? getRosterEntry(s.driverId) : null;
  const completed = isDispatchCompleted(dispatch);
  // Arrival is shown as Active until the dispatch itself is completed (archived).
  let category = completed ? "completed" : getStatusCategory(dispatch.operationalStatus);
  if (!completed && category === "completed") category = "active";
  return {
    id: dispatch.id,
    slug: dispatch.slug,
    number: dispatchNumber(dispatch),
    label: `Dispatch #${dispatchNumber(dispatch)}`,
    stage: dispatch.workflowStage,
    stageLabel: STAGE_LABELS[dispatch.workflowStage],
    statusId: dispatch.operationalStatus,
    statusLabel: getStatusLabel(dispatch.operationalStatus),
    category,
    completed,
    loadId: load?.id ?? null,
    reference: load?.referenceNumber ?? null,
    shortlistCount: s.shortlistLoadIds.length,
    brokerName: load ? getBroker(load.brokerId)?.name ?? null : null,
    origin: load ? formatLocation(load.originLocationId) : null,
    destination: load ? formatLocation(load.destinationLocationId) : null,
    route: load ? `${cityOf(load.originLocationId)} → ${cityOf(load.destinationLocationId)}` : null,
    agreedRate: s.agreedRate,
    postedRate: load?.rate ?? null,
    driverId: entry?.driver.id ?? null,
    driverName: entry?.driver.name ?? null,
    truckId: entry?.truck.id ?? null,
    createdAt: dispatch.createdAt,
    updatedAt: dispatch.updatedAt,
    completedAt: dispatch.completedAt,
    resumeRoute: getDispatchResumeRoute(dispatch),
  };
}
