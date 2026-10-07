// Mission completion rewards and level unlocks (used by Phase 3 and Phase 4).
// Mission 01 keeps its own completion logic in hooks/useMission.js.

import { calcStars, missionCoinRewards } from "@/data/rewards";

// Accuracy = tasks done / (tasks + incorrect attempts). Stars come from data/rewards.js.
export function calcAccuracy(tasksTotal, incorrectAttempts) {
  return Math.round((tasksTotal / (tasksTotal + incorrectAttempts)) * 100);
}

// Returns { accuracy, stars, patch } where patch is merged into the game state.
export function finishMission(state, { missionId, levelId, tasksTotal, attempts, hintsUsed }) {
  const accuracy = calcAccuracy(tasksTotal, attempts);
  const stars = calcStars({ accuracy, hintsUsed });
  return {
    accuracy,
    stars,
    patch: {
      stars: state.stars + stars,
      coins: state.coins + (missionCoinRewards[missionId] ?? 0),
      streak: Math.max(state.streak, 1),
      completedLevels: [...new Set([...state.completedLevels, levelId])],
      currentLevel: Math.max(state.currentLevel, levelId + 1),
    },
  };
}
