"use client";

import { X, Eye, ListChecks } from "lucide-react";
import { simulationConfig } from "@/data/simulationConfig";
import { getLoad, formatLocation } from "@/lib/loadSelectors";
import { formatCurrency, formatSimDay, formatSimClock } from "@/lib/text";
import GameButton from "@/components/game/GameButton";
import TaskHighlight from "@/components/dispatcher/TaskHighlight";

// Shortlisted loads, resolved from IDs, with progress against the configured min/max.
export default function ShortlistPanel({ m, highlight }) {
  const { min, max } = simulationConfig.shortlist;
  const loads = m.shortlistedIds.map(getLoad).filter(Boolean);
  const ready = loads.length >= min;

  return (
    <TaskHighlight active={highlight === "shortlist"}>
      <section aria-label="Shortlisted loads" className="panel p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="panel-title flex items-center gap-1.5">
            <ListChecks className="size-3.5 text-cyan-bright" aria-hidden="true" /> Shortlisted Loads
          </h2>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-ink-dim" aria-live="polite">
            <span className="flex gap-1" aria-hidden="true">
              {Array.from({ length: max }, (_, i) => (
                <span key={i} className={`h-1.5 w-5 rounded-full transition-colors ${i < loads.length ? (ready ? "bg-success" : "bg-gold") : "bg-line"}`} />
              ))}
            </span>
            <span className={ready ? "text-success" : "text-gold-bright"}>{loads.length}</span> / {max} loads shortlisted
            <span className="font-normal normal-case text-ink-dim">(min {min})</span>
            {loads.length > 0 && (
              <button type="button" onClick={m.clearShortlist} className="rounded-md app-border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink transition-colors hover:border-cyan hover:text-cyan-bright">
                Clear
              </button>
            )}
          </p>
        </div>

        {loads.length === 0 ? (
          <p className="mt-2.5 rounded-lg app-border border-dashed px-3 py-4 text-center text-xs text-ink-dim">
            No loads shortlisted yet. View a load, review its compatibility, then shortlist the suitable ones.
          </p>
        ) : (
          <ul className="mt-2.5 grid gap-2.5 md:grid-cols-3">
            {loads.map((load) => (
              <li key={load.id} className="rounded-lg app-border app-border-success bg-navy-900/60 p-2.5 transition-colors hover:border-success/60">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-ink">{load.referenceNumber}</span>
                  <span className="text-sm font-extrabold tabular-nums text-success">{formatCurrency(load.rate)}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-ink">
                  {formatLocation(load.originLocationId)} <span aria-label="to">&rarr;</span> {formatLocation(load.destinationLocationId)}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-ink-dim">
                  {load.equipmentType} · {load.loadedMiles.toLocaleString("en-US")} mi · Pickup {formatSimDay(load.pickupWindow.start)}, {formatSimClock(load.pickupWindow.start)}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <GameButton variant="ghost" size="sm" onClick={() => m.selectLoad(load.id)}>
                    <Eye className="size-3.5" aria-hidden="true" /> VIEW
                  </GameButton>
                  <GameButton variant="ghost" size="sm" onClick={() => m.removeFromShortlist(load.id)}>
                    <X className="size-3.5" aria-hidden="true" /> REMOVE
                  </GameButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </TaskHighlight>
  );
}
