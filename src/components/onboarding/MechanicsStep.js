import * as Icons from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Fragment } from "react";
import { mechanics } from "@/data/onboarding";
import StepNav from "./StepNav";

export default function MechanicsStep({ onNext, onBack }) {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-ink">Game Mechanics</h2>
      <p className="mt-2 text-sm text-ink-dim">Complete missions, make the right decisions and grow as a dispatcher.</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:flex lg:items-stretch">
        {mechanics.map((m, i) => {
          const Icon = Icons[m.icon];
          return (
            <Fragment key={m.id}>
              <div className="flex-1 rounded-2xl app-border bg-surface p-5">
                <Icon className={`mx-auto size-12 ${m.tone}`} aria-hidden="true" />
                <p className="mt-3 text-lg font-bold text-ink">{m.title}</p>
                <p className="text-xs text-ink-dim">{m.subtitle}</p>
                <p className="mt-4 text-xs leading-relaxed text-ink-dim">{m.text}</p>
              </div>
              {i < mechanics.length - 1 && (
                <ArrowRight className="hidden size-4 shrink-0 self-center text-cyan-bright lg:block" aria-hidden="true" />
              )}
            </Fragment>
          );
        })}
      </div>

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  );
}
