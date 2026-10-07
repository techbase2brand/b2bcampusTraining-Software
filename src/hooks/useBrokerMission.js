"use client";

import { useEffect, useRef, useState } from "react";
import { useGameProgress } from "./useGameProgress";
import { mission04 } from "@/data/phase5Missions";
import { getTruckContext } from "@/lib/loadRules";
import { fillTemplate } from "@/lib/text";
import * as C from "@/lib/commsActions";
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

// Mission 4 state for the UI. Transitions live in lib/commsActions.js and persist through the game
// store. The call itself (status, timer, mute) is transient UI state driven by lib/callSim.js.
export function useBrokerMission(previewLoadId = null) {
  const { state: stored, update } = useGameProgress();
  // Dev preview substitutes a demo selected load without saving it.
  const state = previewLoadId ? { ...stored, selectedBestLoadId: previewLoadId } : stored;
  const ctx = getTruckContext();
  const { cc, comms, run, savedBrokerIds, recentBrokerIds } = C.readComms(state, ctx);
  const task = run.completed ? null : mission04.tasks[run.currentTask] ?? null;

  const [feedback, setFeedback] = useState(null); // mission-level feedback { tone, text }
  const [coach, setCoach] = useState(null); // wording tip for the last message
  const [hint, setHint] = useState(null);
  const [viewBrokerId, setViewBrokerId] = useState(null); // broker whose profile is open (may be the wrong one)
  const [call, setCall] = useState(initialCall);

  function dispatch(out) {
    update(out.patch ?? {});
    if (out.message !== undefined) setFeedback(out.message);
    if (out.coach !== undefined) setCoach(out.coach);
    if (out.hint !== undefined) setHint(out.hint);
    else if (out.message || out.completed?.length) setHint(null);
    return out;
  }

  // One tick per second while a call is live; connecting logs the broker's greeting once.
  useInterval(() => {
    const next = reduceCall(call, { type: "tick" });
    setCall(next);
    if (call.status === "dialing" && next.status === "connected") dispatch(C.connectCall(state, ctx));
  }, callIsLive(call) ? 1000 : null);

  const correctSelected = Boolean(cc) && comms.selectedBrokerId === cc.broker.id;
  const helper = C.getHelper(state, ctx);

  return {
    mission: mission04,
    run,
    task,
    taskText: task && cc ? fillTemplate(task.instruction, { ref: cc.load.referenceNumber }) : null,
    cc, // { load, broker, analysis, vars } resolved from selectedBestLoadId
    comms,
    savedBrokerIds,
    recentBrokerIds,
    viewBrokerId: viewBrokerId ?? comms.selectedBrokerId,
    correctSelected,
    feedback,
    coach,
    hint,
    call,
    helper,
    notes: cc ? C.buildNotes(comms, cc) : [],
    loadStatus: C.getLoadStatus(comms),
    workflow: C.getWorkflow(comms, run),
    agentLine: C.getAgentLine(run),
    allTasksDone: run.completedTasks.length >= mission04.tasks.length,
    summary: () => C.getSummary(state, ctx),

    start: () => dispatch(C.startMission(state, ctx)),
    selectBroker: (id) => {
      setViewBrokerId(id);
      dispatch(C.selectBroker(state, id, ctx));
    },
    viewBroker: setViewBrokerId,
    toggleSaved: (id) => dispatch(C.toggleSavedBroker(state, id)),
    reviewDetails: () => dispatch(C.reviewDetails(state, ctx)),
    send: (text, channel = "chat") => dispatch(C.sendMessage(state, text, channel, ctx)),
    startCall: () => setCall(reduceCall(call, { type: "start" })),
    endCall: () => {
      const wasLive = callIsLive(call);
      setCall(reduceCall(call, { type: "end" }));
      if (wasLive) dispatch(C.endCall(state, ctx));
    },
    toggleCall: (type) => setCall(reduceCall(call, { type })),
    saveNotes: () => dispatch(C.saveNotes(state, ctx)),
    confirmAgreement: () => dispatch(C.confirmAgreement(state, ctx)),
    aiSuggestion: () => C.aiSuggestion(state, ctx),
    requestHint: () => dispatch(C.takeHint(state, ctx)),
    complete: () => dispatch(C.completeMission(state, ctx)),
  };
}
