// Sidebar progress card: percentage ring + phase/level label.
export default function PhaseProgressCard({ pct, phaseLabel, levelLabel, title }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
      <div
        role="img"
        aria-label={`${phaseLabel} ${pct}% complete`}
        className="grid size-12 shrink-0 place-items-center rounded-full"
        style={{ background: `conic-gradient(#25d9ff ${pct}%, #0b2342 0)` }}
      >
        <span className="grid size-9 place-items-center rounded-full bg-surface text-[11px] font-bold tabular-nums text-ink">{pct}%</span>
      </div>
      <div className="min-w-0">
        <p className="label-xs">{phaseLabel}</p>
        <p className="truncate text-sm font-bold text-ink">{levelLabel}</p>
        <p className="truncate text-[11px] text-ink-dim">{title}</p>
      </div>
    </div>
  );
}
