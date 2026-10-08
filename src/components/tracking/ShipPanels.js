"use client";

import { Truck, Clock } from "lucide-react";
import GameButton from "@/components/game/GameButton";
import TaskHighlight from "@/components/dispatcher/TaskHighlight";
import TruckThumb from "@/components/dispatcher/TruckThumb";
import { formatLocation } from "@/lib/loadSelectors";

const HEALTH = {
  "ON TRACK": "border-success/50 bg-success/10 text-success",
  "AT RISK": "border-gold/50 bg-gold/10 text-gold-bright",
  DELAYED: "border-danger/50 bg-danger/10 text-danger",
};
const ETA_TONE = { "ON TIME": "text-success", "AT RISK": "text-gold-bright", LATE: "text-danger" };
const ETA_BOX = {
  "ON TIME": "border-success/40 bg-success/10 text-success",
  "AT RISK": "border-gold/40 bg-gold/10 text-gold-bright",
  LATE: "border-danger/40 bg-danger/10 text-danger",
};

// Left panel: every active shipment (one today; the list supports several).
export function ActiveShipments({ m }) {
  return (
    <section aria-label="Active shipments" className="panel p-3">
      <h2 className="flex items-center justify-between text-sm font-extrabold text-ink">
        Active Shipments
        <span className="rounded-full bg-cyan/15 px-2 py-0.5 text-[10px] font-bold text-cyan-bright">{m.shipments.length}</span>
      </h2>
      <ul className="mt-2.5 space-y-2">
        {m.shipments.map((s) => (
          <li key={s.loadId} className="rounded-xl border border-cyan-bright/60 bg-cyan/5 p-2.5">
            <div className="flex items-center gap-2">
              <TruckThumb className="h-9 w-14 shrink-0 rounded-md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-ink">{s.load.referenceNumber}</p>
                <p className="truncate text-[11px] text-ink-dim">
                  {s.entry.driver.name} · {s.entry.truck.id}
                </p>
              </div>
            </div>
            <p className="mt-2 truncate text-[11px] text-ink">
              {formatLocation(s.load.originLocationId)} → {formatLocation(s.load.destinationLocationId)}
            </p>
            <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px]">
              <span className="rounded-full bg-blue/25 px-2 py-0.5 font-bold text-cyan-bright">{s.status}</span>
              <span className="flex items-center gap-1 text-ink-dim">
                <Clock className="size-3" aria-hidden="true" /> {m.run.started ? s.eta : "-"}
              </span>
            </div>
          </li>
        ))}
        {m.shipments.length === 0 && <li className="rounded-lg border border-dashed border-line p-4 text-center text-xs text-ink-dim">No active shipments.</li>}
      </ul>
    </section>
  );
}

function Fact({ label, children, tone = "text-ink" }) {
  return (
    <div className="min-w-0">
      <dt className="label-xs">{label}</dt>
      <dd className={`truncate text-xs font-semibold ${tone}`}>{children}</dd>
    </div>
  );
}

// ETA panel + shipment health. Every value is computed in lib/trackingEngine.js.
export function EtaHealthPanel({ m }) {
  const { snap, run, highlight, t } = m;
  return (
    <section aria-label="ETA and shipment health" className="panel p-3">
      <h2 className="text-sm font-extrabold text-ink">ETA</h2>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
        <Fact label="Location">{snap.location}</Fact>
        <Fact label="Remaining">{snap.remainingMiles} mi</Fact>
        <Fact label={`ETA (${snap.target})`} tone={ETA_TONE[snap.targetStatus]}>
          {m.fmt(snap.etaTarget)}
        </Fact>
        <Fact label="Appointment ends">{m.fmt(snap.windowEnd)}</Fact>
      </dl>
      <p className={`mt-2 rounded-md border px-2 py-1 text-center text-[11px] font-bold tracking-wide ${ETA_BOX[snap.targetStatus]}`}>{snap.targetStatus}</p>
      {t.flags.etaReviewed ? (
        <p className="mt-2 text-center text-[11px] font-semibold text-success">ETA acknowledged</p>
      ) : (
        <TaskHighlight active={highlight === "eta-review"} className="mt-2">
          <GameButton variant="ghost" size="sm" className="w-full" disabled={!run.started || t.step < 6} onClick={m.reviewEta}>
            Acknowledge ETA
          </GameButton>
        </TaskHighlight>
      )}

      <div className="mt-3 border-t border-line/60 pt-2.5" aria-label="Shipment health">
        <p className="label-xs">Shipment Health</p>
        <p className={`mt-1 flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-extrabold tracking-wide ${HEALTH[snap.health]}`}>
          <Truck className="size-3.5" aria-hidden="true" /> {snap.health}
        </p>
      </div>
    </section>
  );
}
