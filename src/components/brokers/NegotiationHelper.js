"use client";

import { useState } from "react";
import { Sparkles, CheckCircle2, Handshake, ArrowUpRight, Lightbulb } from "lucide-react";
import { formatCurrency } from "@/lib/text";
import GameButton from "@/components/game/GameButton";
import GameDrawer from "@/components/game/GameDrawer";
import GameModal from "@/components/game/GameModal";
import TaskHighlight from "@/components/dispatcher/TaskHighlight";

// Compact negotiation column: the broker's offer, the agreement once reached, and a small helper.
// Everything else (all suggestions, rate insights, AI wording) opens in a drawer. The helper only
// offers wording for the message box; it never negotiates for the student.
export default function NegotiationHelper({ m, setDraft, highlight, agreementOpen, setAgreementOpen }) {
  const [drawer, setDrawer] = useState(false);
  const [tab, setTab] = useState("suggested");
  const [aiNote, setAiNote] = useState(false);
  const { comms, helper, cc } = m;
  const n = comms.negotiation;
  const enabled = m.correctSelected;
  const offer = n.counter != null && n.status !== "agreed" ? n.counter : null;
  const agreed = n.status === "agreed";
  const first = helper.suggestions[0];

  const placeText = (text) => {
    setDraft(text);
    setDrawer(false);
  };

  return (
    <div className="space-y-3">
      {agreed && (
        <TaskHighlight active={highlight === "confirm"}>
          <section aria-label="Rate agreed" className="panel border-success/50 p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-success">
              <Handshake className="size-4" aria-hidden="true" /> {comms.confirmed ? "Agreement confirmed" : "Rate agreed"}
            </p>
            <p className="text-3xl font-extrabold tabular-nums text-success">{formatCurrency(n.agreedRate)}</p>
            {comms.confirmed && <p className="mt-1 text-[11px] text-ink-dim">The load is not booked yet.</p>}
            <GameButton size="sm" variant="ghost" className="mt-2 w-full" onClick={() => setAgreementOpen(true)}>
              {comms.confirmed ? "View Agreement" : "Review Agreement"}
            </GameButton>
          </section>
        </TaskHighlight>
      )}

      {offer != null && (
        <section aria-label="Broker offer" className="panel border-gold/40 p-3">
          <p className="label-xs text-gold-bright">Broker offer</p>
          <p className="text-2xl font-extrabold tabular-nums text-ink">{formatCurrency(offer)}</p>
          <GameButton size="sm" className="mt-2 w-full" onClick={() => m.send("That works for me, let's go with that.", "chat")}>
            Accept offer
          </GameButton>
        </section>
      )}

      <TaskHighlight active={highlight === "helper" && !agreed}>
        <section aria-label="Negotiation helper" className="panel p-3">
          <h2 className="panel-title flex items-center gap-1.5">
            <Lightbulb className="size-3.5 text-gold-bright" aria-hidden="true" /> Negotiation Helper
          </h2>
          {!agreed && first && (
            <>
              <p className="mt-1.5 text-[11px] text-ink-dim">Suggested:</p>
              <p className="text-xs leading-snug text-ink">&ldquo;{first.text}&rdquo;</p>
              <GameButton size="sm" variant="ghost" className="mt-2 w-full" disabled={!enabled} onClick={() => setDraft(first.text)}>
                Use this message <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </GameButton>
            </>
          )}
          <button type="button" onClick={() => setDrawer(true)} className="mt-2 w-full rounded-lg border border-line py-1.5 text-xs font-semibold text-ink transition-colors hover:border-cyan hover:text-cyan-bright">
            {agreed ? "Rate Insights" : "More Suggestions"}
          </button>
        </section>
      </TaskHighlight>

      <GameDrawer open={drawer} onClose={() => setDrawer(false)} title="Negotiation Helper" subtitle="Wording ideas and rate facts">
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
          <Sparkles className="size-3.5" aria-hidden="true" /> Suggest a message
        </GameButton>
        {aiNote && <p className="text-xs text-ink-dim">Training assistance: the wording was placed in your message box. It is not a live AI.</p>}

        <div role="tablist" className="grid grid-cols-2 gap-1 rounded-lg bg-navy-900 p-1 text-xs font-semibold">
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
          <ul className="space-y-1.5">
            {helper.suggestions.map((s) => (
              <li key={s.id} className="flex items-start gap-2 rounded-lg border border-line/60 bg-navy-900/60 px-2.5 py-2">
                <p className="min-w-0 flex-1 text-xs leading-snug text-ink">{s.text}</p>
                <button type="button" disabled={!enabled} onClick={() => placeText(s.text)} className="flex shrink-0 items-center gap-0.5 rounded-md bg-blue px-2 py-1 text-[11px] font-bold text-white transition hover:brightness-110 disabled:opacity-40">
                  Use <ArrowUpRight className="size-3" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <dl className="space-y-0.5">
            {helper.insights.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-2 border-b border-line/40 pb-1.5 pt-1 last:border-0">
                <dt className="text-xs text-ink-dim">{k}</dt>
                <dd className="text-sm font-bold tabular-nums text-ink">{v}</dd>
              </div>
            ))}
            <p className="pt-1 text-[11px] text-ink-dim">Use these facts to justify a request. The training range is a guide, not the broker&apos;s limit.</p>
          </dl>
        )}
      </GameDrawer>

      {agreed && (
        <GameModal open={agreementOpen} onClose={() => setAgreementOpen(false)} title="Final agreement">
          <h2 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-success">
            <Handshake className="size-4" aria-hidden="true" /> Rate agreed
          </h2>
          <p className="text-4xl font-extrabold tabular-nums text-success">{formatCurrency(n.agreedRate)}</p>
          <ul className="mt-3 space-y-1.5">
            {[
              ["Pickup", `${cc.vars.pickupDay}, ${cc.vars.pickupTime} in ${cc.vars.origin}`],
              ["Delivery", `${cc.vars.deliveryDay}, ${cc.vars.deliveryTime} in ${cc.vars.destination}`],
              ["Equipment", cc.vars.equipment],
              ["Commodity", cc.vars.commodity],
              ["Appointment", cc.vars.appointment],
              ["Detention", cc.vars.detention],
            ].map(([k, v]) => (
              <li key={k} className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
                <span className="text-ink-dim">{k}:</span> <span className="font-semibold text-ink">{v}</span>
              </li>
            ))}
          </ul>
          {comms.confirmed ? (
            <p className="mt-4 rounded-lg bg-success/15 p-2.5 text-center text-sm font-bold text-success">✓ Agreement confirmed. Next: lock in the deal.</p>
          ) : (
            <GameButton
              className="mt-4 w-full uppercase"
              onClick={() => {
                m.confirmAgreement();
                setAgreementOpen(false);
              }}
            >
              Continue
            </GameButton>
          )}
          {!comms.confirmed && <p className="mt-2 text-xs text-ink-dim">Continue confirms the rate and terms. You can still try another load before you lock in the deal.</p>}
          <GameButton className="mt-2 w-full" variant="ghost" onClick={() => setAgreementOpen(false)}>
            Close
          </GameButton>
        </GameModal>
      )}
    </div>
  );
}
