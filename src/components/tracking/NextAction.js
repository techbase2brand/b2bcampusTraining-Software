"use client";

import { useState } from "react";
import { FastForward, AlertTriangle, OctagonAlert, Check, Phone, Map, FileText, MoreHorizontal } from "lucide-react";
import { getHealthReason, getJourney } from "@/lib/trackingJourney";
import { formatDuration } from "@/lib/text";
import { formatCountdown } from "@/lib/trackingTime";
import GameButton from "@/components/game/GameButton";
import TaskHighlight from "@/components/dispatcher/TaskHighlight";
import { DUTY } from "./SidePanels";

const SEVERITY = { danger: 3, warn: 2, info: 1 };
const ALERT_TONE = {
  warn: { box: "app-border-warning bg-gold/10", icon: AlertTriangle, color: "text-gold-bright" },
  danger: { box: "app-border-error bg-danger/10", icon: OctagonAlert, color: "text-danger" },
};
const HEALTH = {
  "ON TRACK": "app-border-success bg-success/10 text-success",
  "AT RISK": "app-border-warning bg-gold/10 text-gold-bright",
  DELAYED: "app-border-error bg-danger/10 text-danger",
};

// One short sentence for the single required action (copy only; which action it is comes from the
// tracker's own highlight).
const ACTION_TEXT = {
  "start-trip": "Start the trip so the driver leaves for the pickup.",
  advance: "Move the shipment on to its next event.",
  "confirm-departed": "Confirm the driver has left for the pickup.",
  "confirm-arrived": "Confirm the driver has arrived at the shipper.",
  "confirm-loading": "Confirm loading has started.",
  "confirm-picked-up": "Confirm the freight is on the truck.",
  comms: "Contact the driver for a status update.",
  "eta-review": "Compare the ETA with the appointment window.",
  "ex-ack": "A delay was reported. Handle it step by step.",
  "ex-eta": "A delay was reported. Work out the new ETA.",
  "ex-appt": "A delay was reported. Judge the appointment.",
  "ex-record": "A delay was reported. Record the event.",
  "ex-broker": "Tell the broker about the delay.",
  "confirm-arrival": "The driver is at the receiver. Confirm the arrival.",
};

// Only a serious current alert is shown (action required); older ones live in Alert History.
function seriousAlert(alerts) {
  return alerts.filter((a) => a.tone !== "info").reduce((best, a) => (!best || SEVERITY[a.tone] >= SEVERITY[best.tone] ? a : best), null);
}

// The right column of the Tracking page: current status + health, the ONE next action, driver status,
// a serious alert when there is one, and quiet secondary actions (everything else sits under More).
export default function NextAction({ m, primary, onOpen, more }) {
  const [menu, setMenu] = useState(false);
  const { t, snap, run, tl, entry } = m;
  const j = getJourney({ tl, snap });
  const reason = getHealthReason({ snap });
  const alert = run.started ? seriousAlert(m.alerts) : null;
  const tone = alert ? ALERT_TONE[alert.tone] : null;
  const last = t.checkCalls.at(-1);
  const atEnd = t.step >= tl.lastStep;
  const canAdvance = run.started && t.step >= 1 && !atEnd && !m.open;
  const clock = m.clock;
  const arrived = j.phase === "arrived";

  // Plain-language status line.
  let statusLine;
  if (j.phase === "to-pickup") statusLine = snap.statusId === "ready-for-pickup" ? "Waiting to start. The driver has not left yet." : `Driver is about ${j.toPickupRemaining.toLocaleString("en-US")} miles from the pickup.`;
  else if (j.phase === "at-pickup") statusLine = snap.statusId === "loading" ? "Loading is in progress at the shipper." : "Driver is at the shipper. Loading comes next.";
  else if (j.phase === "loaded") statusLine = `${j.loadedRemaining.toLocaleString("en-US")} miles to the delivery.`;
  else statusLine = "The driver is at the receiver. Delivery paperwork is the next mission.";

  return (
    <div className="space-y-3">
      {alert && (
        <section aria-label="Current alert" aria-live="polite" className={`rounded-2xl app-border p-3 ${tone.box}`}>
          <p className={`flex items-center gap-1.5 text-sm font-bold ${tone.color}`}>
            <tone.icon className="size-4 shrink-0" aria-hidden="true" /> {alert.title}
          </p>
          <p className="mt-1 text-sm leading-snug text-ink">{alert.text}</p>
          {m.exception && (
            <p className="mt-1.5 text-sm text-ink-dim">
              Updated ETA: <span className="font-bold text-ink">{m.fmt(snap.etaTarget)}</span>
            </p>
          )}
        </section>
      )}

      <section aria-label="Next action" className="panel p-3">
        <p className="label-xs text-cyan-bright">Next action</p>
        {t.arrival ? (
          <>
            <p className="mt-2 flex items-center gap-1.5 text-base font-bold text-success">
              <Check className="size-5" aria-hidden="true" /> ARRIVAL CONFIRMED
            </p>
            {/* All tasks are done: this is where the mission is finished and the result saved. */}
            {primary && (
              <TaskHighlight active={!primary.disabled} className="mt-2.5">
                <GameButton className="w-full uppercase tracking-wide" onClick={primary.onClick} disabled={primary.disabled}>
                  {primary.label}
                </GameButton>
              </TaskHighlight>
            )}
          </>
        ) : primary ? (
          <>
            <p className="mt-1.5 text-sm leading-snug text-ink">{ACTION_TEXT[m.highlight] ?? m.taskText}</p>
            <TaskHighlight active className="mt-2.5">
              <GameButton className="w-full uppercase tracking-wide" onClick={primary.onClick} disabled={primary.disabled}>
                {primary.label}
              </GameButton>
            </TaskHighlight>
          </>
        ) : (
          <p className="mt-1.5 text-sm text-ink-dim">
            {!run.started ? "Start the mission to begin." : clock?.moving ? "The truck is moving by itself. You will be asked to act when it reaches the next event." : "Nothing is required right now."}
          </p>
        )}

        {/* Development builds only: skipping ahead is a test aid, never the normal way to move a shipment. */}
        {m.devControls && run.started && !atEnd && (
          <div className="mt-3 border-t border-line/60 pt-2.5">
            <p className="label-xs">Dev control (not shown to students)</p>
            <GameButton size="sm" variant="ghost" className="mt-1.5 w-full" disabled={!canAdvance} onClick={m.advance}>
              <FastForward className="size-3.5" aria-hidden="true" /> Skip to Next Event
            </GameButton>
            {m.open && <p className="mt-1 text-xs text-ink-dim">Resolve the open delay first.</p>}
          </div>
        )}
      </section>

      <section aria-label="Current status" className="glass-strong liquid-border liquid-border--still rounded-2xl p-3">
        <p className="label-xs">Current status</p>
        <p className={`mt-1 text-base font-extrabold uppercase tracking-wide ${arrived ? "text-success" : "text-ink"}`}>{arrived && "✓ "}{snap.status}</p>
        <p className="mt-0.5 text-sm text-ink-dim">{statusLine}</p>
        {clock?.moving && (
          <dl className="mt-2 grid grid-cols-2 gap-2 rounded-lg app-border app-border-subtle bg-cyan/5 px-2.5 py-1.5 text-sm" aria-label="Training time">
            <div>
              <dt className="label-xs">Next update in</dt>
              <dd className="font-bold tabular-nums text-ink">{formatCountdown(clock.nextEventMs)}</dd>
            </div>
            <div>
              <dt className="label-xs">Real time to {clock.stopLabel}</dt>
              <dd className="font-bold tabular-nums text-ink">{formatCountdown(clock.toStopMs)}</dd>
            </div>
            <dd className="col-span-2 text-xs text-ink-dim">Training time (real minutes), not the shipment ETA.</dd>
          </dl>
        )}
        <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="label-xs">{snap.target === "pickup" ? "Pickup ETA" : "Delivery ETA"}</dt>
            <dd className="font-bold tabular-nums text-ink">{m.fmt(snap.etaTarget)}</dd>
          </div>
          <div>
            <dt className="label-xs">Health</dt>
            <dd>
              <span className={`inline-block rounded-full app-border px-2.5 py-0.5 text-xs font-extrabold tracking-wide ${HEALTH[snap.health]} ${snap.health === "ON TRACK" && clock?.moving ? "status-pulse" : ""}`}>{snap.health}</span>
            </dd>
          </div>
        </dl>
        {reason && (
          <p className="mt-2 rounded-lg bg-navy-900/60 px-2.5 py-1.5 text-sm leading-snug text-ink">
            {reason.cause && <span className="font-semibold">{reason.cause} </span>}
            {reason.window}
          </p>
        )}
      </section>

      <section aria-label="Driver status" className="panel p-3">
        <p className="label-xs">Driver</p>
        <p className="mt-0.5 text-base font-bold text-ink">{entry.driver.name}</p>
        <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
          <div>
            <dt className="label-xs">Duty status</dt>
            <dd className="font-semibold text-ink">{DUTY[snap.statusId]}</dd>
          </div>
          <div>
            <dt className="label-xs">Remaining HOS</dt>
            <dd className="font-semibold tabular-nums text-ink">{formatDuration(snap.hosRemaining)}</dd>
          </div>
          <div className="col-span-2">
            <dt className="label-xs">Last check call</dt>
            <dd className="font-semibold text-ink">{last ? `${m.fmt(new Date(last.timestamp))} · ${last.location}` : "Not yet"}</dd>
          </div>
        </dl>
        <GameButton size="sm" variant="ghost" className="mt-2.5 w-full" onClick={() => onOpen("comms")} disabled={!run.started}>
          <Phone className="size-3.5" aria-hidden="true" /> Contact Driver
        </GameButton>
      </section>

      <nav aria-label="Tracking views" className="grid grid-cols-2 gap-1.5">
        <button type="button" onClick={() => onOpen("map")} className="flex items-center justify-center gap-1.5 rounded-lg app-border bg-surface/70 px-2 py-2 text-sm font-semibold text-ink transition-colors hover:border-cyan hover:text-cyan-bright">
          <Map className="size-4" aria-hidden="true" /> View Map
        </button>
        <button type="button" onClick={() => onOpen("details")} className="flex items-center justify-center gap-1.5 rounded-lg app-border bg-surface/70 px-2 py-2 text-sm font-semibold text-ink transition-colors hover:border-cyan hover:text-cyan-bright">
          <FileText className="size-4" aria-hidden="true" /> Shipment Details
        </button>
        <button type="button" onClick={() => setMenu((v) => !v)} aria-expanded={menu} className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg app-border border-dashed px-2 py-1.5 text-sm font-semibold text-ink-dim transition-colors hover:border-cyan hover:text-cyan-bright">
          <MoreHorizontal className="size-4" aria-hidden="true" /> More
        </button>
        {menu &&
          more.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setMenu(false);
                onOpen(s.id);
              }}
              className="rounded-lg app-border bg-surface/70 px-2 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-cyan hover:text-cyan-bright"
            >
              {s.label}
            </button>
          ))}
      </nav>
    </div>
  );
}
