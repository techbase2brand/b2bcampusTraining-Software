import { ArrowRight, Check, MapPin, Gauge } from "lucide-react";
import { STAGE_STEPS, stageIndex } from "@/lib/dispatchHub";
import { fmtDateTime } from "@/lib/trackingComms";
import { formatCurrency } from "@/lib/text";
import GameButton from "@/components/game/GameButton";
import StatusBadge from "@/components/dashboard/StatusBadge";

const when = (iso) => (iso ? fmtDateTime(new Date(iso)) : "-");

function Fact({ label, children, className = "" }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="label-xs">{label}</dt>
      <dd className="truncate text-sm font-semibold text-ink">{children}</dd>
    </div>
  );
}

// Four-step workflow position: done steps are filled, the current one is highlighted.
function Stepper({ record }) {
  const at = stageIndex(record);
  return (
    <ol aria-label={`Workflow stage: ${record.stageLabel}`} className="flex items-center gap-1">
      {STAGE_STEPS.map((s, i) => {
        const done = i < at;
        const current = i === at;
        return (
          <li key={s.id} className="flex min-w-0 flex-1 items-center gap-1" aria-current={current ? "step" : undefined}>
            <span className={`grid size-4 shrink-0 place-items-center rounded-full text-[11px] ${done ? "bg-success/25 text-success" : current ? "bg-cyan/25 text-cyan-bright ring-1 ring-cyan-bright" : "bg-navy-900 text-ink-dim"}`}>
              {done ? <Check className="size-2.5" aria-hidden="true" /> : <span className="size-1 rounded-full bg-current" aria-hidden="true" />}
            </span>
            <span className={`truncate text-[11px] font-semibold ${current ? "text-cyan-bright" : done ? "text-ink" : "text-ink-dim"}`}>{s.label}</span>
            {i < STAGE_STEPS.length - 1 && <span className={`h-px flex-1 ${done ? "bg-success/50" : "bg-line"}`} aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}

// An unfinished dispatch: number, status, load and route, workflow position, key facts and one
// Resume action that goes to the dispatch's own resume route. Tracking dispatches add ETA / health.
export default function ActiveDispatchCard({ record: r, onResume }) {
  const tracking = r.trackingStarted;
  const rate = r.agreedRate ?? null;
  return (
    <article className="glass-strong liquid-border liquid-border-strong flex flex-col gap-3 rounded-2xl p-[var(--app-card-padding)] transition duration-200 hover:-translate-y-0.5">
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold-bright">Dispatch</p>
        <h3 className="text-lg font-extrabold leading-none text-ink">#{r.number}</h3>
        <div className="ml-auto flex flex-wrap items-center gap-1">
          <StatusBadge statusId={r.statusId} label={r.statusLabel} />
          {tracking && r.health && <StatusBadge health={r.health} label={r.health} />}
        </div>
      </header>

      <div className="min-w-0">
        {r.reference ? (
          <>
            <p className="text-sm font-bold text-cyan-bright">{r.reference}</p>
            <p className="flex items-center gap-1.5 truncate text-base font-extrabold text-ink">
              <MapPin className="size-4 shrink-0 text-cyan-bright" aria-hidden="true" /> {r.route}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-ink-dim">No load chosen yet</p>
            <p className="text-base font-extrabold text-ink">{r.shortlistCount} shortlisted {r.shortlistCount === 1 ? "load" : "loads"}</p>
          </>
        )}
      </div>

      <Stepper record={r} />

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-line/60 pt-2.5">
        <Fact label="Driver">{r.driverName ?? "Not assigned"}</Fact>
        <Fact label="Truck">{r.truckId ?? "-"}</Fact>
        <Fact label="Rate">{rate != null ? <span className="text-success">{formatCurrency(rate)}</span> : "Not agreed"}</Fact>
        <Fact label="Updated">{when(r.updatedAt)}</Fact>
        {tracking && (
          <>
            <Fact label="ETA">{r.eta ?? "-"}</Fact>
            <Fact label="Remaining">
              <span className="inline-flex items-center gap-1">
                <Gauge className="size-3.5 text-cyan-bright" aria-hidden="true" /> {r.milesRemaining != null ? `${Math.round(r.milesRemaining)} mi` : "-"}
              </span>
            </Fact>
          </>
        )}
      </dl>

      <GameButton onClick={() => onResume(r.resumeRoute)} className="w-full" aria-label={`Resume dispatch ${r.number}`}>
        Resume <ArrowRight className="size-4" aria-hidden="true" />
      </GameButton>
    </article>
  );
}
