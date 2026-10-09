"use client";

import { useState } from "react";
import { Scale } from "lucide-react";
import { useDispatchScope } from "@/hooks/useDispatchScope";
import { getTruckContext } from "@/lib/loadRules";
import { getBroker } from "@/lib/loadSelectors";
import { getPracticeSummary, getDeals } from "@/lib/practiceAttempts";
import { formatCurrency } from "@/lib/text";
import GameDrawer from "@/components/game/GameDrawer";

// Compact practice strip ("2 Loads Compared / 2 Broker Conversations / 1 Negotiated Deal") with the
// detailed deal comparison in a drawer. Reads the saved practice session; renders nothing until the
// student has practised with at least one load. `children` is extra actions shown under the strip.
export default function PracticeSummary({ slug, children = null }) {
  const [open, setOpen] = useState(false);
  const { state } = useDispatchScope(slug);
  if (!state) return null;
  const sum = getPracticeSummary(state);
  if (sum.attemptCount === 0 && !children) return null;
  const deals = getDeals(state, getTruckContext());
  const best = deals.length > 1 ? deals.reduce((a, b) => (b.margin > a.margin ? b : a)) : null;

  return (
    <section aria-label="Practice summary" className="panel p-3">
      <h2 className="panel-title flex items-center gap-1.5">
        <Scale className="size-3.5 text-cyan-bright" aria-hidden="true" /> Practice
      </h2>
      {sum.attemptCount > 0 && (
        <ul className="mt-1.5 space-y-0.5 text-xs text-ink">
          <li>
            <span className="font-bold tabular-nums">{sum.loadsCompared}</span> {sum.loadsCompared === 1 ? "Load" : "Loads"} Compared
          </li>
          <li>
            <span className="font-bold tabular-nums">{sum.brokerConversations}</span> Broker {sum.brokerConversations === 1 ? "Conversation" : "Conversations"}
          </li>
          <li>
            <span className="font-bold tabular-nums">{sum.negotiatedDeals}</span> Negotiated {sum.negotiatedDeals === 1 ? "Deal" : "Deals"}
          </li>
        </ul>
      )}
      {sum.negotiatedDeals > 0 && (
        <button type="button" onClick={() => setOpen(true)} className="mt-2 w-full rounded-lg app-border py-1.5 text-xs font-semibold text-ink transition-colors hover:border-cyan hover:text-cyan-bright">
          View Comparison
        </button>
      )}
      {children}

      <GameDrawer open={open} onClose={() => setOpen(false)} title="Deals Compared" subtitle="Numbers use the agreed rate" width="lg">
        {deals.map((d) => (
          <article key={d.loadId} className={`rounded-xl app-border p-3 ${best?.loadId === d.loadId ? "app-border-success bg-success/5" : " bg-surface"}`}>
            <header className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-ink">{d.ref}</h3>
              <span className="flex gap-1.5 text-[11px] font-bold">
                {d.finalized && <span className="rounded-full bg-cyan/20 px-2 py-0.5 text-cyan-bright">FINAL</span>}
                {best?.loadId === d.loadId && <span className="rounded-full bg-success/20 px-2 py-0.5 text-success">HIGHEST MARGIN</span>}
              </span>
            </header>
            <p className="text-[11px] text-ink-dim">{getBroker(d.brokerId)?.name}</p>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              {[
                ["Agreed Rate", `${formatCurrency(d.agreedRate)} (posted ${formatCurrency(d.postedRate)})`],
                ["Effective RPM", `$${d.rpm.toFixed(2)}/mi`],
                ["Deadhead", `${d.deadheadMiles} mi`],
                ["Estimated Margin", formatCurrency(d.margin)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="label-xs">{k}</dt>
                  <dd className="font-semibold tabular-nums text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
        {deals.length < 2 && <p className="text-xs text-ink-dim">Negotiate with another broker to compare deals side by side. A better rate can change which load is best.</p>}
      </GameDrawer>
    </section>
  );
}
