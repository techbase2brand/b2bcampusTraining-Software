"use client";

import { useState } from "react";
import { Check, Circle, ArrowRight, Send, AlertTriangle } from "lucide-react";
import { timelineRows, exceptionScript } from "@/data/phase7Missions";
import { fillTemplate } from "@/lib/text";
import GameButton from "@/components/game/GameButton";
import TaskHighlight from "@/components/dispatcher/TaskHighlight";

// Which timeline row a status belongs to (monitoring is part of In Transit).
const ROW_OF = { monitoring: "in-transit" };

// Shipment timeline: assigned and confirmed (from Phase 6), then each status as it happens.
export function ShipmentTimeline({ m }) {
  const { snap, tl, run } = m;
  const currentRow = ROW_OF[snap.statusId] ?? snap.statusId;
  const currentIdx = timelineRows.findIndex((r) => r.id === currentRow);
  return (
    <section aria-label="Shipment timeline" className="panel p-3">
      <h2 className="text-sm font-extrabold text-ink">Shipment Timeline</h2>
      <ol className="mt-2.5 grid gap-x-3 gap-y-1.5 sm:grid-cols-2 xl:grid-cols-3">
        {timelineRows.map((row, i) => {
          const done = i < currentIdx || (row.status === null && run.started) || (i === currentIdx && snap.statusId === "arrived-delivery");
          const current = i === currentIdx && !done;
          const at = row.status ? tl.steps.find((s) => (ROW_OF[s.status] ?? s.status) === row.id && s.index <= snap.step) : null;
          return (
            <li key={row.id} aria-current={current ? "step" : undefined} className={`flex items-center gap-2 rounded-lg app-border px-2 py-1.5 text-xs ${current ? "app-border-active bg-cyan/10" : done ? "app-border-success bg-success/5" : "app-border-subtle bg-navy-900/40"}`}>
              <span className={`grid size-5 shrink-0 place-items-center rounded-full ${done ? "bg-success text-navy-950" : current ? "bg-cyan-bright text-navy-950" : "bg-surface-2 text-ink-dim"}`}>
                {done ? <Check className="size-3" aria-label="Done" /> : current ? <ArrowRight className="size-3" aria-label="Current" /> : <Circle className="size-2.5" aria-label="Pending" />}
              </span>
              <span className={`min-w-0 flex-1 truncate font-semibold ${done || current ? "text-ink" : "text-ink-dim"}`}>{row.label}</span>
              {at && (done || current) && <span className="shrink-0 text-[11px] tabular-nums text-ink-dim">{m.fmt(at.time)}</span>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function CheckRow({ done, label, detail, children, active }) {
  return (
    <li className="flex items-center gap-2 rounded-lg app-border app-border-subtle bg-navy-900/50 px-2.5 py-1.5">
      <span className={`grid size-5 shrink-0 place-items-center rounded-full ${done ? "bg-success text-navy-950" : "bg-surface-2 text-ink-dim"}`}>{done ? <Check className="size-3" aria-label="Done" /> : <Circle className="size-2.5" aria-label="Pending" />}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-ink">{label}</p>
        {detail && <p className="truncate text-[11px] text-ink-dim">{detail}</p>}
      </div>
      {children && <TaskHighlight active={active}>{children}</TaskHighlight>}
    </li>
  );
}

// Pickup monitoring: the student verifies each pickup state as the shipment reaches it.
export function PickupMonitor({ m }) {
  const { t, snap, run, highlight } = m;
  const f = t.flags;
  const btn = (flag, minStep, label, extra = true) => (
    <GameButton size="sm" variant="ghost" disabled={!run.started || t.step < minStep || !extra} onClick={() => m.confirm(flag)}>
      {label}
    </GameButton>
  );
  return (
    <section aria-label="Pickup monitoring" className="panel p-3">
      <h2 className="text-sm font-extrabold text-ink">Pickup Monitoring</h2>
      <ul className="mt-2.5 space-y-1.5">
        <CheckRow done={f.departed} label="Driver departed" detail={t.step >= 1 ? `From ${tl0(m)}` : "Waiting for the trip to start"} active={highlight === "confirm-departed"}>
          {!f.departed && btn("departed", 1, "Confirm Departed")}
        </CheckRow>
        <CheckRow done={t.step >= 1} label="ETA to pickup" detail={t.step >= 1 ? m.fmt(snap.etaPickup) : "Shown once the driver is moving"} />
        <CheckRow done={f.arrived} label="Arrived at pickup" detail={t.step >= 3 ? "Driver is at the shipper" : "Not at the shipper yet"} active={highlight === "confirm-arrived"}>
          {!f.arrived && btn("arrived", 3, "Confirm Arrived")}
        </CheckRow>
        <CheckRow done={f.loading} label="Loading status" detail={t.step >= 4 ? "Loading in progress" : "Not loading yet"} active={highlight === "confirm-loading"}>
          {!f.loading && btn("loading", 4, "Confirm Loading")}
        </CheckRow>
        <CheckRow done={f.pickedUp} label="Pickup complete" detail={t.step >= 5 ? "Freight is on the truck" : "Pending"} active={highlight === "confirm-picked-up"}>
          {!f.pickedUp && btn("pickedUp", 5, "Confirm Pickup Complete", f.loading)}
        </CheckRow>
      </ul>
    </section>
  );
}

const tl0 = (m) => `${m.tl.driverLoc.city}, ${m.tl.driverLoc.state}`;

// Shown only once the delay has been reported: acknowledge, new ETA, appointment, record, broker.
export function ExceptionPanel({ m }) {
  const [draft, setDraft] = useState(null);
  const ex = m.exception;
  if (!ex) return null;
  const f = m.t.flags;
  const hl = m.highlight;
  const brokerDone = m.t.brokerUpdates.some((u) => u.valid && u.step >= ex.step);
  const brokerMsgs = m.t.messages.filter((x) => x.channel === "broker");
  const used = draft ?? m.brokerDraft;

  const step = (n, title, done, children, active) => (
    <li className={`rounded-lg app-border px-2.5 py-2 ${done ? "app-border-success bg-success/5" : "app-border-subtle bg-navy-900/50"}`}>
      <p className="flex items-center gap-2 text-xs font-bold text-ink">
        <span className={`grid size-5 place-items-center rounded-full text-[11px] ${done ? "bg-success text-navy-950" : "bg-surface-2 text-ink-dim"}`}>{done ? <Check className="size-3" aria-label="Done" /> : n}</span>
        {title}
      </p>
      <TaskHighlight active={active} className="mt-1.5">
        {children}
      </TaskHighlight>
    </li>
  );

  return (
    <section aria-label="Exception handling" className="panel app-border-warning p-3">
      <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-ink">
        <AlertTriangle className="size-4 text-gold-bright" aria-hidden="true" /> Delay Reported
        <span className="ml-auto rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-bold text-gold-bright">{ex.minutes} min · {ex.label}</span>
      </h2>
      <ol className="mt-2.5 space-y-1.5">
        {step(1, "Acknowledge the driver", f.ack, f.ack ? <p className="text-[11px] text-ink-dim">Driver acknowledged.</p> : (
          <GameButton size="sm" variant="ghost" onClick={() => m.send(fillTemplate(exceptionScript.ackText, { first: m.vars.first }), "chat")}>
            <Send className="size-3.5" aria-hidden="true" /> Send acknowledgement
          </GameButton>
        ), hl === "ex-ack")}

        {step(2, exceptionScript.etaTitle, f.etaSolved, (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={exceptionScript.etaTitle}>
            {m.etaOptions.map((o) => (
              <button key={o.id} type="button" disabled={!f.ack || f.etaSolved} onClick={() => m.chooseEta(o.id)} className={`rounded-lg app-border px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${f.etaSolved && o.correct ? "app-border-success bg-success/15 text-success" : " bg-surface-2 text-ink enabled:hover:border-cyan"}`}>
                {m.fmt(o.time)}
              </button>
            ))}
          </div>
        ), hl === "ex-eta")}

        {step(3, exceptionScript.apptTitle, f.apptSolved, (
          <>
            <p className="mb-1 text-[11px] text-ink-dim">
              Appointment window ends {m.fmt(m.snap.windowEnd)}.
            </p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={exceptionScript.apptTitle}>
              {exceptionScript.apptOptions.map((o) => (
                <button key={o.id} type="button" disabled={!f.etaSolved || f.apptSolved} onClick={() => m.chooseAppointment(o.id)} className="rounded-lg app-border bg-surface-2 px-2.5 py-1 text-xs font-semibold text-ink transition-colors enabled:hover:border-cyan disabled:opacity-50">
                  {o.label}
                </button>
              ))}
            </div>
          </>
        ), hl === "ex-appt")}

        {step(4, "Record the event", f.recorded, f.recorded ? <p className="text-[11px] text-ink-dim">Recorded in the shipment log.</p> : (
          <GameButton size="sm" variant="ghost" disabled={!(f.ack && f.etaSolved && f.apptSolved)} onClick={m.recordException}>
            Record in Shipment Log
          </GameButton>
        ), hl === "ex-record")}

        {step(5, "Update the broker", brokerDone, (
          <>
            {brokerMsgs.length > 0 && (
              <ul className="mb-1.5 space-y-1" aria-label="Broker thread">
                {brokerMsgs.map((x, i) => (
                  <li key={i} className={`rounded-md px-2 py-1 text-[11px] leading-snug ${x.from === "broker" ? "bg-surface-2 text-ink" : "bg-blue/25 text-ink"}`}>
                    <span className="font-bold">{x.from === "broker" ? m.broker.name : "You"}:</span> {x.text}
                  </li>
                ))}
              </ul>
            )}
            {!brokerDone && (
              <>
                <textarea value={used} onChange={(e) => setDraft(e.target.value)} rows={3} aria-label="Broker update" className="w-full resize-none rounded-lg app-border bg-navy-900 px-2 py-1.5 text-xs text-ink outline-none focus:border-cyan" />
                <GameButton size="sm" className="mt-1.5" disabled={!used.trim()} onClick={() => { m.sendBrokerUpdate(used); setDraft(null); }}>
                  <Send className="size-3.5" aria-hidden="true" /> Send to {m.broker.name}
                </GameButton>
              </>
            )}
          </>
        ), hl === "ex-broker")}
      </ol>
    </section>
  );
}
