"use client";

import { Info, AlertTriangle, OctagonAlert, CheckCircle2, Circle } from "lucide-react";
import { formatCurrency } from "@/lib/text";
import { formatLocation } from "@/lib/loadSelectors";

const TONE = {
  info: { box: "border-cyan/30 bg-cyan/5", icon: Info, color: "text-cyan-bright" },
  warn: { box: "border-gold/40 bg-gold/10", icon: AlertTriangle, color: "text-gold-bright" },
  danger: { box: "border-danger/40 bg-danger/10", icon: OctagonAlert, color: "text-danger" },
};

// Operational alerts derived from the simulation state (never random, never from the future).
export function AlertsPanel({ m }) {
  const alerts = m.alerts;
  return (
    <section aria-label="Alerts" className="panel p-3">
      <h2 className="flex items-center justify-between text-sm font-extrabold text-ink">
        Alerts
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${alerts.length ? "bg-gold/15 text-gold-bright" : "bg-surface-2 text-ink-dim"}`}>{alerts.length}</span>
      </h2>
      <ul className="mt-2 space-y-1.5" aria-live="polite">
        {alerts.map((a) => {
          const tone = TONE[a.tone];
          return (
            <li key={a.id} className={`flex gap-2 rounded-lg border px-2.5 py-1.5 ${tone.box}`}>
              <tone.icon className={`mt-0.5 size-3.5 shrink-0 ${tone.color}`} aria-hidden="true" />
              <div className="min-w-0">
                <p className={`text-[11px] font-bold ${tone.color}`}>{a.title}</p>
                <p className="text-[11px] leading-snug text-ink">{a.text}</p>
              </div>
            </li>
          );
        })}
        {alerts.length === 0 && <li className="rounded-lg border border-dashed border-line p-3 text-center text-xs text-ink-dim">{m.run.started ? "No active alerts." : "Alerts appear once monitoring starts."}</li>}
      </ul>
    </section>
  );
}

function Fact({ label, children, wide = false }) {
  return (
    <div className={`min-w-0 ${wide ? "col-span-2" : ""}`}>
      <dt className="label-xs">{label}</dt>
      <dd className="truncate text-xs font-semibold text-ink">{children}</dd>
    </div>
  );
}

// Duty status shown for the driver at each point of the trip.
const DUTY = { "en-route-pickup": "Driving", "in-transit": "Driving", monitoring: "Driving", loading: "On Duty (loading)", "arrived-pickup": "On Duty", "picked-up": "On Duty", "ready-for-pickup": "On Duty", "arrived-delivery": "On Duty" };

// Load facts and the driver's live status (remaining HOS reduces as the trip progresses).
export function LoadDriverStatus({ m }) {
  const { load, broker, entry, snap, agreedRate, t } = m;
  const last = t.checkCalls.at(-1);
  return (
    <div className="space-y-3">
      <section aria-label="Load details" className="panel p-3">
        <h2 className="flex items-center justify-between text-sm font-extrabold text-ink">
          Load Details
          <span className="rounded-full bg-blue/25 px-2 py-0.5 text-[10px] font-bold text-cyan-bright">{snap.status}</span>
        </h2>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
          <Fact label="Load ID">{load.referenceNumber}</Fact>
          <Fact label="Broker">{broker.name}</Fact>
          <Fact label="Driver">{entry.driver.name}</Fact>
          <Fact label="Truck">{entry.truck.id}</Fact>
          <Fact label="Origin" wide>
            {formatLocation(load.originLocationId)}
          </Fact>
          <Fact label="Destination" wide>
            {formatLocation(load.destinationLocationId)}
          </Fact>
          <Fact label="Pickup" wide>
            {m.fmt(new Date(load.pickupWindow.start))} - {m.fmt(new Date(load.pickupWindow.end))}
          </Fact>
          <Fact label="Delivery" wide>
            {m.fmt(new Date(load.deliveryWindow.start))} - {m.fmt(new Date(load.deliveryWindow.end))}
          </Fact>
          <Fact label="Equipment">{load.equipmentType}</Fact>
          <Fact label="Weight">{load.weight.toLocaleString("en-US")} lbs</Fact>
          <Fact label="Agreed rate">{formatCurrency(agreedRate)}</Fact>
          <Fact label="Loaded miles">{load.loadedMiles.toLocaleString("en-US")} mi</Fact>
          <Fact label="ETA" wide>
            {m.fmt(snap.etaDelivery)}
          </Fact>
        </dl>
      </section>

      <section aria-label="Driver status" className="panel p-3">
        <h2 className="text-sm font-extrabold text-ink">Driver Status</h2>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
          <Fact label="Driver">{entry.driver.name}</Fact>
          <Fact label="Duty status">{DUTY[snap.statusId]}</Fact>
          <Fact label="Location" wide>
            {snap.location}
          </Fact>
          <Fact label="Remaining HOS">{m.hos}</Fact>
          <Fact label="Truck">{entry.truck.id}</Fact>
          <Fact label="Current ETA" wide>
            {m.fmt(snap.etaTarget)} ({snap.target})
          </Fact>
          <Fact label="Last check call" wide>
            {last ? `${m.fmt(new Date(last.timestamp))} · ${last.location}` : "None yet"}
          </Fact>
        </dl>
      </section>
    </div>
  );
}

// Bottom row: activity log, check-call log and the mission tasks.
export function ActivityLog({ m }) {
  const rows = [...m.t.activity].reverse();
  return (
    <section aria-label="Activity log" className="panel p-3">
      <h2 className="text-sm font-extrabold text-ink">Activity Log</h2>
      <ul className="mt-2 space-y-1.5">
        {rows.map((a) => (
          <li key={a.id} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2 text-[11px] leading-snug">
            <span className="tabular-nums text-ink-dim">{m.fmt(new Date(a.timestamp))}</span>
            <span className="text-ink">{a.message}</span>
          </li>
        ))}
        {rows.length === 0 && <li className="text-xs text-ink-dim">Events appear here once the mission starts.</li>}
      </ul>
    </section>
  );
}

export function CheckCallLog({ m }) {
  const rows = [...m.t.checkCalls].reverse();
  return (
    <section aria-label="Check call log" className="panel p-3">
      <h2 className="flex items-center justify-between text-sm font-extrabold text-ink">
        Check Calls
        <span className="rounded-full bg-cyan/15 px-2 py-0.5 text-[10px] font-bold text-cyan-bright">{rows.length}</span>
      </h2>
      <ul className="mt-2 space-y-1.5">
        {rows.map((c) => (
          <li key={c.id} className="rounded-lg border border-line/60 bg-navy-900/50 px-2.5 py-1.5 text-[11px] leading-snug">
            <p className="font-semibold text-ink">
              {m.fmt(new Date(c.timestamp))} · {c.status}
            </p>
            <p className="text-ink-dim">
              {c.location} · ETA {m.fmt(new Date(c.eta))}
            </p>
            <p className="text-ink-dim">
              Issue: {c.issue} · {c.notes} ({c.channel})
            </p>
          </li>
        ))}
        {rows.length === 0 && <li className="text-xs text-ink-dim">No check calls yet. Ask the driver for a status update.</li>}
      </ul>
    </section>
  );
}

export function TaskList({ m }) {
  const { mission, run } = m;
  return (
    <section aria-label="Mission tasks" className="panel p-3">
      <h2 className="flex items-center justify-between text-sm font-extrabold text-ink">
        Mission Tasks
        <span className="text-[10px] font-semibold text-ink-dim">
          {run.completedTasks.length} / {mission.tasks.length}
        </span>
      </h2>
      <ol className="mt-2 space-y-1">
        {mission.tasks.map((task, i) => {
          const done = run.completedTasks.includes(task.id);
          const current = run.started && !run.completed && i === run.currentTask;
          return (
            <li key={task.id} aria-current={current ? "step" : undefined} className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs ${current ? "bg-cyan/10 font-semibold text-ink" : done ? "text-success" : "text-ink-dim"}`}>
              {done ? <CheckCircle2 className="size-3.5 shrink-0" aria-label="Done" /> : <Circle className="size-3.5 shrink-0" aria-label={current ? "Current" : "Pending"} />}
              {task.title}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
