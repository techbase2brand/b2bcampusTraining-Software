"use client";

import { getDispatches } from "@/lib/dispatchRecords";
import { describeDispatch } from "@/lib/dispatchView";
import { formatCurrency } from "@/lib/text";
import StatusBadge from "@/components/dashboard/StatusBadge";

const GROUPS = [
  { id: "active", title: "Active", match: (r) => !r.completed && r.category !== "pending" },
  { id: "pending", title: "Pending", match: (r) => !r.completed && r.category === "pending" },
  { id: "completed", title: "Completed", match: (r) => r.completed },
];

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "-");

// Dispatches grouped Active / Pending / Completed (newest first). `onOpen(route)` receives the
// dispatch's resume route; `currentSlug` marks the one being viewed. Used by the switcher drawer and
// the Dispatches hub, so both always show the same thing.
export default function DispatchList({ state, onOpen, currentSlug = null, detailed = false }) {
  const records = [...getDispatches(state)].sort((a, b) => b.sequenceNumber - a.sequenceNumber).map(describeDispatch);
  if (records.length === 0) return <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-sm text-ink-dim">No dispatches yet. Start one from the Load Board.</p>;

  return (
    <div className="space-y-4">
      {GROUPS.map((g) => {
        const rows = records.filter(g.match);
        if (rows.length === 0) return null;
        return (
          <section key={g.id} aria-label={`${g.title} dispatches`}>
            <h3 className="label-xs flex items-center justify-between">
              {g.title} <span className="tabular-nums">{rows.length}</span>
            </h3>
            <ul className="mt-1.5 space-y-1.5">
              {rows.map((r) => (
                <li key={r.slug} className={`rounded-xl border p-2.5 ${r.slug === currentSlug ? "border-cyan-bright bg-cyan/10" : "border-line bg-navy-900/60"}`}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="text-sm font-extrabold text-ink">{r.label}</p>
                    <StatusBadge statusId={r.statusId} label={r.statusLabel} />
                    <span className="text-[11px] text-ink-dim">{r.stageLabel}</span>
                    <button
                      type="button"
                      onClick={() => onOpen(r.resumeRoute)}
                      className="ml-auto rounded-md border border-cyan/40 bg-cyan/10 px-2.5 py-1 text-[11px] font-bold text-cyan-bright transition-colors hover:bg-cyan/20"
                    >
                      {r.completed ? "View" : r.slug === currentSlug ? "Open" : "Resume"}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-ink">
                    {r.reference ? `${r.reference} · ${r.route}` : `${r.shortlistCount} loads shortlisted`}
                  </p>
                  <p className="text-[11px] text-ink-dim">
                    {r.driverName ? `${r.driverName} / ${r.truckId}` : "No driver yet"}
                    {r.agreedRate != null && <> · <span className="font-semibold text-success">{formatCurrency(r.agreedRate)}</span></>}
                    {detailed && <> · Updated {fmtDate(r.updatedAt)}{r.completedAt && <> · Completed {fmtDate(r.completedAt)}</>}</>}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
