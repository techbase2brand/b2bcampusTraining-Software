"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatchScope } from "./useDispatchScope";
import { mission06, trackingStatuses } from "@/data/phase7Missions";
import { fillTemplate, formatDuration } from "@/lib/text";
import * as T from "@/lib/trackingActions";
import { getTrackingChecklist } from "@/lib/taskChecklists";
import { fmtDateTime } from "@/lib/trackingComms";
import { initialCall, reduceCall, callIsLive } from "@/lib/callSim";
import { simulationConfig } from "@/data/simulationConfig";
import { features } from "@/data/features";

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

// Runs `callback` when the tab becomes visible again (a sleeping tab does not tick).
function useVisible(callback) {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  });
  useEffect(() => {
    const onVisible = () => document.visibilityState === "visible" && saved.current();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);
}

// Mission 6 state for the UI. Transitions live in lib/trackingActions.js (and the scripted trip in
// lib/trackingEngine.js); they persist through the game store. The call itself (status, timer,
// mute) is transient UI state driven by lib/callSim.js.
export function useTrackingMission(slug) {
  const { state, update, readOnly } = useDispatchScope(slug);
  const c = T.readTracking(state);
  const task = c.run.completed ? null : mission06.tasks[c.run.currentTask] ?? null;

  const [feedback, setFeedback] = useState(null);
  const [hint, setHint] = useState(null);
  const [call, setCall] = useState(initialCall);
  const [, setTick] = useState(0); // re-render on a timer so the live position refreshes

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

  // Movement is automatic: the saved segment start time is the source of truth, so this only commits
  // what the clock has already done (finished steps, driver updates) and refreshes the screen. It runs
  // on mount, every tick and when the tab wakes up; calling it again never repeats anything.
  const settleNow = () => {
    const out = T.settle(state);
    if (out.patch && Object.keys(out.patch).length) dispatch(out);
  };
  const sync = () => {
    setTick((n) => n + 1);
    settleNow();
  };
  const running = c.ok && c.run.started && !readOnly && !c.run.completed;
  useInterval(sync, running ? simulationConfig.trackingTimeScale.tickMs : null);
  useVisible(() => running && sync());
  useEffect(() => {
    if (!running) return undefined;
    const id = setTimeout(settleNow, 0); // catch up straight away (e.g. after a refresh)
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const { snap, t, tl } = c;
  return {
    mission: mission06,
    readOnly,
    checklist: getTrackingChecklist(state),
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
    clock: T.getTrainingClock(c), // { moving, progress, nextEventMs, toStopMs, stopLabel } in TRAINING time
    updates: c.t.updates, // automatic driver updates, oldest first
    latestUpdate: c.t.updates.at(-1) ?? null,
    devControls: features.devTrackingControls, // "Skip to next event": development builds only
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
