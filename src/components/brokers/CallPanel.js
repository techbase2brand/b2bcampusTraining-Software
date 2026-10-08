"use client";

import { useState } from "react";
import { Phone, NotebookPen, Lock } from "lucide-react";
import { callScript } from "@/data/brokerComms";
import { formatTimer } from "@/lib/callSim";
import GameButton from "@/components/game/GameButton";
import CallControls from "@/components/game/CallControls";
import { features } from "@/data/features";
import GameDrawer from "@/components/game/GameDrawer";
import BrokerAvatar from "./BrokerAvatar";

const BARS = 14;

// Simulated call (no telephony). Three clear states: Ready, Connected (live controls), Call Ended.
// Transcript and notes stay available afterwards. State/transcript are separate from the UI so a
// microphone, speech-to-text or AI voice can be plugged in later.
export default function CallPanel({ m, embedded = false }) {
  const [say, setSay] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const { call, cc, correctSelected } = m;
  const dialing = call.status === "dialing";
  const connected = call.status === "connected";
  const live = dialing || connected;
  const ended = call.status === "ended";
  const transcript = m.comms.messages.filter((x) => x.channel === "call");
  const notesSaved = m.comms.callNotes.length > 0 && JSON.stringify(m.comms.callNotes) === JSON.stringify(m.notes);
  const manual = callScript.modes.find((x) => x.id === "manual");
  const ai = callScript.modes.find((x) => x.id === "ai");

  function speak(e) {
    e.preventDefault();
    if (!say.trim() || !connected) return;
    m.send(say, "call");
    setSay("");
  }

  if (!cc || !correctSelected) {
    return (
      <section aria-label="Call panel" className="panel grid min-h-56 place-items-center p-4 text-center">
        <div>
          <Phone className="mx-auto size-8 text-ink-dim" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-ink">{m.run.started ? "Select your broker to place a call" : "Start the mission to place a call"}</p>
          <p className="mt-1 text-xs text-ink-dim">The call opens once you have found the broker for your load.</p>
        </div>
      </section>
    );
  }

  const status = ended ? "Call Ended" : live ? callScript.statusLabels[call.status] : "Ready";
  const statusTone = connected ? "text-success" : dialing ? "text-gold-bright" : ended ? "text-danger" : "text-ink-dim";

  return (
    <section aria-label="Call panel" className={`flex flex-col gap-2.5 p-3 ${embedded ? "" : "panel"}`}>
      {features.aiCall && (
        <div className="flex items-center justify-between gap-2 text-[10px]">
          <span className="rounded-full bg-blue px-2 py-0.5 font-bold text-white">{manual.label}</span>
          <span className="flex items-center gap-1 text-ink-dim/70" title={ai.note}>
            <Lock className="size-2.5" aria-hidden="true" /> {ai.label} · {ai.note}
          </span>
        </div>
      )}

      <div className="text-center">
        <BrokerAvatar broker={cc.broker} className="mx-auto size-12 text-base" />
        <h2 className="mt-1.5 text-sm font-extrabold text-ink">Call with {cc.broker.name}</h2>
        <p className={`text-xs font-bold ${statusTone}`} aria-live="polite">
          {status}
        </p>

        {features.callExtras && live && (
          <div className="mt-1.5 flex h-8 items-center justify-center gap-1" aria-hidden="true">
            {Array.from({ length: BARS }, (_, i) => (
              <span
                key={i}
                className={`w-1 rounded-full bg-cyan-bright ${connected && !call.muted ? "animate-pulse" : "opacity-30"}`}
                style={{ height: `${connected && !call.muted ? 30 + ((i * 37) % 70) : 20}%`, animationDelay: `${i * 90}ms` }}
              />
            ))}
          </div>
        )}
        {(connected || ended) && (
          <p className="mt-1 font-mono text-lg font-bold tabular-nums text-ink" aria-label={ended ? "Call duration" : "Call timer"}>
            {ended && <span className="mr-1.5 font-sans text-[10px] font-semibold uppercase text-ink-dim">Duration</span>}
            {formatTimer(call.seconds)}
          </p>
        )}
      </div>

      {live ? (
        <>
          <CallControls call={call} connected={connected} onToggle={m.toggleCall} onEnd={m.endCall} />
        </>
      ) : (
        <GameButton size="sm" onClick={m.startCall}>
          <Phone className="size-4" aria-hidden="true" /> {ended ? "Call Again" : `Call ${cc.broker.contactName}`}
        </GameButton>
      )}

      {(live || transcript.length > 0) && (
        <div>
          <p className="label-xs">{ended ? "Call transcript" : "Live transcript"}</p>
          <ul className="scroll-compact mt-1 max-h-32 space-y-1 overflow-y-auto rounded-lg border border-line/60 bg-navy-900/60 p-2" aria-live="polite">
            {transcript.length === 0 && <li className="text-[11px] text-ink-dim">{dialing ? "Connecting..." : "No speech yet."}</li>}
            {transcript.map((t, i) => (
              <li key={i} className="text-[11px] leading-snug">
                <span className={`font-bold ${t.from === "student" ? "text-cyan-bright" : t.from === "broker" ? "text-gold-bright" : "text-ink-dim"}`}>
                  {t.from === "student" ? "You" : t.from === "broker" ? cc.broker.contactName : "System"}:
                </span>{" "}
                <span className="text-ink">{t.text}</span>
              </li>
            ))}
          </ul>
          {connected && (
            <form onSubmit={speak} className="mt-1.5 flex gap-1.5">
              <input value={say} onChange={(e) => setSay(e.target.value)} aria-label="Say on the call" placeholder="Say something..." className="h-8 min-w-0 flex-1 rounded-md border border-line bg-navy-900 px-2 text-xs text-ink outline-none focus:border-cyan" />
              <GameButton type="submit" size="sm" disabled={!say.trim()}>
                Say
              </GameButton>
            </form>
          )}
        </div>
      )}

      <GameButton variant="ghost" size="sm" onClick={() => setNotesOpen(true)}>
        <NotebookPen className="size-3.5" aria-hidden="true" /> View Call Notes {m.notes.length > 0 && `(${m.notes.length})`}
      </GameButton>

      <GameDrawer open={notesOpen} onClose={() => setNotesOpen(false)} title="Call Notes" subtitle={`Call with ${cc.broker.name}`}>
      <div>
        <div className="flex items-center justify-between">
          <p className="label-xs flex items-center gap-1">
            <NotebookPen className="size-3" aria-hidden="true" /> Call Notes
          </p>
          <span className="rounded bg-success/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-success">Auto Notes</span>
        </div>
        {m.notes.length ? (
          <ul className="mt-1 space-y-0.5">
            {m.notes.map((n) => (
              <li key={n} className="flex gap-1.5 text-[11px] leading-snug text-ink">
                <span className="text-cyan-bright">•</span> {n}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-[11px] text-ink-dim">Notes appear as you confirm details with the broker.</p>
        )}
        <GameButton variant="ghost" size="sm" className="mt-1.5 w-full" onClick={m.saveNotes} disabled={!m.notes.length || notesSaved}>
          {notesSaved ? "Notes Saved" : "Save Notes"}
        </GameButton>
      </div>
      </GameDrawer>
    </section>
  );
}
