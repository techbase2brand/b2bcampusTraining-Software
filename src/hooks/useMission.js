"use client";

import { useState } from "react";
import { useGameProgress } from "./useGameProgress";
import { mission01 } from "@/data/missions";
import { taskXp, missionCoins, calcStars } from "@/data/rewards";
import { initialMissionProgress } from "@/data/users";
import { trucks } from "@/data/trucks";
import { drivers } from "@/data/drivers";
import { evaluate, getChoices, getMissionContext } from "@/lib/missionEngine";

const ctx = getMissionContext(trucks, drivers);

// Mission 01 task engine. Persisted state lives in missionProgress (via useGameProgress);
// feedback/hint text is transient UI state.
export function useMission() {
  const { state, update } = useGameProgress();
  const mp = state.missionProgress;
  const { tasks } = mission01;
  const task = mp.completed ? null : tasks[mp.currentTask];

  const [feedback, setFeedback] = useState(null); // { tone: "success" | "error", text }
  const [hint, setHint] = useState(null);
  const [instructionKey, setInstructionKey] = useState(0);

  function start() {
    update({ missionProgress: { ...initialMissionProgress, missionId: mission01.id, started: true } });
    setFeedback(null);
    setHint(null);
  }

  // Report a player action. Irrelevant actions return without penalty.
  function report(event) {
    if (!task) return;
    const result = evaluate(task.id, event, ctx);
    if (!result) return;

    const attempts = mp.attempts + 1;
    setHint(null);

    if (!result.correct) {
      update({ missionProgress: { ...mp, attempts } });
      setFeedback({ tone: "error", text: result.text });
      return;
    }

    const xp = taskXp[task.id];
    const currentTask = mp.currentTask + 1;
    const completed = currentTask >= tasks.length;
    const missionProgress = {
      ...mp,
      attempts,
      currentTask,
      completed,
      completedTasks: [...mp.completedTasks, task.id],
      xpEarned: mp.xpEarned + xp,
    };
    const patch = { xp: state.xp + xp, missionProgress };

    if (completed) {
      const accuracy = Math.round((tasks.length / attempts) * 100);
      const stars = calcStars({ accuracy, hintsUsed: mp.hintsUsed });
      missionProgress.starsEarned = stars;
      patch.stars = state.stars + stars;
      patch.coins = state.coins + missionCoins;
      patch.streak = Math.max(state.streak, 1);
      patch.completedLevels = [...new Set([...state.completedLevels, mission01.levelId])];
      patch.currentLevel = Math.max(state.currentLevel, mission01.levelId + 1);
    }

    update(patch);
    setFeedback({ tone: "success", text: result.text });
  }

  function requestHint() {
    if (!task) return;
    update({ missionProgress: { ...mp, hintsUsed: mp.hintsUsed + 1 } });
    setHint(task.hint);
  }

  function replayInstruction() {
    setFeedback(null);
    setHint(null);
    setInstructionKey((k) => k + 1);
  }

  const accuracy = mp.attempts ? Math.round((mp.completedTasks.length / mp.attempts) * 100) : 100;

  return {
    mission: mission01,
    progress: mp,
    task,
    choices: task?.question ? getChoices(task.id, ctx) : [],
    feedback,
    hint,
    instructionKey,
    accuracy,
    context: ctx,
    start,
    report,
    requestHint,
    replayInstruction,
  };
}
