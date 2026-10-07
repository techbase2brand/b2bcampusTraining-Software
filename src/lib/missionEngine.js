// Pure mission logic: no React, no storage. Swap data sources freely.

import { TARGET_EQUIPMENT } from "@/data/missions";
import { formatHos } from "./format";

export function getMissionContext(trucks, drivers) {
  const truck = trucks.find((t) => t.equipment === TARGET_EQUIPMENT);
  const driver = drivers.find((d) => d.id === truck?.driverId);
  return { truck, driver, trucks, drivers };
}

// Multiple-choice options for question tasks. Sorted so order is stable (no randomness).
export function getChoices(taskId, ctx) {
  const { drivers } = ctx;
  if (taskId === "check-hos") {
    return drivers
      .map((d) => ({ value: String(d.hosMinutes), label: formatHos(d.hosMinutes) }))
      .sort((a, b) => Number(a.value) - Number(b.value))
      .slice(0, 4);
  }
  if (taskId === "confirm-location") {
    return [...new Set(drivers.map((d) => d.location))].sort().map((l) => ({ value: l, label: l }));
  }
  return [];
}

// Returns null when the event is irrelevant to the task (free exploration, no penalty),
// otherwise { correct, text }.
export function evaluate(taskId, event, ctx) {
  const { truck, driver, trucks } = ctx;

  switch (taskId) {
    case "open-trucks":
      if (event.type === "navigate" && event.section === "trucks") {
        return { correct: true, text: "Correct. The Trucks section lists every unit in your fleet." };
      }
      return null;

    case "find-dry-van": {
      if (event.type !== "confirm-equipment") return null;
      const picked = trucks.find((t) => t.id === event.truckId);
      if (picked?.equipment === TARGET_EQUIPMENT) {
        return { correct: true, text: "Correct. This truck uses Dry Van equipment." };
      }
      return {
        correct: false,
        text: `This truck uses ${picked?.equipment} equipment. Check the equipment type and try again.`,
      };
    }

    case "open-driver": {
      if (event.type !== "open-driver") return null;
      if (event.driverId === driver.id) {
        return { correct: true, text: `Correct. ${driver.name} is assigned to ${truck.id}, the Dry Van truck.` };
      }
      const other = ctx.drivers.find((d) => d.id === event.driverId);
      return {
        correct: false,
        text: `${other?.name} is assigned to ${other?.truckId}, not the Dry Van truck. Open the driver assigned to ${truck.id}.`,
      };
    }

    case "check-hos": {
      if (event.type !== "answer") return null;
      if (event.value === String(driver.hosMinutes)) {
        return {
          correct: true,
          text: `Correct. ${driver.name} has ${formatHos(driver.hosMinutes)} of drive time remaining.`,
        };
      }
      return {
        correct: false,
        text: `That is not ${driver.name}'s remaining HOS. Read the Remaining HOS value in the Driver Status section and try again.`,
      };
    }

    case "confirm-location": {
      if (event.type !== "answer") return null;
      if (event.value === driver.location) {
        return { correct: true, text: `Correct. ${driver.name} is currently in ${driver.location}.` };
      }
      return {
        correct: false,
        text: `${event.value} is not where ${driver.name} is. Check the Current Location in the Driver Status section and try again.`,
      };
    }

    default:
      return null;
  }
}
