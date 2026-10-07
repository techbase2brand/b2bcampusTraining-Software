import * as Icons from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Fragment } from "react";
import { journeyPhases, laterStages } from "@/data/phases";
import StepNav from "./StepNav";

export default function JourneyStep({ onNext, onBack }) {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-ink">Your Training Journey</h2>
      <p className="mt-2 text-sm text-ink-dim">Progress through real dispatcher operations step by step.</p>

      <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:flex lg:items-stretch lg:justify-center">
        {journeyPhases.map((p, i) => {
          const Icon = Icons[p.icon];
          const current = i === 0;
          return (
            <Fragment key={p.id}>
              <li
                className={`flex-1 rounded-2xl border p-5 ${
                  current
                    ? "border-blue bg-surface-2 shadow-[0_0_28px_rgb(38_140_255/0.3)]"
                    : "border-line bg-surface"
                }`}
              >
                <span className={`mx-auto grid size-11 place-items-center rounded-full border border-line bg-navy-900 ${p.tone}`}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <p className="mt-3 text-xs font-bold text-ink-dim">PHASE {i + 1}</p>
                <p className="text-lg font-bold text-ink">{p.title}</p>
                <p className="mt-1 text-xs text-ink-dim">{p.blurb}</p>
                <p className="mt-4 text-xs font-semibold text-ink-dim">{p.levels}</p>
              </li>
              {i < journeyPhases.length - 1 && (
                <ArrowRight className="hidden size-5 shrink-0 self-center text-cyan-bright lg:block" aria-hidden="true" />
              )}
            </Fragment>
          );
        })}
      </ol>
      <p className="mt-6 text-xs text-ink-dim">Then: {laterStages.join(" · ")}</p>

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  );
}
