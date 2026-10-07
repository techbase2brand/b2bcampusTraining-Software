import { Star, LayoutDashboard } from "lucide-react";
import GameButton from "@/components/game/GameButton";

export default function MissionComplete({ progress, accuracy, totalTasks, onReturn, onDashboard }) {
  const rows = [
    ["Tasks", `${progress.completedTasks.length} / ${totalTasks}`],
    ["Accuracy", `${accuracy}%`],
    ["Hints Used", progress.hintsUsed],
    ["XP", `+${progress.xpEarned}`],
  ];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-navy-950/90 p-4 backdrop-blur">
      <div className="animate-fade-up w-full max-w-md rounded-3xl border border-success/50 bg-surface-2 p-8 text-center">
        <div className="flex justify-center gap-1" role="img" aria-label={`${progress.starsEarned} of 3 stars`}>
          {[1, 2, 3].map((n) => (
            <Star
              key={n}
              className={`size-10 ${n <= progress.starsEarned ? "fill-gold-bright text-gold-bright" : "text-line"}`}
              aria-hidden="true"
            />
          ))}
        </div>
        <h1 className="mt-4 text-3xl font-extrabold text-ink">MISSION COMPLETE</h1>
        <p className="mt-1 font-medium text-success">Dispatcher Desk Ready</p>

        <dl className="mt-6 space-y-3 rounded-2xl border border-line bg-surface p-5 text-left">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <dt className="text-sm text-ink-dim">{label}</dt>
              <dd className="text-sm font-semibold tabular-nums text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-cyan-bright">Level 2: Finding Loads unlocked</p>

        {/* Navigation only: completion is already saved, so neither button touches rewards. */}
        <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
          <GameButton onClick={onReturn} className="w-full">
            Return to Level Map
          </GameButton>
          <GameButton variant="ghost" onClick={onDashboard} className="w-full border-cyan/60 text-cyan-bright">
            <LayoutDashboard className="size-4" aria-hidden="true" /> Go to Dashboard
          </GameButton>
        </div>
      </div>
    </div>
  );
}
