import { phase3Page } from "@/data/phase3Missions";

// Compact four-step strip.
export default function HowItWorks() {
  return (
    <ol aria-label="How the Load Board works" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {phase3Page.howItWorks.map((step, i) => (
        <li key={step.id} className="flex items-start gap-2.5 rounded-xl border border-line/70 bg-surface/60 px-3 py-2">
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-blue/20 text-[10px] font-bold text-cyan-bright">{i + 1}</span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-ink">{step.title}</p>
            <p className="text-[11px] leading-snug text-ink-dim">{step.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
