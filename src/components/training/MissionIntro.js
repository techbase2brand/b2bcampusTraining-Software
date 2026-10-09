import { Target } from "lucide-react";
import TrainingAgentSlot from "./TrainingAgentSlot";
import GameButton from "@/components/game/GameButton";

export default function MissionIntro({ mission, onStart, onBack }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-navy-950/90 p-4 backdrop-blur">
      <div className="animate-fade-up w-full max-w-2xl rounded-3xl app-border bg-surface-2 p-6 sm:p-8">
        <p className="text-xs font-bold tracking-[0.3em] text-gold">MISSION 01</p>
        <h1 className="mt-1 text-3xl font-extrabold text-ink">{mission.title}</h1>

        <div className="mt-6 flex items-start gap-4">
          <TrainingAgentSlot size="sm" />
          <p className="rounded-2xl rounded-tl-none app-border app-border-active bg-navy-900 p-4 text-sm text-ink">
            {mission.intro}
          </p>
        </div>

        <h2 className="mt-6 text-sm font-bold uppercase tracking-wider text-ink-dim">Objectives</h2>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {mission.objectives.map((o) => (
            <li key={o} className="flex items-center gap-2 text-sm text-ink">
              <Target className="size-4 text-cyan-bright" aria-hidden="true" /> {o}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex justify-between gap-3">
          <GameButton variant="ghost" onClick={onBack}>
            Back to Map
          </GameButton>
          <GameButton onClick={onStart}>Start Shift</GameButton>
        </div>
      </div>
    </div>
  );
}
