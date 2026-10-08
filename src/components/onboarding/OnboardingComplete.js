import { BadgeCheck, ArrowRight, Trophy } from "lucide-react";
import Avatar from "@/components/game/Avatar";
import ProgressBar from "@/components/game/ProgressBar";
import GameButton from "@/components/game/GameButton";

export default function OnboardingComplete({ state, onFinish, onBack }) {
  const { profile, avatarSelection, xp, nextLevelXp } = state;

  return (
    <div className="mx-auto max-w-md text-center">
      <span className="mx-auto grid size-20 place-items-center rounded-full border-2 border-success bg-success/10 shadow-[0_0_40px_rgb(0_200_150/0.4)]">
        <BadgeCheck className="size-10 text-success" aria-hidden="true" />
      </span>
      <h2 className="mt-5 text-3xl font-bold text-ink">Onboarding Complete!</h2>
      <p className="mt-2 text-sm text-ink-dim">
        Dispatcher Profile Activated. You&apos;re ready to start your first mission.
      </p>

      <div className="mt-8 space-y-3 text-left">
        <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface/90 p-4">
          <Avatar gender={avatarSelection} className="size-14 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-ink">{profile.name}</p>
            <p className="text-xs text-ink-dim">{profile.role}</p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-ink-dim">
              <span>Level 1</span>
              <span className="tabular-nums">
                {xp} / {nextLevelXp} XP
              </span>
            </div>
            <ProgressBar value={xp} max={nextLevelXp} label="XP" className="mt-1" />
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-gold/40 bg-surface/90 p-4">
          <Trophy className="size-9 shrink-0 text-gold-bright" aria-hidden="true" />
          <div>
            <p className="font-bold text-gold-bright">Mission 1 Unlocked</p>
            <p className="text-sm font-semibold text-cyan-bright">Dispatcher Desk Setup</p>
            <p className="text-xs text-ink-dim">Get familiar with your workspace and tools.</p>
          </div>
        </div>
      </div>

      <GameButton onClick={onFinish} className="mt-8 w-full py-3">
        Enter Dispatcher World <ArrowRight className="size-4" aria-hidden="true" />
      </GameButton>
      <button type="button" onClick={onBack} className="mt-3 text-xs text-ink-dim hover:text-cyan-bright">
        Back
      </button>
    </div>
  );
}
