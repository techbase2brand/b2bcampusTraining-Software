"use client";

import { useState } from "react";
import { useGameProgress } from "./useGameProgress";
import { mission03 } from "@/data/phase4Missions";
import { getTruckContext } from "@/lib/loadRules";
import { getLoad } from "@/lib/loadSelectors";
import { scoreLoads } from "@/lib/loadMatching";
import * as actions from "@/lib/phase4Actions";
import { fillTemplate } from "@/lib/text";

// Phase 4 state for the UI. Transitions live in lib/phase4Actions.js and persist through the game
// store. `previewIds` (dev preview) substitutes a demo shortlist without writing it to storage.
export function usePhase4Mission(previewIds = null) {
  const { state, update } = useGameProgress();
  const ctx = getTruckContext();
  const effective = previewIds ? { ...state, shortlistedLoadIds: previewIds } : state;
  const { run, analyses, shortlistedIds, viewedIds, selectedBestLoadId, reasonIds } = actions.readAnalysis(effective, ctx);
  const task = run.completed ? null : mission03.tasks[run.currentTask] ?? null;

  const [feedback, setFeedback] = useState(null); // { tone, title?, text }
  const [hint, setHint] = useState(null);
  const [detailId, setDetailId] = useState(null);

  function dispatch(out) {
    update(out.patch ?? {});
    if (out.message !== undefined) setFeedback(out.message);
    if (out.hint !== undefined) setHint(out.hint);
    else if (out.message || out.completed?.length) setHint(null);
    return out;
  }

  const accepted = Boolean(run.decision?.accepted);
  const ranked = accepted ? scoreLoads(analyses) : null; // the score stays hidden until the decision is accepted
  const stepIndex = run.completed ? 3 : !task ? 2 : task.rule?.type === "view-all-shortlisted" ? 0 : task.rule?.type === "select-best" ? 2 : 1;
  const targetRef = analyses[0] ? getLoad(analyses[0].loadId).referenceNumber : "";
  const detailLoadId = detailId && analyses.some((a) => a.loadId === detailId) ? detailId : analyses[0]?.loadId ?? null;

  return {
    mission: mission03,
    run,
    task,
    taskText: task ? fillTemplate(task.instruction, { targetLoad: targetRef }) : null,
    analyses,
    shortlistedIds,
    viewedIds,
    choices: actions.getQuestionChoices(task, analyses),
    selectedBestLoadId,
    reasonIds,
    accepted,
    ranked,
    stepIndex,
    feedback,
    hint,
    detailLoadId,
    allTasksDone: run.completedTasks.length >= mission03.tasks.length,
    summary: () => actions.getPhase4Summary(effective, ctx),
    start: () => dispatch(actions.startAnalysis(effective, ctx)),
    viewLoad: (id) => {
      setDetailId(id);
      dispatch(actions.viewLoad(effective, id, ctx));
    },
    showDetail: setDetailId,
    answer: (value) => dispatch(actions.answerQuestion(effective, value, ctx)),
    choose: (id) => {
      setFeedback(null);
      dispatch(actions.chooseBest(effective, id, ctx));
    },
    compareAgain: () => {
      setFeedback(null);
      dispatch(actions.compareAgain(effective));
    },
    submit: (ids) => dispatch(actions.submitDecision(effective, ids, ctx)),
    requestHint: () => dispatch(actions.takeHint(effective, ctx)),
    complete: () => dispatch(actions.completePhase4(effective)),
  };
}
