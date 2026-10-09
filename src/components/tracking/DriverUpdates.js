"use client";

import { MessageSquareQuote } from "lucide-react";

// The driver's latest automatic update (not a check call: the driver reports on their own at trip
// start, at the configured progress points, on a delay and on arrival). The full list is in a drawer.
export default function DriverUpdates({ m, onOpenHistory }) {
  const u = m.latestUpdate;
  return (
    <section aria-label="Driver updates" className="panel p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-extrabold uppercase tracking-wide text-ink">
          <MessageSquareQuote className="size-4 text-cyan-bright" aria-hidden="true" /> Driver update
        </h2>
        {u && <span className="text-xs font-semibold tabular-nums text-ink-dim">{m.fmt(new Date(u.timestamp))}</span>}
      </div>
      {u ? (
        <>
          <p className="mt-2 text-sm font-bold text-ink">{m.entry.driver.name}</p>
          <p className="mt-0.5 text-base leading-snug text-ink">&ldquo;{u.text.replace(/^Driver update:\s*/, "")}&rdquo;</p>
        </>
      ) : (
        <p className="mt-2 text-sm text-ink-dim">{m.run.started ? "The driver will report once the trip starts." : "Start the mission to begin tracking."}</p>
      )}
      <button type="button" onClick={onOpenHistory} className="mt-3 rounded-lg app-border px-2.5 py-1 text-xs font-semibold text-ink transition-colors hover:border-cyan hover:text-cyan-bright">
        View Update History{m.updates.length > 0 ? ` (${m.updates.length})` : ""}
      </button>
    </section>
  );
}
