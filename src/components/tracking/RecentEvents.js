"use client";

import { getRecentEvents } from "@/lib/trackingJourney";

// The last few shipment events, oldest first, as a compact timeline. The full log opens in a drawer.
export default function RecentEvents({ m, onOpenAll }) {
  const events = getRecentEvents(m.t, 5);
  return (
    <section aria-label="Recent events" className="panel p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink">Shipment timeline</h2>
        <button type="button" onClick={onOpenAll} className="rounded-lg app-border px-2.5 py-1 text-xs font-semibold text-ink transition-colors hover:border-cyan hover:text-cyan-bright">
          View Full Activity
        </button>
      </div>
      {events.length === 0 ? (
        <p className="mt-3 text-sm text-ink-dim">{m.run.started ? "Events appear here as the shipment moves." : "Start the mission to begin the shipment timeline."}</p>
      ) : (
        <ol className="mt-3 space-y-2.5 border-l border-line/70 pl-4">
          {events.map((e, i) => (
            <li key={e.id} className="relative">
              <span className={`absolute -left-[1.4rem] top-1 size-2.5 rounded-full border-2 border-navy-900 ${i === events.length - 1 ? "bg-cyan-bright" : "bg-ink-dim"}`} aria-hidden="true" />
              <p className="text-xs font-semibold tabular-nums text-ink-dim">{m.fmt(new Date(e.timestamp))}</p>
              <p className="text-sm leading-snug text-ink">{e.message}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
