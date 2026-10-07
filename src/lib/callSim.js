// Simulated call state machine (no telephony). The UI drives it with a one-second tick; the logic
// is pure so it can later be fed by real microphone / speech-to-text / AI voice events.
// States: idle -> dialing -> connected -> ended.

import { callScript } from "@/data/brokerComms";

export const initialCall = { status: "idle", seconds: 0, dialed: 0, muted: false, speaker: false, keypad: false };

export function reduceCall(call, event) {
  switch (event.type) {
    case "start":
      return call.status === "idle" || call.status === "ended" ? { ...initialCall, status: "dialing" } : call;
    case "tick":
      if (call.status === "dialing") {
        const dialed = call.dialed + 1;
        return dialed >= callScript.dialTicks ? { ...call, status: "connected", dialed, seconds: 0 } : { ...call, dialed };
      }
      return call.status === "connected" ? { ...call, seconds: call.seconds + 1 } : call;
    case "end":
      return call.status === "dialing" || call.status === "connected" ? { ...call, status: "ended" } : call;
    case "mute":
      return call.status === "connected" ? { ...call, muted: !call.muted } : call;
    case "speaker":
      return call.status === "connected" ? { ...call, speaker: !call.speaker } : call;
    case "keypad":
      return call.status === "connected" ? { ...call, keypad: !call.keypad } : call;
    default:
      return call;
  }
}

export function formatTimer(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const callIsLive = (call) => call.status === "dialing" || call.status === "connected";
