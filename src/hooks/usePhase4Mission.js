"use client";

import { useState } from "react";
import { useDispatchScope } from "./useDispatchScope";
import { mission03 } from "@/data/phase4Missions";
import { getTruckContext } from "@/lib/loadRules";
import { getLoad } from "@/lib/loadSelectors";
import { scoreLoads } from "@/lib/loadMatching";
import * as actions from "@/lib/phase4Actions";
import { getAnalysisChecklist } from "@/lib/taskChecklists";
import { fillTemplate } from "@/lib/text";

// Phase 4 state for the UI. Transitions live in lib/phase4Actions.js and persist through the game
// store, scoped to one dispatch (its own shortlist, candidate and decision).
export function usePhase4Mission(slug) {
  const { state, update, readOnly } = useDispatchScope(slug);
  const ctx = getTruckContext();
  const effective = state;
  const { run, analyses, shortlistedIds, viewedIds, selectedBestLoadId, reasonIds, decision, finalized } = actions.readAnalysis(effective, ctx);
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

  const accepted = Boolean(decision?.accepted); // decision on the current candidate (not the mission ledger)
  const practiceReady = run.started && !finalized && (!task || task.rule?.type === "select-best"); // candidates can be (re)chosen
  const ranked = accepted ? scoreLoads(analyses) : null; // the score stays hidden until the decision is accepted
  const stepIndex = run.completed ? 3 : !task ? 2 : task.rule?.type === "view-all-shortlisted" ? 0 : task.rule?.type === "select-best" ? 2 : 1;
  const targetRef = analyses[0] ? getLoad(analyses[0].loadId).referenceNumber : "";
  const detailLoadId = detailId && analyses.some((a) => a.loadId === detailId) ? detailId : analyses[0]?.loadId ?? null;

  return {
    mission: mission03,
    readOnly,
    checklist: getAnalysisChecklist(effective, ctx),
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
    practiceReady,
    hasBrokerAttempt: Boolean(selectedBestLoadId) && state.commsLoadId === selectedBestLoadId, // a conversation for this candidate exists
    finalized,
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
