"use client";

import { useState } from "react";
import { useGameProgress } from "./useGameProgress";
import { mission02 } from "@/data/phase3Missions";
import { getTruckContext } from "@/lib/loadRules";
import { getTaskVars, getAgentLine } from "@/lib/phase3Engine";
import * as actions from "@/lib/phase3Actions";
import { getBoardChecklist } from "@/lib/taskChecklists";
import { getLoad } from "@/lib/loadSelectors";
import { fillTemplate } from "@/lib/text";

// Phase 3 board + mission state for the UI. All transitions live in lib/phase3Actions.js and are
// persisted through the central game store (IDs and codes only).
export function usePhase3Mission() {
  const { state, update } = useGameProgress();
  const ctx = getTruckContext();
  const { run, filters, board, reviewedIds } = actions.readBoard(state);
  const task = run.completed ? null : mission02.tasks[run.currentTask] ?? null;
  const selectedLoad = state.selectedLoadId ? getLoad(state.selectedLoadId) ?? null : null;

  const [feedback, setFeedback] = useState(null); // mission / filter feedback { tone, text }
  const [actionFeedback, setActionFeedback] = useState(null); // shortlist feedback, shown by the details panel
  const [hint, setHint] = useState(null);

  // Apply a transition result: persist the patch and update transient feedback.
  function dispatch(out) {
    update(out.patch);
    if (out.setFeedback) setFeedback(out.message ?? null);
    if (out.actionFeedback !== undefined) setActionFeedback(out.actionFeedback);
    if (out.hint !== undefined) setHint(out.hint);
    else if (out.completed?.length || out.message) setHint(null);
  }

  return {
    mission: mission02,
    checklist: getBoardChecklist(state),
    run,
    task,
    taskText: task ? fillTemplate(task.instruction, getTaskVars(ctx)) : null,
    filters,
    feedback,
    actionFeedback,
    hint,
    selectedLoad,
    checks: board.checks,
    shortlistedIds: board.shortlistedLoadIds,
    reviewedIds,
    agentLine: getAgentLine({ load: selectedLoad, checks: board.checks, shortlistCount: board.shortlistedLoadIds.length }, ctx),
    start: () => dispatch(actions.startMission(state, ctx)),
    applyFilters: (next) => dispatch(actions.applyFilters(state, next, ctx)),
    reset: () => dispatch(actions.resetBoardFilters(state, ctx)),
    selectLoad: (id) => dispatch(actions.selectLoad(state, id)),
    revealChecks: (loadId, codes) => dispatch(actions.revealChecks(state, loadId, codes, ctx)),
    shortlistLoad: (id) => dispatch(actions.shortlistLoad(state, id, ctx)),
    removeFromShortlist: (id) => dispatch(actions.removeFromShortlist(state, id, ctx)),
    clearShortlist: () => dispatch(actions.clearShortlist(state, ctx)),
    requestHint: () => dispatch(actions.takeHint(state)),
    complete: () => dispatch(actions.completePhase3(state)),
    summary: () => actions.getPhase3Summary(state, ctx),
    allTasksDone: run.completedTasks.length >= mission02.tasks.length,
  };
}
