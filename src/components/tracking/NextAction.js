"use client";

import { useState } from "react";
import { FastForward, Info, AlertTriangle, OctagonAlert, Check } from "lucide-react";
import GameButton from "@/components/game/GameButton";
import TaskHighlight from "@/components/dispatcher/TaskHighlight";

const SEVERITY = { danger: 3, warn: 2, info: 1 };
const ALERT_TONE = {
  info: { box: "border-cyan/30 bg-cyan/5", icon: Info, color: "text-cyan-bright" },
  warn: { box: "border-gold/40 bg-gold/10", icon: AlertTriangle, color: "text-gold-bright" },
  danger: { box: "border-danger/40 bg-danger/10", icon: OctagonAlert, color: "text-danger" },
};

// The most severe current alert (latest wins a tie). Older ones live in Alert History.
function criticalAlert(alerts) {
  return alerts.reduce((best, a) => (!best || SEVERITY[a.tone] >= SEVERITY[best.tone] ? a : best), null);
}

// Right column on the Tracking page: the current alert, last check call, the next required action
// (one strong button) and quiet shortcuts to everything else, which opens in drawers.
export default function NextAction({ m, primary, onOpen, shortcuts }) {
  const [more, setMore] = useState(false);
  const { t, snap, run, tl } = m;
  const visible = shortcuts.slice(0, 3);
  const hidden = shortcuts.slice(3);
  const alert = run.started ? criticalAlert(m.alerts) : null;
  const tone = alert ? ALERT_TONE[alert.tone] : null;
  const last = t.checkCalls.at(-1);
  const atEnd = t.step >= tl.lastStep;
  const canAdvance = run.started && t.step >= 1 && !atEnd && !m.open;

  return (
    <div className="space-y-3">
      {alert && (
        <section aria-label="Current alert" className={`rounded-2xl border p-3 ${tone.box}`} aria-live="polite">
          <p className={`flex items-center gap-1.5 text-xs font-bold ${tone.color}`}>
            <tone.icon className="size-4 shrink-0" aria-hidden="true" /> {alert.title}
          </p>
          <p className="mt-1 text-xs leading-snug text-ink">{alert.text}</p>
          {m.exception && (
            <p className="mt-1.5 text-[11px] text-ink-dim">
              Updated ETA: <span className="font-bold text-ink">{m.fmt(snap.etaTarget)}</span>
            </p>
          )}
        </section>
      )}

      <section aria-label="Next action" className="panel p-3">
        <p className="label-xs text-cyan-bright">Next action</p>
        {t.arrival ? (
          <p className="mt-1.5 flex items-center gap-1.5 text-sm font-bold text-success">
            <Check className="size-4" aria-hidden="true" /> ARRIVAL CONFIRMED
          </p>
        ) : primary ? (
          <TaskHighlight active className="mt-1.5">
            <GameButton className="w-full uppercase tracking-wide" onClick={primary.onClick} disabled={primary.disabled}>
              {primary.label}
            </GameButton>
          </TaskHighlight>
        ) : (
          <p className="mt-1.5 text-xs text-ink-dim">{run.started ? "Nothing required right now. Move the shipment forward." : "Start the mission first."}</p>
        )}
        <GameButton size="sm" variant="ghost" className="mt-2 w-full" disabled={!canAdvance} onClick={m.advance}>
          <FastForward className="size-3.5" aria-hidden="true" /> Advance Simulation
        </GameButton>
        {m.open && run.started && <p className="mt-1 text-[10px] text-ink-dim">Resolve the open delay before moving on.</p>}
      </section>

      <section aria-label="Last check call" className="panel p-3">
        <dl className="space-y-1.5 text-xs">
          <div>
            <dt className="label-xs">Current location</dt>
            <dd className="font-semibold text-ink">{snap.location}</dd>
          </div>
          <div>
            <dt className="label-xs">Last check call</dt>
            <dd className="font-semibold text-ink">{last ? m.fmt(new Date(last.timestamp)) : "None yet"}</dd>
          </div>
        </dl>
      </section>

      <nav aria-label="More views" className="grid grid-cols-2 gap-1.5">
        {[...visible, ...(more ? hidden : [])].map((s) => (
          <button key={s.id} type="button" onClick={() => onOpen(s.id)} className="rounded-lg border border-line bg-surface/70 px-2 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-cyan hover:text-cyan-bright">
            {s.label}
          </button>
        ))}
        {hidden.length > 0 && (
          <button type="button" onClick={() => setMore((v) => !v)} aria-expanded={more} className="col-span-2 rounded-lg border border-dashed border-line px-2 py-1.5 text-xs font-semibold text-ink-dim transition-colors hover:border-cyan hover:text-cyan-bright">
            {more ? "Fewer" : `More (${hidden.length})`}
          </button>
        )}
      </nav>
    </div>
  );
}
