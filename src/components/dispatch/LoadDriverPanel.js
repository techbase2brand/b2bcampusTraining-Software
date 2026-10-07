"use client";

import { Check, X, Clock } from "lucide-react";
import { suitabilityChecks } from "@/data/dispatchComms";
import { getRosterEntry, displayStatus } from "@/lib/dispatchRoster";
import { getHosReview } from "@/lib/dispatchActions";
import { formatCurrency, formatDuration } from "@/lib/text";
import GameButton from "@/components/game/GameButton";
import TaskHighlight from "@/components/dispatcher/TaskHighlight";
import TruckThumb from "@/components/dispatcher/TruckThumb";
import BrokerAvatar from "@/components/brokers/BrokerAvatar";
import DriverRoutePreview from "./DriverRoutePreview";

function Fact({ label, children, sub, wide = false }) {
  return (
    <div className={`min-w-0 ${wide ? "col-span-2" : ""}`}>
      <dt className="label-xs">{label}</dt>
      <dd className="truncate text-xs font-semibold text-ink">{children}</dd>
      {sub && <dd className="truncate text-[10px] text-ink-dim">{sub}</dd>}
    </div>
  );
}

// The negotiated load carried forward from Mission 4: posted vs agreed rate, with a review button.
export function NegotiatedLoadCard({ m, highlight }) {
  const { load, broker, agreedRate, postedRate } = m.neg;
  const v = m.vars;
  const { run, d } = m;
  const better = agreedRate !== postedRate;

  return (
    <section aria-label="Negotiated load" className="panel overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-line/70 bg-linear-to-r from-blue/15 to-transparent px-3 py-2">
        <h2 className="text-sm font-extrabold text-ink">Negotiated Load ({v.ref})</h2>
        <span className="shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-success">{m.statusLabel}</span>
      </div>

      <div className="flex items-center gap-2.5 px-3 pt-2.5">
        <TruckThumb className="h-12 w-[4.5rem] shrink-0 rounded-md" />
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold text-ink">
            {v.origin} → {v.destination}
          </p>
          <p className="text-xl font-extrabold leading-tight tabular-nums text-success">{formatCurrency(agreedRate)}</p>
          <p className="text-[10px] text-ink-dim">
            {better ? `Agreed rate · posted ${formatCurrency(postedRate)}` : "Agreed rate"} · {load.loadedMiles.toLocaleString("en-US")} mi
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 px-3 py-2.5">
        <Fact label="Pickup" sub={`${v.pickupTime} - ${v.pickupEnd}`}>
          {v.pickupDay}, {v.origin}
        </Fact>
        <Fact label="Delivery" sub={`${v.deliveryTime} - ${v.deliveryEnd}`}>
          {v.deliveryDay}, {v.destination}
        </Fact>
        <Fact label="Equipment">{v.equipment}</Fact>
        <Fact label="Weight">{v.weight} lbs</Fact>
        <Fact label="Commodity">{v.commodity}</Fact>
        <Fact label="Appointment">{v.appointment}</Fact>
        <Fact label="Broker">{broker.name}</Fact>
        <Fact label="Requirements">{load.specialRequirements.length ? load.specialRequirements.join(", ") : "None listed"}</Fact>
      </dl>

      <div className="border-t border-line/60 px-3 py-2">
        <TaskHighlight active={highlight === "load-review"}>
          {d.loadReviewed ? (
            <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-success">
              <Check className="size-4" aria-hidden="true" /> Load reviewed
            </p>
          ) : (
            <GameButton variant="ghost" size="sm" className="w-full" disabled={!run.started} onClick={m.reviewLoad}>
              Mark Load Reviewed
            </GameButton>
          )}
        </TaskHighlight>
        {!d.loadReviewed && !run.started && <p className="mt-1 text-center text-[10px] text-ink-dim">Start the mission first.</p>}
      </div>
    </section>
  );
}

function CheckRow({ m, entry, check, revealed, highlight }) {
  const meta = suitabilityChecks.find((c) => c.code === check.code);
  const active = (check.code === "hos" && highlight === "check-hos") || (check.code === "pickup" && highlight === "check-pickup");
  return (
    <li className="rounded-lg border border-line/60 bg-navy-900/60 px-2 py-1.5">
      <div className="flex items-center gap-2">
        <span className={`grid size-4 shrink-0 place-items-center rounded-full ${revealed ? (check.passed ? "bg-success text-navy-950" : "bg-danger text-white") : "bg-surface-2 text-ink-dim"}`}>
          {revealed ? check.passed ? <Check className="size-3" aria-label="Passed" /> : <X className="size-3" aria-label="Failed" /> : <Clock className="size-2.5" aria-label="Not checked" />}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink">{meta.label}</span>
        {!revealed && (
          <TaskHighlight active={active}>
            <button type="button" disabled={!m.run.started} onClick={() => m.revealChecks(entry.id, [check.code])} className="rounded-md border border-cyan/40 bg-cyan/10 px-2 py-0.5 text-[10px] font-bold text-cyan-bright transition-colors hover:bg-cyan/20 disabled:opacity-40">
              Check
            </button>
          </TaskHighlight>
        )}
      </div>
      {revealed && <p className="mt-1 text-[11px] leading-snug text-ink-dim">{check.message}</p>}
    </li>
  );
}

// The driver being reviewed: profile, student-run suitability checks (nothing is pre-revealed),
// HOS review and the Select action. Selecting an unsuitable driver explains why it fails.
export function DriverDetails({ m, highlight }) {
  const entry = m.viewDriverId ? getRosterEntry(m.viewDriverId) : null;
  if (!entry) {
    return (
      <section aria-label="Driver details" className="panel p-4 text-center">
        <p className="text-sm font-semibold text-ink">No driver open</p>
        <p className="mt-1 text-xs text-ink-dim">{m.run.started ? "Pick a driver from the list to review their details." : "Start the mission to review drivers."}</p>
      </section>
    );
  }

  const verdict = m.verdictFor(entry);
  const shown = m.d.driverChecks[entry.id] ?? [];
  const selected = m.d.selectedDriverId === entry.id;
  const hosRevealed = shown.includes("hos") || shown.includes("pickup");
  const hos = hosRevealed && selected ? getHosReview(m.neg, entry) : null;
  const locked = m.d.dispatchSent && !selected;

  return (
    <section aria-label="Driver details" className="panel overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-line/70 px-3 py-2.5">
        <BrokerAvatar broker={entry.driver} className="size-10 text-sm" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-extrabold text-ink">{entry.driver.name}</h2>
          <p className="truncate text-[11px] text-ink-dim">
            {entry.truck.id} · {entry.truck.equipment} · {entry.driver.location}
          </p>
        </div>
        {selected && <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">SELECTED</span>}
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 px-3 py-2.5">
        <Fact label="Duty status">{entry.driver.dutyStatus}</Fact>
        <Fact label="Availability">{displayStatus(entry)}</Fact>
        <Fact label="Remaining HOS">{formatDuration(entry.driver.hosMinutes)}</Fact>
        <Fact label="Max payload">{entry.truck.maxWeightLbs.toLocaleString("en-US")} lbs</Fact>
      </dl>

      <div className="border-t border-line/60 px-3 py-2">
        <div className="flex items-center justify-between">
          <p className="label-xs">Suitability checks</p>
          <button
            type="button"
            disabled={!m.run.started || shown.length >= suitabilityChecks.length}
            onClick={() => m.revealChecks(entry.id, suitabilityChecks.map((c) => c.code))}
            className="text-[10px] font-bold text-cyan-bright underline-offset-2 hover:underline disabled:opacity-40"
          >
            Check all
          </button>
        </div>
        <ul className="mt-1.5 space-y-1">
          {verdict.checks.map((c) => (
            <CheckRow key={c.code} m={m} entry={entry} check={c} revealed={shown.includes(c.code)} highlight={highlight} />
          ))}
        </ul>

        {hos && (
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-lg border border-cyan/25 bg-cyan/5 px-2.5 py-2" aria-label="HOS review">
            <Fact label="HOS left">{hos.remaining}</Fact>
            <Fact label="Drive to pickup">{hos.driveTime}</Fact>
            <Fact label="Arrives">{hos.arrival}</Fact>
            <Fact label="Window ends">{hos.windowEnd}</Fact>
            <Fact label={hos.marginNegative ? "HOS short by" : "HOS spare"} wide>
              <span className={hos.marginNegative ? "text-danger" : "text-success"}>{hos.margin}</span>
            </Fact>
          </dl>
        )}

        <GameButton className="mt-2.5 w-full" size="sm" disabled={!m.run.started || selected || locked} onClick={() => m.selectDriver(entry.id)}>
          {selected ? "Driver Selected" : "Select This Driver"}
        </GameButton>
      </div>
    </section>
  );
}

// Right column body: negotiated load, driver details and the route preview.
export default function LoadDriverPanel({ m, highlight }) {
  const entry = m.viewDriverId ? getRosterEntry(m.viewDriverId) : null;
  return (
    <div className="space-y-3">
      <NegotiatedLoadCard m={m} highlight={highlight} />
      <DriverDetails m={m} highlight={highlight} />
      <DriverRoutePreview load={m.neg.load} entry={entry} />
    </div>
  );
}
