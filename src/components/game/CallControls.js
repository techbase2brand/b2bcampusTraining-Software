"use client";

import { PhoneOff, Mic, MicOff, Grid3x3, Volume2 } from "lucide-react";
import { features } from "@/data/features";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

// In-call controls shared by every call screen. The simulation only needs End Call. Mute, keypad and
// speaker change nothing in the simulation, so they stay hidden unless features.callExtras is on.
export default function CallControls({ call, connected, onToggle, onEnd }) {
  const end = (
    <button type="button" onClick={onEnd} className="flex items-center justify-center gap-2 rounded-lg border border-danger/50 bg-danger/20 px-3 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/30">
      <PhoneOff className="size-4" aria-hidden="true" /> End Call
    </button>
  );
  if (!features.callExtras) return end;

  return (
    <>
      <div className="grid grid-cols-4 gap-1.5">
        {[
          ["mute", call.muted ? MicOff : Mic, "Mute", call.muted],
          ["keypad", Grid3x3, "Keypad", call.keypad],
          ["speaker", Volume2, "Speaker", call.speaker],
        ].map(([type, Icon, label, on]) => (
          <button key={type} type="button" onClick={() => onToggle(type)} disabled={!connected} aria-pressed={on} className={`flex flex-col items-center gap-0.5 rounded-lg border py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${on ? "border-cyan bg-cyan/15 text-cyan-bright" : "border-line bg-surface-2 text-ink"}`}>
            <Icon className="size-4" aria-hidden="true" /> {label}
          </button>
        ))}
        {end}
      </div>
      {call.keypad && (
        <div className="grid grid-cols-3 gap-1" aria-label="Keypad">
          {KEYS.map((k) => (
            <span key={k} className="rounded-md bg-surface-2 py-1 text-center text-xs font-semibold text-ink">
              {k}
            </span>
          ))}
        </div>
      )}
    </>
  );
}
