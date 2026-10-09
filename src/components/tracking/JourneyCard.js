"use client";

import { Truck, Check, Flag, MapPin } from "lucide-react";
import { getJourney, getStatusSteps, PHASES } from "@/lib/trackingJourney";

function Tile({ label, children, wide = false }) {
  return (
    <div className={`min-w-0 rounded-xl bg-navy-900/60 px-3 py-2 ${wide ? "col-span-2" : ""}`}>
      <dt className="label-xs">{label}</dt>
      <dd className="mt-0.5 truncate text-base font-bold tabular-nums text-ink">{children}</dd>
    </div>
  );
}

const city = (l) => `${l.city}, ${l.state}`;

// The main tracking visual: the shipment journey. A track from where the truck starts, through the
// pickup, to the delivery, with the truck on it. Before the pickup is done it shows both legs
// (driver to pickup, then the loaded route); afterwards only the loaded route. Every number is the
// tracker's own (lib/trackingJourney.js reshapes it, nothing is recalculated).
export default function JourneyCard({ m }) {
  const { tl, snap, t, run } = m;
  const j = getJourney({ tl, snap });
  const phase = PHASES[j.phase];
  const steps = getStatusSteps(snap);
  const arrived = j.phase === "arrived";
  const startLabel = j.showDeadhead ? city(tl.driverLoc) : city(tl.pickupLoc);
  const startTag = j.showDeadhead ? "DRIVER" : "PICKUP";

  return (
    <section aria-label="Shipment journey" className="glass-strong rounded-2xl p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label-xs text-cyan-bright">{phase.title}</p>
          <p className={`text-xl font-extrabold uppercase tracking-wide ${arrived ? "text-success" : "text-ink"}`}>
            {arrived && <Check className="mr-1.5 inline size-5 align-[-2px]" aria-hidden="true" />}
            {snap.status}
          </p>
        </div>
        <div className="text-right">
          <p className="label-xs">Trip progress</p>
          <p className="text-3xl font-extrabold leading-none tabular-nums text-ink">{j.tripPercent}%</p>
        </div>
      </div>

      {/* Route track */}
      <div className="mt-5 px-2">
        <div className="relative h-16">
          <div className="absolute inset-x-0 top-[1.4rem] h-2.5 overflow-hidden rounded-full bg-navy-800">
            {j.showDeadhead && <div className="absolute inset-y-0 left-0 border-r border-navy-950 bg-gold/15" style={{ width: `${j.split}%` }} />}
            <div className={`absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-cyan to-blue shadow-[0_0_12px_rgb(37_217_255/0.55)] transition-[width] duration-1000 ease-linear ${m.clock?.moving ? "route-sheen" : ""}`} style={{ width: `${j.truckAt}%` }} />
          </div>

          {/* endpoints */}
          <Stop left="0%" tone="bg-gold-bright" icon={j.showDeadhead ? Truck : MapPin} />
          {j.showDeadhead && <Stop left={`${j.split}%`} tone={j.pickupDone ? "bg-success" : "bg-cyan-bright"} icon={MapPin} />}
          <Stop left="100%" tone={arrived ? "bg-success" : "bg-danger"} icon={Flag} />

          {/* checkpoints */}
          {j.checkpoints.map((c) => (
            <span key={c.id} title={c.label} className={`absolute top-[1.55rem] size-1.5 -translate-x-1/2 rounded-full ${c.reached ? "bg-navy-950" : "bg-ink-dim/60"}`} style={{ left: `${c.at}%` }} />
          ))}

          {/* the truck */}
          <div className="absolute top-0 z-10 -translate-x-1/2 transition-[left] duration-1000 ease-linear" style={{ left: `${j.truckAt}%` }}>
            <span className={`grid size-9 place-items-center rounded-full border-2 border-navy-950 bg-gold-bright text-navy-950 shadow-[0_0_14px_rgb(255_201_40/0.5)] ${m.clock?.moving ? "status-pulse" : ""}`}>
              <Truck className="size-5" aria-hidden="true" />
            </span>
          </div>
        </div>

        <div className="relative -mt-1 flex justify-between gap-2 text-xs">
          <div className="min-w-0 max-w-[30%]">
            <p className="font-bold text-ink">{startLabel}</p>
            <p className="text-ink-dim">{startTag}</p>
          </div>
          {j.showDeadhead && (
            <div className="absolute -translate-x-1/2 text-center" style={{ left: `${j.split}%` }}>
              <p className="whitespace-nowrap font-bold text-ink">{city(tl.pickupLoc)}</p>
              <p className="text-ink-dim">PICKUP</p>
            </div>
          )}
          <div className="min-w-0 max-w-[30%] text-right">
            <p className="font-bold text-ink">{city(tl.destLoc)}</p>
            <p className="text-ink-dim">DELIVERY</p>
          </div>
        </div>
      </div>

      {/* The two legs */}
      <dl className="mt-4 grid gap-2 sm:grid-cols-2">
        <Leg title="Driver to pickup" tag="Deadhead" miles={j.deadhead} done={j.pickupDone || j.phase === "at-pickup"} active={j.phase === "to-pickup"} />
        <Leg title="Pickup to delivery" tag="Loaded route" miles={j.loaded} done={arrived} active={j.phase === "loaded"} />
      </dl>

      {/* Live numbers */}
      <dl className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Tile label="Miles completed">{j.completed.toLocaleString("en-US")} mi</Tile>
        <Tile label="Miles remaining">{j.remaining.toLocaleString("en-US")} mi</Tile>
        <Tile label={`ETA (${snap.target})`}>{run.started || t.step > 0 ? m.fmt(snap.etaTarget) : "-"}</Tile>
        <Tile label="Last update">{m.fmt(snap.time)}</Tile>
        <Tile label="Current location" wide>
          {snap.location}
        </Tile>
      </dl>

      {/* Shipment status stepper */}
      <ol aria-label="Shipment status" className="mt-4 flex flex-wrap gap-x-1 gap-y-1.5 border-t border-line/60 pt-3">
        {steps.map((s) => (
          <li
            key={s.id}
            aria-current={s.state === "current" ? "step" : undefined}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              s.state === "done" ? "text-success" : s.state === "current" ? "bg-cyan/15 text-cyan-bright" : "text-ink-dim/70"
            }`}
          >
            <span aria-hidden="true">{s.state === "done" ? <Check className="size-3.5" /> : s.state === "current" ? "→" : "○"}</span>
            <span className="sr-only">{s.state === "done" ? "Done: " : s.state === "current" ? "Current: " : "Upcoming: "}</span>
            {s.label}
          </li>
        ))}
      </ol>
    </section>
  );
}

function Stop({ left, tone, icon: Icon }) {
  return (
    <span className={`absolute top-[1.1rem] z-0 grid size-4 -translate-x-1/2 place-items-center rounded-full border-2 border-navy-900 ${tone}`} style={{ left }}>
      <Icon className="size-2.5 text-navy-950" aria-hidden="true" />
    </span>
  );
}

function Leg({ title, tag, miles, done, active }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl app-border px-3 py-2 ${active ? "app-border-active bg-cyan/5" : done ? "app-border-success bg-success/5" : "app-border-subtle bg-navy-900/40"}`}>
      <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs ${done ? "bg-success text-navy-950" : active ? "bg-cyan-bright text-navy-950" : "bg-surface-2 text-ink-dim"}`}>{done ? <Check className="size-3.5" aria-label="Done" /> : active ? "→" : "○"}</span>
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-wide text-ink-dim">
          {title} <span className="normal-case text-ink-dim/80">({tag})</span>
        </dt>
        <dd className="text-base font-bold tabular-nums text-ink">{miles.toLocaleString("en-US")} mi</dd>
      </div>
    </div>
  );
}
