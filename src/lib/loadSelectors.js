// Resolve relationships by ID. Components and logic use these instead of copying objects around.

import { loads } from "@/data/loads";
import { brokers } from "@/data/brokers";
import { locations } from "@/data/locations";
import { trucks } from "@/data/trucks";
import { drivers } from "@/data/drivers";
import { simulationConfig } from "@/data/simulationConfig";

export const getLoad = (id) => loads.find((l) => l.id === id);
export const getBroker = (id) => brokers.find((b) => b.id === id);
export const getLocation = (id) => locations.find((l) => l.id === id);
export const getTruck = (id) => trucks.find((t) => t.id === id);
export const getDriver = (id) => drivers.find((d) => d.id === id);

export const getAssignedTruck = () => getTruck(simulationConfig.assignedTruckId);
export const getAssignedDriver = () => getDriver(getAssignedTruck().driverId);

export function formatLocation(locationId) {
  const loc = getLocation(locationId);
  return loc ? `${loc.city}, ${loc.state}` : "Unknown";
}
