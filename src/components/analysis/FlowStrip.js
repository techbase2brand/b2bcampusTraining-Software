import { ChevronRight } from "lucide-react";
import { phase4Page } from "@/data/phase4Missions";

// Compact step-by-step guide along the bottom of the page.
export default function FlowStrip({ stepIndex }) {
  return (
    <ol aria-label="How load analysis works" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
      {phase4Page.flow.map((step, i) => (
        <li key={step.id} className={`relative rounded-xl border px-3 py-2 transition-colors ${i === Math.min(stepIndex, phase4Page.flow.length - 1) ? "border-cyan/50 bg-cyan/5" : "border-line/70 bg-surface/60"}`}>
          <p className="flex items-center gap-2 text-xs font-bold text-ink">
            <span className="grid size-5 place-items-center rounded-full bg-blue/20 text-[10px] text-cyan-bright">{i + 1}</span>
            {step.title}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-ink-dim">{step.text}</p>
          {i < phase4Page.flow.length - 1 && <ChevronRight className="absolute -right-2 top-1/2 hidden size-4 -translate-y-1/2 text-cyan xl:block" aria-hidden="true" />}
        </li>
      ))}
    </ol>
  );
}
