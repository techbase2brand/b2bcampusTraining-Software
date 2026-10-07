"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Mic, MicOff, Grid3x3, Volume2, NotebookPen, Send, MessageSquare, Lock, ChevronUp } from "lucide-react";
import { callScript } from "@/data/brokerComms";
import { formatTimer } from "@/lib/callSim";
import GameButton from "@/components/game/GameButton";
import TaskHighlight from "@/components/dispatcher/TaskHighlight";
import BrokerAvatar from "@/components/brokers/BrokerAvatar";

const VISIBLE_CHIPS = 3;
const BARS = 14;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];
const MODES = [
  { id: "chat", label: "Chat" },
  { id: "call", label: "Call" },
  { id: "ai", label: "AI Call" },
];

// Driver communication during the trip: chat, a simulated call (no telephony) and an AI-call
// placeholder. Check-call questions are one tap away; each check call is logged by the engine.
export default function TrackingComms({ m }) {
  const [mode, setMode] = useState("chat");
  const [popover, setPopover] = useState(false);
  const [draft, setDraft] = useState("");
  const [say, setSay] = useState("");
  const endRef = useRef(null);
  const { entry, call, t, run } = m;
  const chat = t.messages.filter((x) => x.channel === "chat");
  const transcript = t.messages.filter((x) => x.channel === "call");
  const canTalk = run.started;
  const first = entry.driver.name.split(" ")[0];

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [chat.length, mode]);

  const submit = (e) => {
    e.preventDefault();
    if (!draft.trim() || !canTalk) return;
    m.send(draft, "chat");
    setDraft("");
  };
  const speak = (e) => {
    e.preventDefault();
    if (!say.trim() || call.status !== "connected") return;
    m.send(say, "call");
    setSay("");
  };

  const chips = m.suggestions;
  const shown = chips.slice(0, VISIBLE_CHIPS);
  const rest = chips.slice(VISIBLE_CHIPS);
  const dialing = call.status === "dialing";
  const connected = call.status === "connected";
  const live = dialing || connected;
  const ended = call.status === "ended";
  const ai = callScript.modes.find((x) => x.id === "ai");
  const notesSaved = t.notes.length > 0 && JSON.stringify(t.notes) === JSON.stringify(m.notes);

  return (
    <TaskHighlight active={m.highlight === "comms"}>
      <section aria-label="Driver communication" className="panel flex h-[28rem] flex-col overflow-hidden">
        <header className="flex items-center gap-2.5 border-b border-line/70 px-3 py-2">
          <BrokerAvatar broker={entry.driver} className="size-9 text-xs" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-extrabold text-ink">{entry.driver.name}</h2>
            <p className="truncate text-[10px] text-ink-dim">
              {entry.truck.id} · Check calls: <span className="font-semibold text-cyan-bright">{t.checkCalls.length}</span>
            </p>
          </div>
          <div role="tablist" aria-label="Communication mode" className="grid grid-cols-3 gap-0.5 rounded-lg bg-navy-900 p-0.5 text-[11px] font-semibold">
            {MODES.map((x) => (
              <button key={x.id} type="button" role="tab" aria-selected={mode === x.id} onClick={() => setMode(x.id)} className={`rounded-md px-2 py-1 ${mode === x.id ? "bg-blue text-white" : "text-ink-dim hover:text-ink"}`}>
                {x.label}
              </button>
            ))}
          </div>
        </header>

        {mode === "chat" && (
          <>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-2.5" role="log" aria-live="polite" aria-label="Conversation">
              {chat.length === 0 && (
                <div className="grid h-full place-items-center text-center">
                  <div>
                    <MessageSquare className="mx-auto size-7 text-cyan-bright" aria-hidden="true" />
                    <p className="mt-1.5 text-xs text-ink-dim">{canTalk ? `Ask ${first} for a status update.` : "Start the mission to contact the driver."}</p>
                  </div>
                </div>
              )}
              {chat.map((msg, i) => {
                if (msg.from === "system") return <p key={i} className="text-center text-[10px] font-semibold uppercase tracking-wide text-ink-dim">{msg.text}</p>;
                const mine = msg.from === "dispatcher";
                return (
                  <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <p className={`inline-block max-w-[82%] rounded-2xl px-3 py-1.5 text-left text-[13px] leading-snug ${mine ? "rounded-br-sm bg-blue text-white" : "rounded-bl-sm border border-line bg-surface-2 text-ink"}`}>{msg.text}</p>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            <div className="border-t border-line/70 px-2 pb-2 pt-2">
              <div className="relative mb-2 flex flex-wrap items-center gap-1.5">
                {shown.map((q) => (
                  <button key={q.id} type="button" disabled={!canTalk} onClick={() => m.send(q.text, "chat")} className="rounded-full border border-line bg-navy-900 px-2 py-0.5 text-[10px] text-ink transition-colors hover:border-cyan hover:text-cyan-bright disabled:opacity-40">
                    {q.label}
                  </button>
                ))}
                {rest.length > 0 && (
                  <button type="button" onClick={() => setPopover((v) => !v)} aria-expanded={popover} aria-haspopup="true" className="flex items-center gap-0.5 rounded-full border border-cyan/40 bg-cyan/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-bright">
                    +{rest.length} more <ChevronUp className={`size-3 transition-transform ${popover ? "" : "rotate-180"}`} aria-hidden="true" />
                  </button>
                )}
                {popover && (
                  <ul className="absolute bottom-full left-0 z-20 mb-1 w-64 max-w-full space-y-0.5 rounded-xl border border-line bg-surface-2 p-1.5 shadow-[0_10px_30px_rgb(0_0_0/0.5)]">
                    {rest.map((q) => (
                      <li key={q.id}>
                        <button
                          type="button"
                          disabled={!canTalk}
                          onClick={() => {
                            m.send(q.text, "chat");
                            setPopover(false);
                          }}
                          className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-ink transition-colors hover:bg-blue/20 disabled:opacity-40"
                        >
                          {q.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <form onSubmit={submit} className="flex items-center gap-2">
                <input value={draft} onChange={(e) => setDraft(e.target.value)} disabled={!canTalk} aria-label="Type your message" placeholder={canTalk ? "Type your message..." : "Start the mission to chat"} className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-navy-900 px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-dim/70 focus:border-cyan focus:ring-1 focus:ring-cyan/40 disabled:opacity-50" />
                <button type="submit" disabled={!canTalk || !draft.trim()} aria-label="Send message" className="grid size-9 place-items-center rounded-lg bg-blue text-white transition hover:brightness-110 disabled:opacity-40">
                  <Send className="size-4" aria-hidden="true" />
                </button>
              </form>
            </div>
          </>
        )}

        {mode === "call" && (
          <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-3">
            <div className="text-center">
              <h3 className="text-sm font-extrabold text-ink">Call with {entry.driver.name}</h3>
              <p className={`text-xs font-bold ${connected ? "text-success" : dialing ? "text-gold-bright" : ended ? "text-danger" : "text-ink-dim"}`} aria-live="polite">
                {ended ? "Call Ended" : live ? callScript.statusLabels[call.status] : "Ready"}
              </p>
              {live && (
                <div className="mt-1.5 flex h-7 items-center justify-center gap-1" aria-hidden="true">
                  {Array.from({ length: BARS }, (_, i) => (
                    <span key={i} className={`w-1 rounded-full bg-cyan-bright ${connected && !call.muted ? "animate-pulse" : "opacity-30"}`} style={{ height: `${connected && !call.muted ? 30 + ((i * 37) % 70) : 20}%`, animationDelay: `${i * 90}ms` }} />
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
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    ["mute", call.muted ? MicOff : Mic, "Mute", call.muted],
                    ["keypad", Grid3x3, "Keypad", call.keypad],
                    ["speaker", Volume2, "Speaker", call.speaker],
                  ].map(([type, Icon, label, on]) => (
                    <button key={type} type="button" onClick={() => m.toggleCall(type)} disabled={!connected} aria-pressed={on} className={`flex flex-col items-center gap-0.5 rounded-lg border py-1.5 text-[10px] font-semibold transition-colors disabled:opacity-40 ${on ? "border-cyan bg-cyan/15 text-cyan-bright" : "border-line bg-surface-2 text-ink"}`}>
                      <Icon className="size-4" aria-hidden="true" /> {label}
                    </button>
                  ))}
                  <button type="button" onClick={m.endCall} className="flex flex-col items-center gap-0.5 rounded-lg border border-danger/50 bg-danger/20 py-1.5 text-[10px] font-semibold text-danger transition-colors hover:bg-danger/30">
                    <PhoneOff className="size-4" aria-hidden="true" /> End Call
                  </button>
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
            ) : (
              <GameButton size="sm" disabled={!canTalk} onClick={m.startCall}>
                <Phone className="size-4" aria-hidden="true" /> {ended ? "Call Again" : `Call ${first}`}
              </GameButton>
            )}

            {(live || transcript.length > 0) && (
              <div>
                <p className="label-xs">{ended ? "Call transcript" : "Live transcript"}</p>
                <ul className="mt-1 max-h-32 space-y-1 overflow-y-auto rounded-lg border border-line/60 bg-navy-900/60 p-2" aria-live="polite">
                  {transcript.length === 0 && <li className="text-[11px] text-ink-dim">{dialing ? "Connecting..." : "No speech yet."}</li>}
                  {transcript.map((x, i) => (
                    <li key={i} className="text-[11px] leading-snug">
                      <span className={`font-bold ${x.from === "dispatcher" ? "text-cyan-bright" : x.from === "driver" ? "text-gold-bright" : "text-ink-dim"}`}>{x.from === "dispatcher" ? "You" : x.from === "driver" ? first : "System"}:</span> <span className="text-ink">{x.text}</span>
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

            <div>
              <p className="label-xs flex items-center gap-1">
                <NotebookPen className="size-3" aria-hidden="true" /> Call Notes
              </p>
              {m.notes.length ? (
                <ul className="mt-1 space-y-0.5">
                  {m.notes.map((n) => (
                    <li key={n} className="flex gap-1.5 text-[11px] leading-snug text-ink">
                      <span className="text-cyan-bright">•</span> {n}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-[11px] text-ink-dim">Notes appear as you check in with the driver.</p>
              )}
              <GameButton variant="ghost" size="sm" className="mt-1.5 w-full" onClick={m.saveNotes} disabled={!m.notes.length || notesSaved}>
                {notesSaved ? "Notes Saved" : "Save Notes"}
              </GameButton>
            </div>
          </div>
        )}

        {mode === "ai" && (
          <div className="grid flex-1 place-items-center p-6 text-center">
            <div className="max-w-xs">
              <Lock className="mx-auto size-8 text-ink-dim" aria-hidden="true" />
              <p className="mt-2 text-sm font-bold text-ink">{ai.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-dim">{ai.note}. Use Chat or Call for check calls in this mission.</p>
            </div>
          </div>
        )}
      </section>
    </TaskHighlight>
  );
}
