"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, MoreHorizontal, Send, Star, MessageSquare, Lock, ChevronUp, ArrowRight } from "lucide-react";
import { brokers } from "@/data/brokers";
import { simulationConfig } from "@/data/simulationConfig";
import { formatLocation } from "@/lib/loadSelectors";
import { addMinutes, formatSimClock, parseSimTime } from "@/lib/text";
import GameButton from "@/components/game/GameButton";
import TaskHighlight from "@/components/dispatcher/TaskHighlight";
import TrainingFeedback from "@/components/training/TrainingFeedback";
import BrokerAvatar, { STATUS_STYLE } from "./BrokerAvatar";

const CLOCK_START = parseSimTime(simulationConfig.clock.now);
const VISIBLE_CHIPS = 4;

// Chat with the broker for the selected load: the central working area. Free text is mapped to
// training topics by the engine (lib/brokerChat.js); the broker's answers are deterministic.
export default function BrokerChat({ m, draft, setDraft, highlight, onCall }) {
  const [popover, setPopover] = useState(false);
  const endRef = useRef(null);
  const broker = brokers.find((b) => b.id === m.viewBrokerId) ?? null;
  const messages = m.comms.messages.filter((msg) => msg.channel === "chat");
  const canChat = m.correctSelected && broker?.id === m.cc.broker.id;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  function submit(e) {
    e.preventDefault();
    if (!draft.trim() || !canChat) return;
    m.send(draft, "chat");
    setDraft("");
  }

  if (!m.run.started) {
    return (
      <section aria-label="Broker chat" className="panel grid h-full place-items-center p-6 text-center">
        <div className="max-w-xs">
          <MessageSquare className="mx-auto size-9 text-cyan-bright" aria-hidden="true" />
          <p className="mt-2 text-sm font-bold text-ink">Your conversation starts here</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-dim">Start the mission, identify the broker associated with your selected load, then contact them by chat or call.</p>
          <GameButton className="mt-4" onClick={m.start}>
            Start Mission <ArrowRight className="size-4" aria-hidden="true" />
          </GameButton>
        </div>
      </section>
    );
  }

  if (!broker) {
    return (
      <section aria-label="Broker chat" className="panel grid h-full place-items-center p-6 text-center">
        <div>
          <MessageSquare className="mx-auto size-9 text-ink-dim" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-ink">Select a broker to open a conversation</p>
          <p className="mt-1 text-xs text-ink-dim">Check your selected load&apos;s details, then find the matching broker in the list.</p>
        </div>
      </section>
    );
  }

  const st = STATUS_STYLE[broker.status];
  const chips = m.helper?.questions ?? [];
  const shown = chips.slice(0, VISIBLE_CHIPS);
  const rest = chips.slice(VISIBLE_CHIPS);

  return (
    <section aria-label="Broker chat" className="panel flex h-full flex-col overflow-hidden">
      <header className="flex items-center gap-3 border-b border-line/70 px-3 py-2.5">
        <BrokerAvatar broker={broker} className="size-10 text-sm" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-extrabold text-ink">{broker.name}</h2>
          <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-ink-dim">
            <span className="flex items-center gap-0.5 font-semibold text-ink">
              <Star className="size-3 fill-gold-bright text-gold-bright" aria-hidden="true" /> {broker.rating}
            </span>
            ({broker.reviewCount} reviews) · {formatLocation(broker.locationId)}
            <span className={`flex items-center gap-1 font-semibold ${st.text}`}>
              <span className={`size-1.5 rounded-full ${st.dot}`} /> {st.label}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={onCall}
          disabled={!canChat}
          aria-label={`Call ${broker.name}`}
          className="grid size-8 place-items-center rounded-lg border border-success/40 bg-success/15 text-success transition-colors hover:bg-success/25 disabled:opacity-40"
        >
          <Phone className="size-4" aria-hidden="true" />
        </button>
        <button type="button" aria-label="More options" className="grid size-8 place-items-center rounded-lg border border-line bg-surface text-ink-dim">
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </button>
      </header>

      {!canChat && (
        <div className="m-3 flex items-start gap-2 rounded-lg border border-gold/40 bg-gold/10 p-2.5 text-xs text-ink">
          <Lock className="mt-0.5 size-3.5 shrink-0 text-gold-bright" aria-hidden="true" />
          This broker is not associated with your selected load, so there is nothing to discuss. Check the load details and select the right broker.
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 py-3" role="log" aria-live="polite" aria-label="Conversation">
        {messages.map((msg, i) => {
          const mine = msg.from === "student";
          return (
            <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] ${mine ? "text-right" : ""}`}>
                <p
                  className={`inline-block rounded-2xl px-3 py-2 text-left text-[13px] leading-snug ${
                    mine ? "rounded-br-sm bg-blue text-white" : "rounded-bl-sm border border-line bg-surface-2 text-ink"
                  }`}
                >
                  {msg.text}
                </p>
                <p className="mt-0.5 px-1 text-[10px] text-ink-dim/70">{formatSimClock(addMinutes(CLOCK_START, 12 + i * 2))}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {m.coach && messages.length > 1 && (
        <div className="px-3 pb-1.5">
          <TrainingFeedback tone={m.coach.tone}>{m.coach.text}</TrainingFeedback>
        </div>
      )}

      <TaskHighlight active={highlight === "chat"} className="m-1.5">
        <div className="border-t border-line/70 px-1.5 pb-1.5 pt-2">
          <div className="relative mb-2 flex flex-wrap items-center gap-1.5">
            {shown.map((q) => (
              <button
                key={q.id}
                type="button"
                disabled={!canChat}
                onClick={() => m.send(q.text, "chat")}
                className="rounded-full border border-line bg-navy-900 px-2 py-0.5 text-[10px] text-ink transition-colors hover:border-cyan hover:text-cyan-bright disabled:opacity-40"
              >
                {q.label}
              </button>
            ))}
            {rest.length > 0 && (
              <button
                type="button"
                onClick={() => setPopover((v) => !v)}
                aria-expanded={popover}
                aria-haspopup="true"
                className="flex items-center gap-0.5 rounded-full border border-cyan/40 bg-cyan/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-bright"
              >
                +{rest.length} more <ChevronUp className={`size-3 transition-transform ${popover ? "" : "rotate-180"}`} aria-hidden="true" />
              </button>
            )}
            {popover && (
              <ul className="absolute bottom-full left-0 z-20 mb-1 w-72 max-w-full space-y-0.5 rounded-xl border border-line bg-surface-2 p-1.5 shadow-[0_10px_30px_rgb(0_0_0/0.5)]">
                {rest.map((q) => (
                  <li key={q.id}>
                    <button
                      type="button"
                      disabled={!canChat}
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
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={!canChat}
              aria-label="Type your message"
              placeholder={canChat ? "Type your message..." : "Select the correct broker to chat"}
              className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-navy-900 px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-dim/70 focus:border-cyan focus:ring-1 focus:ring-cyan/40 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!canChat || !draft.trim()}
              aria-label="Send message"
              className="grid size-9 place-items-center rounded-lg bg-blue text-white transition hover:brightness-110 disabled:opacity-40"
            >
              <Send className="size-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </TaskHighlight>
    </section>
  );
}
