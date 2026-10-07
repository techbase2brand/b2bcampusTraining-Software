"use client";

import { useState } from "react";
import { Sparkles, CheckCircle2, Handshake, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/text";
import GameButton from "@/components/game/GameButton";
import TaskHighlight from "@/components/dispatcher/TaskHighlight";

// Assists the student but never negotiates for them: it only offers wording to put in the message box.
export default function NegotiationHelper({ m, setDraft, highlight }) {
  const [tab, setTab] = useState("suggested");
  const [aiNote, setAiNote] = useState(false);
  const { comms, helper, cc } = m;
  const n = comms.negotiation;
  const enabled = m.correctSelected;
  const offer = n.counter != null && n.status !== "agreed" ? n.counter : null;

  return (
    <div className="space-y-3">
      {n.status === "agreed" && (
        <TaskHighlight active={highlight === "confirm"}>
          <section aria-label="Rate agreed" className="panel border-success/50 p-2.5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-success">
              <Handshake className="size-4" aria-hidden="true" /> Rate Agreed
            </p>
            <p className="mt-1 text-xs text-ink-dim">Final rate</p>
            <p className="text-3xl font-extrabold tabular-nums text-success">{formatCurrency(n.agreedRate)}</p>
            <ul className="mt-2 space-y-1">
              {[
                ["Pickup", `${cc.vars.pickupDay}, ${cc.vars.pickupTime} in ${cc.vars.origin}`],
                ["Delivery", `${cc.vars.deliveryDay}, ${cc.vars.deliveryTime} in ${cc.vars.destination}`],
                ["Equipment", cc.vars.equipment],
                ["Commodity", cc.vars.commodity],
                ["Appointment", cc.vars.appointment],
                ["Detention", cc.vars.detention],
              ].map(([k, v]) => (
                <li key={k} className="flex items-start gap-1.5 text-[11px]">
                  <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-success" aria-hidden="true" />
                  <span className="text-ink-dim">{k}:</span> <span className="font-semibold text-ink">{v}</span>
                </li>
              ))}
            </ul>
            {comms.confirmed ? (
              <p className="mt-3 rounded-lg bg-success/15 p-2 text-center text-xs font-bold text-success">Agreement confirmed. The load is not booked yet.</p>
            ) : (
              <GameButton className="mt-3 w-full" onClick={m.confirmAgreement}>
                CONFIRM AGREEMENT
              </GameButton>
            )}
          </section>
        </TaskHighlight>
      )}

      {offer != null && (
        <section aria-label="Broker offer" className="panel border-gold/40 p-2.5">
          <p className="label-xs text-gold-bright">Broker offer</p>
          <p className="text-2xl font-extrabold tabular-nums text-ink">{formatCurrency(offer)}</p>
          <GameButton size="sm" className="mt-2 w-full" onClick={() => m.send("That works for me, let's go with that.", "chat")}>
            Accept offer
          </GameButton>
        </section>
      )}

      <TaskHighlight active={highlight === "helper"}>
        <section aria-label="Negotiation helper" className="panel p-2.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="panel-title">Negotiation Helper</h2>
            <GameButton
              size="sm"
              variant="ghost"
              disabled={!enabled}
              onClick={() => {
                const text = m.aiSuggestion();
                if (text) {
                  setDraft(text);
                  setAiNote(true);
                }
              }}
            >
              <Sparkles className="size-3.5" aria-hidden="true" /> Use AI Suggestion
            </GameButton>
          </div>
          {aiNote && <p className="mt-1 text-[10px] text-ink-dim">Training assistance: a suggested wording placed in your message box. It is not a live AI.</p>}

          <div role="tablist" className="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-navy-900 p-1 text-[11px] font-semibold">
            {[
              ["suggested", "Suggested Messages"],
              ["insights", "Rate Insights"],
            ].map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`rounded-md py-1.5 ${tab === id ? "bg-blue text-white" : "text-ink-dim hover:text-ink"}`}>
                {label}
              </button>
            ))}
          </div>

          {tab === "suggested" ? (
            <ul className="mt-2 space-y-1">
              {helper.suggestions.map((s) => (
                <li key={s.id} className="flex items-start gap-2 rounded-lg border border-line/60 bg-navy-900/60 px-2 py-1.5">
                  <p className="min-w-0 flex-1 text-[11px] leading-snug text-ink">{s.text}</p>
                  <button
                    type="button"
                    disabled={!enabled}
                    onClick={() => setDraft(s.text)}
                    className="flex shrink-0 items-center gap-0.5 rounded-md bg-blue px-2 py-1 text-[10px] font-bold text-white transition hover:brightness-110 disabled:opacity-40"
                  >
                    Use <ArrowUpRight className="size-3" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <dl className="mt-2 space-y-0.5">
              {helper.insights.map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-2 border-b border-line/40 pb-1 last:border-0">
                  <dt className="text-[11px] text-ink-dim">{k}</dt>
                  <dd className="text-xs font-bold tabular-nums text-ink">{v}</dd>
                </div>
              ))}
              <p className="pt-1 text-[10px] text-ink-dim">Use these facts to justify a request. The training range is a guide, not the broker&apos;s limit.</p>
            </dl>
          )}
        </section>
      </TaskHighlight>
    </div>
  );
}
