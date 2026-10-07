import { Check, Lock } from "lucide-react";
import { mission03 } from "@/data/phase4Missions";

// Four-step progress tracker: Review -> Analyze -> Select -> Proceed.
export default function StepTracker({ index, completed }) {
  const steps = mission03.steps;
  return (
    <ol aria-label="Phase 4 progress" className="flex items-start">
      {steps.map((label, i) => {
        const done = completed ? i <= 3 : i < index;
        const current = !completed && i === index;
        const locked = !done && !current;
        return (
          <li key={label} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && <span className={`absolute right-1/2 top-3.5 h-0.5 w-full ${done || current ? "bg-cyan" : "bg-line"}`} aria-hidden="true" />}
            <span
              className={`relative z-10 grid size-7 place-items-center rounded-full border-2 text-xs font-bold ${
                done ? "border-cyan bg-cyan text-navy-950" : current ? "border-cyan-bright bg-navy-950 text-cyan-bright shadow-[0_0_14px_rgb(37_217_255/0.5)]" : "border-line bg-navy-950 text-ink-dim"
              }`}
            >
              {done ? <Check className="size-3.5" aria-label="Done" /> : locked && i === steps.length - 1 ? <Lock className="size-3" aria-label="Locked" /> : i + 1}
            </span>
            <span className={`mt-1.5 max-w-24 text-[10px] font-semibold leading-tight ${current ? "text-ink" : done ? "text-cyan-bright" : "text-ink-dim"}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
