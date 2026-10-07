import * as Icons from "lucide-react";
import { ArrowRight } from "lucide-react";
import { welcomeFeatures } from "@/data/onboarding";
import TruckScene from "@/components/game/TruckScene";
import TrainingAgentSlot from "@/components/training/TrainingAgentSlot";
import GameButton from "@/components/game/GameButton";

export default function WelcomeStep({ onNext }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-navy-900">
      <TruckScene className="absolute inset-x-0 bottom-0 h-full w-full opacity-40" />
      <div className="relative z-10 grid items-center gap-6 px-6 py-12 sm:px-12 md:grid-cols-[1.1fr_1fr]">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
            Welcome to
            <br />
            B2B Logistics
          </h1>
          <p className="mt-4 text-lg font-semibold text-cyan-bright">AI-Powered Dispatcher Training</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-dim">
            You are entering a simulated U.S. truck dispatch operation. Your goal is to progress from trainee to
            independent dispatcher.
          </p>
          <ul className="mt-8 flex flex-wrap gap-4">
            {welcomeFeatures.map((f) => {
              const Icon = Icons[f.icon];
              return (
                <li key={f.label} className="flex w-20 flex-col items-center gap-2 text-center">
                  <span className="grid size-12 place-items-center rounded-xl border border-cyan/50 bg-surface-2 text-cyan-bright">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="text-[11px] text-ink-dim">{f.label}</span>
                </li>
              );
            })}
          </ul>
          <GameButton onClick={onNext} className="mt-8 px-6 py-3">
            Begin Onboarding <ArrowRight className="size-4" aria-hidden="true" />
          </GameButton>
        </div>
        <TrainingAgentSlot className="h-72 md:h-[26rem]" />
      </div>
    </div>
  );
}
