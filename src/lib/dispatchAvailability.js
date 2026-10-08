// Driver / truck availability across unfinished dispatches. Kept free of heavy imports so the
// assignment engine and the dispatch records can both use it. Whether one driver or truck may serve
// several unfinished dispatches at once is a configuration decision (simulationConfig.allowDriverReuse).

import { simulationConfig } from "@/data/simulationConfig";

export const allowResourceReuse = () => simulationConfig.allowDriverReuse !== false;

const unfinished = (state) => (state.dispatches ?? []).filter((d) => !d.completion?.isCompleted);

export function isDriverAvailableForDispatch(state, driverId, exceptDispatchId = null) {
  if (allowResourceReuse()) return true;
  return !unfinished(state).some((d) => d.id !== exceptDispatchId && d.ops?.assignedDriverId === driverId);
}

export function isTruckAvailableForDispatch(state, truckId, exceptDispatchId = null) {
  if (allowResourceReuse()) return true;
  return !unfinished(state).some((d) => d.id !== exceptDispatchId && d.ops?.assignedTruckId === truckId);
}

// The dispatch (if any) that currently holds a driver, for a friendly message.
export const dispatchHoldingDriver = (state, driverId, exceptDispatchId = null) => unfinished(state).find((d) => d.id !== exceptDispatchId && d.ops?.assignedDriverId === driverId) ?? null;
