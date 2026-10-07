"use client";

import { useEffect, useRef, useState } from "react";
import { useGameProgress } from "./useGameProgress";
import { mission05 } from "@/data/phase6Missions";
import { fillTemplate } from "@/lib/text";
import * as D from "@/lib/dispatchActions";
import { evaluateDriver } from "@/lib/driverRules";
import { initialCall, reduceCall, callIsLive } from "@/lib/callSim";

// Runs `callback` every `delay` ms using the latest closure (delay null = paused).
function useInterval(callback, delay) {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  });
  useEffect(() => {
    if (delay == null) return undefined;
    const id = setInterval(() => saved.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

// Mission 5 state for the UI. Transitions live in lib/dispatchActions.js and persist through the
// game store; the call itself (status, timer, mute) is transient UI state driven by lib/callSim.js.
export function useDispatchMission(previewLoadId = null) {
  const { state: stored, update } = useGameProgress();
  // Dev preview substitutes a demo negotiated load without touching Mission 4's saved output.
  const state = previewLoadId ? { ...stored, selectedBestLoadId: previewLoadId, negotiatedLoadId: previewLoadId } : stored;
  const { neg, d, run, entry, vars } = D.readDispatch(state);
  const task = run.completed ? null : mission05.tasks[run.currentTask] ?? null;

  const [feedback, setFeedback] = useState(null);
  const [hint, setHint] = useState(null);
  const [viewDriverId, setViewDriverId] = useState(null); // driver whose profile is open (may be unsuitable)
  const [call, setCall] = useState(initialCall);

  function dispatch(out) {
    update(out.patch ?? {});
    if (out.message !== undefined) setFeedback(out.message);
    if (out.hint !== undefined) setHint(out.hint);
    else if (out.message || out.completed?.length) setHint(null);
    return out;
  }

  // One tick per second while a call is live; connecting logs the driver's greeting once.
  useInterval(() => {
    const next = reduceCall(call, { type: "tick" });
    setCall(next);
    if (call.status === "dialing" && next.status === "connected") dispatch(D.connectCall(state));
  }, callIsLive(call) ? 1000 : null);

  const viewId = viewDriverId ?? d.selectedDriverId;
  const notes = neg ? D.buildDriverNotes(d, neg, entry) : [];

  return {
    mission: mission05,
    run,
    task,
    taskText: task && neg ? fillTemplate(task.instruction, { ref: neg.load.referenceNumber }) : null,
    neg, // { load, broker, agreedRate, postedRate } from the negotiated load
    d, // the persisted Phase 6 slice (selection, topics, messages, dispatch, response, assignment)
    entry, // the selected driver + truck
    vars,
    viewDriverId: viewId,
    feedback,
    hint,
    call,
    helper: D.getHelper(state),
    notes,
    statusLabel: D.getStatusLabel(d),
    workflow: D.getWorkflow(d, run),
    agentLine: D.getAgentLine(run),
    allTasksDone: run.completedTasks.length >= mission05.tasks.length,
    sheet: neg ? D.buildDispatchSheet(neg, entry) : [],
    hosReview: neg && entry ? D.getHosReview(neg, entry) : null,
    // Verdict for any driver (used only for numbers the student has uncovered or for the selected one).
    verdictFor: (driverEntry) => (neg && driverEntry ? evaluateDriver(neg.load, driverEntry) : null),
    summary: () => D.getSummary(state),

    start: () => dispatch(D.startMission(state)),
    reviewLoad: () => dispatch(D.reviewLoad(state)),
    viewDriver: (id) => {
      setViewDriverId(id);
      dispatch(D.viewDriver(state, id));
    },
    revealChecks: (id, codes) => dispatch(D.revealDriverChecks(state, id, codes)),
    selectDriver: (id) => dispatch(D.selectDriver(state, id)),
    send: (text, channel = "chat") => dispatch(D.sendMessage(state, text, channel)),
    startCall: () => setCall(reduceCall(call, { type: "start" })),
    endCall: () => {
      const wasLive = callIsLive(call);
      setCall(reduceCall(call, { type: "end" }));
      if (wasLive) dispatch(D.endCall(state));
    },
    toggleCall: (type) => setCall(reduceCall(call, { type })),
    saveNotes: () => dispatch(D.saveNotes(state)),
    reviewDispatch: () => dispatch(D.reviewDispatch(state)),
    sendDispatch: () => dispatch(D.sendDispatch(state)),
    confirmAssignment: () => dispatch(D.confirmAssignment(state)),
    requestHint: () => dispatch(D.takeHint(state)),
    complete: () => dispatch(D.completeMission(state)),
  };
}
