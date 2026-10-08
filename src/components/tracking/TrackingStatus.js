"use client";

import { formatLocation } from "@/lib/loadSelectors";

const HEALTH_TONE = {
  "ON TRACK": "bg-success/15 text-success",
  "AT RISK": "bg-gold/15 text-gold-bright",
  DELAYED: "bg-danger/15 text-danger",
};

function Stat({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="label-xs">{label}</dt>
      <dd className="truncate text-sm font-bold text-ink">{children}</dd>
    </div>
  );
}

// Compact shipment header: load, lane, status, ETA, health and driver. All values come from the
// simulation snapshot (lib/trackingEngine.js); nothing is computed here.
export default function TrackingStatus({ m }) {
  const { load, snap, entry } = m;
  return (
    <section aria-label="Shipment status" className="panel flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5">
      <div className="min-w-0">
        <p className="text-base font-extrabold text-ink">{load.referenceNumber}</p>
        <p className="truncate text-xs text-ink-dim">
          {formatLocation(load.originLocationId)} → {formatLocation(load.destinationLocationId)}
        </p>
      </div>
      <span className="rounded-full bg-blue/25 px-3 py-1 text-xs font-bold tracking-wide text-cyan-bright">{snap.status}</span>
      <dl className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-1">
        <Stat label={`ETA (${snap.target})`}>{m.run.started ? m.fmt(snap.etaTarget) : "-"}</Stat>
        <Stat label="Health">
          <span className={`rounded-full px-2 py-0.5 text-xs ${HEALTH_TONE[snap.health]}`}>{snap.health}</span>
        </Stat>
        <Stat label="Driver">{entry.driver.name}</Stat>
      </dl>
    </section>
  );
}
