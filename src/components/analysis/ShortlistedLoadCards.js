"use client";

import { Check, Eye } from "lucide-react";
import { phase4Page } from "@/data/phase4Missions";
import { getLoad, formatLocation } from "@/lib/loadSelectors";
import { formatCurrency, formatSimDay, formatSimClock } from "@/lib/text";
import TruckThumb from "@/components/dispatcher/TruckThumb";
import TaskHighlight from "@/components/dispatcher/TaskHighlight";

// The loads shortlisted in Phase 3. Clicking a card shows it in the details panel and counts as
// reviewing it. IDs come from the saved shortlist; nothing is duplicated.
export default function ShortlistedLoadCards({ m, highlight }) {
  return (
    <TaskHighlight active={highlight === "shortlist-cards"}>
      <section aria-label="Shortlisted loads" className="panel p-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-extrabold text-ink">
            {phase4Page.shortlistTitle} <span className="text-ink-dim">({m.analyses.length})</span>
          </h2>
          <p className="hidden text-[11px] text-ink-dim sm:block">{phase4Page.shortlistSub}</p>
        </div>

        <ul className="mt-2.5 grid gap-2.5 md:grid-cols-3">
          {m.analyses.map((a) => {
            const load = getLoad(a.loadId);
            const active = m.detailLoadId === a.loadId;
            const viewed = m.viewedIds.includes(a.loadId);
            const best = m.selectedBestLoadId === a.loadId;
            return (
              <li key={a.loadId}>
                <button
                  type="button"
                  onClick={() => m.viewLoad(a.loadId)}
                  aria-pressed={active}
                  className={`w-full rounded-xl border p-2.5 text-left transition-all duration-200 ${
                    active ? "border-cyan-bright bg-cyan/10 shadow-[0_0_18px_rgb(37_217_255/0.2)]" : "border-line bg-navy-900/60 hover:border-cyan/50"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-ink">{load.referenceNumber}</span>
                    {best ? (
                      <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-bold text-success">SELECTED</span>
                    ) : viewed ? (
                      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-success"><Check className="size-3" aria-hidden="true" /> Reviewed</span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-[10px] text-ink-dim"><Eye className="size-3" aria-hidden="true" /> Open</span>
                    )}
                  </span>
                  <span className="mt-2 flex gap-2.5">
                    <TruckThumb className="h-14 w-16 shrink-0 rounded-md" />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-ink">{formatLocation(load.originLocationId)} &rarr;</span>
                      <span className="block truncate text-xs font-semibold text-ink">{formatLocation(load.destinationLocationId)}</span>
                      <span className="mt-0.5 block text-[11px] text-ink-dim">
                        {load.loadedMiles.toLocaleString("en-US")} mi | {load.equipmentType}
                      </span>
                    </span>
                  </span>
                  <span className="mt-2 block text-[11px] text-ink-dim">
                    Pickup: <span className="text-ink">{formatSimDay(load.pickupWindow.start)}, {formatSimClock(load.pickupWindow.start)}</span>
                  </span>
                  <span className="block text-[11px] text-ink-dim">
                    Delivery: <span className="text-ink">{formatSimDay(load.deliveryWindow.start)}, {formatSimClock(load.deliveryWindow.start)}</span>
                  </span>
                  <span className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-lg font-extrabold tabular-nums text-success">{formatCurrency(load.rate)}</span>
                    <span className="text-[11px] text-ink-dim">posted rate</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </TaskHighlight>
  );
}
