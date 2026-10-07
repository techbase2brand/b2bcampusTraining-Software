"use client";

import { useRouter } from "next/navigation";
import { Star, Trophy, ArrowRight, LayoutDashboard } from "lucide-react";
import GameButton from "@/components/game/GameButton";

// Completion screen shared by Phase 3 and Phase 4. All copy and numbers are passed in.
export default function PhaseComplete({ title, subtitle, unlocked, rows, stars, primaryLabel, onPrimary, secondaryLabel, onSecondary }) {
  const router = useRouter();
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50 flex overflow-y-auto bg-navy-950/90 p-4 backdrop-blur">
      <div className="animate-fade-up m-auto w-full max-w-md rounded-3xl border border-success/50 bg-surface-2 p-6 text-center shadow-[0_0_60px_rgb(0_200_150/0.2)] sm:p-8">
        <Trophy className="mx-auto size-10 text-gold-bright" aria-hidden="true" />
        <div className="mt-2 flex justify-center gap-1" role="img" aria-label={`${stars} of 3 stars`}>
          {[1, 2, 3].map((n) => (
            <Star key={n} className={`size-8 ${n <= stars ? "fill-gold-bright text-gold-bright" : "text-line"}`} aria-hidden="true" />
          ))}
        </div>
        <h1 className="mt-3 text-2xl font-extrabold text-ink">{title}</h1>
        <p className="mt-1 text-sm text-ink-dim">{subtitle}</p>

        <dl className="mt-5 space-y-2 rounded-2xl border border-line bg-surface p-4 text-left">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <dt className="text-xs text-ink-dim">{label}</dt>
              <dd className="text-sm font-semibold tabular-nums text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        {unlocked && <p className="mt-3 text-sm font-medium text-cyan-bright">{unlocked}</p>}

        {/* Navigation only: completion has already been saved, so neither button touches rewards. */}
        <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
          <GameButton onClick={onPrimary} className="w-full">
            {primaryLabel} <ArrowRight className="size-4" aria-hidden="true" />
          </GameButton>
          <GameButton variant="ghost" onClick={() => router.push("/dispatcher")} className="w-full border-cyan/60 text-cyan-bright">
            <LayoutDashboard className="size-4" aria-hidden="true" /> Go to Dashboard
          </GameButton>
        </div>
        <button type="button" onClick={onSecondary} className="mt-3 text-xs text-ink-dim hover:text-cyan-bright">
          {secondaryLabel}
        </button>
      </div>
    </div>
  );
}
