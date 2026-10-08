import { calcAccuracy } from "./progression";

// The same four numbers on every mission completion screen, taken from the mission's saved run.
export function getCompletionStats(run, mission) {
  const total = mission.tasks.length;
  return [
    ["Tasks", `${Math.min(run.completedTasks.length, total)} / ${total}`],
    ["Accuracy", `${calcAccuracy(total, run.attempts)}%`],
    ["Hints Used", run.hintsUsed],
    ["XP", `+${run.xpEarned}`],
  ];
}
