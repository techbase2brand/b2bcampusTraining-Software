"use client";

import { useEffect, useRef, useState } from "react";
import { useGameProgress } from "./useGameProgress";
import { mission06, trackingStatuses } from "@/data/phase7Missions";
import { fillTemplate, formatDuration } from "@/lib/text";
import * as T from "@/lib/trackingActions";
import { fmtDateTime } from "@/lib/trackingComms";
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

// Mission 6 state for the UI. Transitions live in lib/trackingActions.js (and the scripted trip in
// lib/trackingEngine.js); they persist through the game store. The call itself (status, timer,
// mute) is transient UI state driven by lib/callSim.js.
export function useTrackingMission(preview = false) {
  const { state: stored, update } = useGameProgress();
  // Dev preview substitutes a demo assignment without touching the saved Phase 6 output.
  const state = preview && !stored.assignedLoadId ? { ...stored, ...T.previewAssignment() } : stored;
  const c = T.readTracking(state);
  const task = c.run.completed ? null : mission06.tasks[c.run.currentTask] ?? null;

  const [feedback, setFeedback] = useState(null);
  const [hint, setHint] = useState(null);
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
    if (call.status === "dialing" && next.status === "connected") dispatch(T.connectCall(state));
  }, callIsLive(call) ? 1000 : null);

  const { snap, t, tl } = c;
  return {
    mission: mission06,
    ctx: c,
    run: c.run,
    task,
    taskText: task && c.ok ? fillTemplate(task.instruction, { ref: c.load.referenceNumber }) : null,
    load: c.load,
    entry: c.entry,
    broker: c.broker,
    agreedRate: c.agreedRate,
    snap,
    t,
    tl,
    vars: c.vars,
    exception: c.exc ?? null,
    open: Boolean(c.open),
    highlight: T.getHighlight(c),
    shipments: T.getActiveShipments(state),
    alerts: T.getTimelineAlerts(c),
    notes: T.buildNotes(c),
    suggestions: T.getSuggestions(state),
    etaOptions: T.getEtaOptions(state),
    brokerDraft: T.getBrokerDraft(state),
    agentLine: T.getAgentLine(c.run),
    allTasksDone: c.run.completedTasks.length >= mission06.tasks.length,
    feedback,
    hint,
    call,
    statusLabel: c.ok ? snap.status : trackingStatuses["ready-for-pickup"],
    fmt: fmtDateTime,
    hos: c.ok ? formatDuration(snap.hosRemaining) : "-",
    summary: () => T.getSummary(state),

    start: () => dispatch(T.startMission(state)),
    startTrip: () => dispatch(T.startTrip(state)),
    advance: () => dispatch(T.advance(state)),
    confirm: (flag) => dispatch(T.confirmStatus(state, flag)),
    reviewEta: () => dispatch(T.reviewEta(state)),
    send: (text, channel = "chat") => dispatch(T.sendMessage(state, text, channel)),
    startCall: () => setCall(reduceCall(call, { type: "start" })),
    endCall: () => {
      const wasLive = callIsLive(call);
      setCall(reduceCall(call, { type: "end" }));
      if (wasLive) dispatch(T.endCall(state));
    },
    toggleCall: (type) => setCall(reduceCall(call, { type })),
    saveNotes: () => dispatch(T.saveNotes(state)),
    chooseEta: (id) => dispatch(T.chooseEta(state, id)),
    chooseAppointment: (id) => dispatch(T.chooseAppointment(state, id)),
    recordException: () => dispatch(T.recordException(state)),
    sendBrokerUpdate: (text) => dispatch(T.sendBrokerUpdate(state, text)),
    confirmArrival: () => dispatch(T.confirmArrival(state)),
    requestHint: () => dispatch(T.takeHint(state)),
    complete: () => dispatch(T.completeMission(state)),
  };
}
