"use client";

import { CheckCircle2, AlertTriangle, Info, CircleDashed, ListChecks } from "lucide-react";
import { getCheckResults, getTruckContext } from "@/lib/loadRules";
import TaskHighlight from "@/components/dispatcher/TaskHighlight";

function Status({ revealed, passed }) {
  if (!revealed) return <span className="flex items-center gap-1 text-[11px] text-ink-dim"><CircleDashed className="size-3.5" aria-hidden="true" /> Not Checked</span>;
  if (passed === null) return <span className="flex items-center gap-1 text-[11px] font-semibold text-cyan-bright"><Info className="size-3.5" aria-hidden="true" /> Info</span>;
  return passed ? (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-success"><CheckCircle2 className="size-3.5" aria-hidden="true" /> Compatible</span>
  ) : (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-gold-bright"><AlertTriangle className="size-3.5" aria-hidden="true" /> Issue Found</span>
  );
}

// Five compatibility checks. Results stay hidden until the student reveals them.
export default function CompatibilityReview({ m, load, highlight }) {
  const ctx = getTruckContext();
  const results = getCheckResults(load, ctx);
  const revealed = m.checks[load.id] ?? [];
  const unrevealed = results.filter((r) => !revealed.includes(r.code)).map((r) => r.code);

  return (
    <section aria-label="Compatibility review" className="panel p-3">
      <div className="flex items-center justify-between">
        <h2 className="panel-title flex items-center gap-1.5">
          <ListChecks className="size-3.5 text-cyan-bright" aria-hidden="true" /> Compatibility Review
        </h2>
        <button
          type="button"
          disabled={!unrevealed.length}
          onClick={() => m.revealChecks(load.id, unrevealed)}
          className="rounded-md app-border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-cyan-bright transition-colors hover:border-cyan disabled:border-transparent disabled:text-ink-dim"
        >
          Check All
        </button>
      </div>

      <ul className="mt-2.5 space-y-1.5">
        {results.map((r) => {
          const shown = revealed.includes(r.code);
          const glow = (r.code === "weight" && highlight === "filter-weight") || (["timing", "hos"].includes(r.code) && highlight === "load-results");
          const tone = !shown || r.passed === null ? " bg-navy-900/60" : r.passed ? "app-border-success bg-success/5" : "app-border-warning bg-gold/5";
          return (
            <li key={r.code}>
              <TaskHighlight active={glow} className="p-0.5">
                <div className={`rounded-lg app-border px-2.5 py-1.5 transition-colors ${tone}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-ink">{r.label}</p>
                    {shown ? (
                      <Status revealed passed={r.passed} />
                    ) : (
                      <button
                        type="button"
                        onClick={() => m.revealChecks(load.id, [r.code])}
                        aria-label={`Check ${r.label}`}
                        className="rounded-md app-border bg-surface-2 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-cyan-bright transition-colors hover:border-cyan"
                      >
                        Check
                      </button>
                    )}
                  </div>
                  {shown && <p className="mt-1 text-[11px] leading-snug text-ink-dim">{r.message}</p>}
                </div>
              </TaskHighlight>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
