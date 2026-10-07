"use client";

import { X, Check, AlertTriangle, ArrowRight } from "lucide-react";
import { loadBoardColumns, sortOptions } from "@/data/loadFilters";
import { formatLocation } from "@/lib/loadSelectors";
import { formatCurrency, formatSimDay, formatSimClock } from "@/lib/text";
import { describeActiveFilters } from "@/lib/loadFiltering";
import { getRevealedIssues } from "@/lib/phase3Engine";
import TaskHighlight from "@/components/dispatcher/TaskHighlight";
import GameButton from "@/components/game/GameButton";

// Results area: count, sort, active filter chips and the real load rows.
// Row states: selected, shortlisted, viewed. An "issue found" state appears only after the student
// has revealed a failing check, so incompatible loads are never pre-marked.
export default function LoadResultsTable({ results, m, onApply, onReset, highlight }) {
  const { filters, selectedLoad, shortlistedIds, reviewedIds, checks } = m;
  const chips = describeActiveFilters(filters);

  return (
    <TaskHighlight active={highlight === "load-results"} className="min-w-0">
      <section aria-label="Load results" className="panel flex min-w-0 flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 px-3 py-2.5">
          <h2 className="flex items-baseline gap-2" aria-live="polite">
            <span className="text-lg font-extrabold tabular-nums text-ink">{results.length}</span>
            <span className="text-sm font-semibold text-ink-dim">{results.length === 1 ? "Load" : "Loads"} Found</span>
          </h2>
          <label className="flex items-center gap-2 text-[11px] text-ink-dim">
            Sort by
            <select
              value={filters.sortBy}
              onChange={(e) => onApply({ ...filters, sortBy: e.target.value })}
              className="h-8 rounded-md border border-line bg-navy-900 px-2 text-xs text-ink outline-none transition-colors focus:border-cyan"
            >
              {sortOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-b border-line/70 px-3 py-2" aria-label="Active filters">
            {chips.map((chip) => (
              <span key={chip.id} className="flex items-center gap-0.5 rounded-full border border-cyan/35 bg-cyan/10 py-0.5 pl-2.5 pr-1 text-[11px] text-ink">
                {chip.label}
                <button
                  type="button"
                  aria-label={`Clear filter: ${chip.label}`}
                  onClick={() => onApply({ ...filters, ...chip.patch })}
                  className="grid size-4 place-items-center rounded-full text-ink-dim transition-colors hover:bg-cyan/20 hover:text-cyan-bright"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </span>
            ))}
            <button type="button" onClick={onReset} className="ml-1 text-[11px] text-cyan-bright hover:underline">
              Reset Filters
            </button>
          </div>
        )}

        <div className="max-h-[34rem] overflow-auto">
          <table className="w-full min-w-168 border-separate border-spacing-0 text-left text-xs">
            <thead>
              <tr>
                {loadBoardColumns.map((c) => (
                  <th
                    key={c.id}
                    scope="col"
                    className="sticky top-0 z-10 whitespace-nowrap border-b border-line bg-navy-900 px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-ink-dim"
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((load) => {
                const selected = load.id === selectedLoad?.id;
                const shortlisted = shortlistedIds.includes(load.id);
                const viewed = reviewedIds.includes(load.id);
                const issues = getRevealedIssues(load, checks);
                const tone = selected
                  ? "bg-cyan/10 shadow-[inset_3px_0_0_#25d9ff]"
                  : shortlisted
                    ? "bg-success/5 shadow-[inset_3px_0_0_#00c896]"
                    : issues.length
                      ? "bg-gold/5 shadow-[inset_3px_0_0_#ffb000]"
                      : "hover:bg-surface-2/70";
                return (
                  <tr
                    key={load.id}
                    aria-selected={selected}
                    onClick={() => m.selectLoad(load.id)}
                    className={`cursor-pointer transition-colors ${tone} ${selected ? "outline-1 -outline-offset-1 outline-cyan-bright/70" : ""}`}
                  >
                    <td className="whitespace-nowrap border-b border-line/40 px-2.5 py-2.5">
                      <span className="block text-[13px] font-bold text-ink">{load.referenceNumber}</span>
                      <span className="mt-0.5 flex min-h-3.5 items-center gap-1 text-[10px] font-semibold uppercase tracking-wide">
                        {shortlisted && (
                          <span className="flex items-center gap-0.5 text-success">
                            <Check className="size-3" aria-hidden="true" /> Shortlisted
                          </span>
                        )}
                        {issues.length > 0 && (
                          <span className="flex items-center gap-0.5 text-gold-bright">
                            <AlertTriangle className="size-3" aria-hidden="true" /> Issue found
                          </span>
                        )}
                        {viewed && !shortlisted && issues.length === 0 && <span className="rounded bg-surface-2 px-1 text-ink-dim">Viewed</span>}
                      </span>
                    </td>
                    <td className="whitespace-nowrap border-b border-line/40 px-2.5 py-2.5 text-ink">{formatLocation(load.originLocationId)}</td>
                    <td className="whitespace-nowrap border-b border-line/40 px-2.5 py-2.5 text-ink">{formatLocation(load.destinationLocationId)}</td>
                    <td className="border-b border-line/40 px-2.5 py-2.5">
                      <span className="whitespace-nowrap rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-[11px] text-ink">{load.equipmentType}</span>
                    </td>
                    <td className="whitespace-nowrap border-b border-line/40 px-2.5 py-2.5 font-semibold tabular-nums text-ink">{load.weight.toLocaleString("en-US")} lbs</td>
                    <td className="whitespace-nowrap border-b border-line/40 px-2.5 py-2.5 font-semibold tabular-nums text-ink">{load.loadedMiles.toLocaleString("en-US")} mi</td>
                    <td className="whitespace-nowrap border-b border-line/40 px-2.5 py-2.5 text-[15px] font-extrabold tabular-nums text-success">{formatCurrency(load.rate)}</td>
                    <td className="whitespace-nowrap border-b border-line/40 px-2.5 py-2.5 text-ink">
                      <span className="block font-semibold">{formatSimDay(load.pickupWindow.start)}</span>
                      <span className="block text-[11px] text-ink-dim">{formatSimClock(load.pickupWindow.start)}</span>
                    </td>
                    <td className="border-b border-line/40 px-2.5 py-2.5">
                      <GameButton
                        size="sm"
                        variant={selected ? "primary" : "ghost"}
                        className="px-2.5! py-1!"
                        aria-label={`View ${load.referenceNumber}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          m.selectLoad(load.id);
                        }}
                      >
                        View <ArrowRight className="size-3" aria-hidden="true" />
                      </GameButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {results.length === 0 && (
          <div className="m-3 rounded-xl border border-dashed border-line p-6 text-center text-sm text-ink-dim">
            No loads match these filters.{" "}
            <button type="button" onClick={onReset} className="text-cyan-bright hover:underline">
              Reset Filters
            </button>
          </div>
        )}
      </section>
    </TaskHighlight>
  );
}
