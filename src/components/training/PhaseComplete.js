"use client";

import { useRouter } from "next/navigation";
import { Star, Trophy, ArrowRight } from "lucide-react";
import GameButton from "@/components/game/GameButton";

// One completion screen for every mission: MISSION COMPLETE, stars, the same four numbers (Tasks,
// Accuracy, Hints Used, XP), then Continue Training (primary), Return to Level Map (secondary) and
// Go to Dashboard (optional). `rows` adds mission-specific lines under the standard ones. This screen
// is navigation only: completion and rewards are already saved.
export default function PhaseComplete({ missionName, subtitle, unlocked, stats, rows = [], stars, primaryLabel = "Continue Training", onPrimary }) {
  const router = useRouter();
  return (
    <div role="dialog" aria-modal="true" aria-label="Mission complete" className="fixed inset-0 z-50 flex overflow-y-auto bg-navy-950/90 p-4 backdrop-blur">
      <div className="animate-fade-up m-auto w-full max-w-md rounded-3xl border border-success/50 bg-surface-2 p-6 text-center shadow-[0_0_60px_rgb(0_200_150/0.2)] sm:p-8">
        <Trophy className="mx-auto size-10 text-gold-bright" aria-hidden="true" />
        <div className="mt-2 flex justify-center gap-1" role="img" aria-label={`${stars} of 3 stars`}>
          {[1, 2, 3].map((n) => (
            <Star key={n} className={`size-8 ${n <= stars ? "fill-gold-bright text-gold-bright" : "text-line"}`} aria-hidden="true" />
          ))}
        </div>
        <h1 className="mt-3 text-2xl font-extrabold text-ink">MISSION COMPLETE</h1>
        {missionName && <p className="mt-1 text-sm font-semibold text-success">{missionName}</p>}
        {subtitle && <p className="mt-0.5 text-sm text-ink-dim">{subtitle}</p>}

        <dl className="mt-5 space-y-2 rounded-2xl border border-line bg-surface p-4 text-left">
          {stats.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <dt className="text-sm text-ink-dim">{label}</dt>
              <dd className="text-sm font-semibold tabular-nums text-ink">{value}</dd>
            </div>
          ))}
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 border-t border-line/50 pt-2">
              <dt className="text-xs text-ink-dim">{label}</dt>
              <dd className="text-xs font-semibold tabular-nums text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        {unlocked && <p className="mt-3 text-sm font-medium text-cyan-bright">{unlocked}</p>}

        <GameButton onClick={onPrimary} className="mt-5 w-full">
          {primaryLabel} <ArrowRight className="size-4" aria-hidden="true" />
        </GameButton>
        <div className="mt-3 flex items-center justify-center gap-4 text-sm">
          <button type="button" onClick={() => router.push("/home")} className="font-semibold text-ink-dim hover:text-cyan-bright">
            Return to Level Map
          </button>
          <button type="button" onClick={() => router.push("/dispatcher")} className="font-semibold text-ink-dim hover:text-cyan-bright">
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
