"use client";

import { Star, Coins, Flame, Bell, Zap } from "lucide-react";
import { features } from "@/data/features";
import ProfileMenu from "./ProfileMenu";
import { useGameProgress } from "@/hooks/useGameProgress";
import { TOTAL_LEVELS } from "@/data/levels";
import ProgressBar from "./ProgressBar";
import StatBadge from "./StatBadge";

// Shared across Level Map, Dispatcher Control Center and later phases.
// The profile area opens the profile popup (ProfileMenu); `onProfileClick` is an optional extra hook.
// `center` replaces the XP/course bars (e.g. a search field) and moves the profile to the right.
export default function GameTopBar({ onProfileClick, center, showXp = false }) {
  const { state, ready } = useGameProgress();
  if (!ready) return <header className="h-16 border-b border-line bg-navy-900" />;

  const { profile, currentLevel, xp, nextLevelXp, stars, coins, streak, completedLevels } = state;

  return (
    <header className="relative z-30 flex h-16 items-center justify-between gap-3 border-b border-cyan/10 bg-navy-900/90 shadow-[0_1px_0_rgb(32_199_232/0.08)] px-3 backdrop-blur sm:px-5">
      <ProfileMenu state={state} onProfileClick={onProfileClick} reversed={Boolean(center)} />

      {center ? (
        <div className="order-first min-w-0 flex-1">{center}</div>
      ) : (
      <div className="hidden w-full max-w-md flex-1 grid-cols-2 gap-6 md:grid">
        <div>
          <div className="mb-1 flex justify-between text-[11px] text-ink-dim">
            <span>XP</span>
            <span className="tabular-nums">{xp} / {nextLevelXp}</span>
          </div>
          <ProgressBar value={xp} max={nextLevelXp} label="XP progress" />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-[11px] text-ink-dim">
            <span>Course</span>
            <span className="tabular-nums">{completedLevels.length} / {TOTAL_LEVELS}</span>
          </div>
          <ProgressBar value={completedLevels.length} max={TOTAL_LEVELS} tone="gold" label="Course progress" />
        </div>
      </div>
      )}

      <div className="flex items-center gap-1.5 sm:gap-2">
        {showXp && <StatBadge icon={Zap} value={`${xp} XP`} label="Experience points" tone="cyan" />}
        <StatBadge icon={Star} value={stars} label="Stars" tone="gold" />
        {features.coins && <StatBadge icon={Coins} value={coins} label="Coins" tone="gold" />}
        {features.streak && <StatBadge icon={Flame} value={streak} label="Day streak" tone="cyan" />}
        {features.notifications && (
          <button
            type="button"
            aria-label="Notifications"
            className="grid size-9 place-items-center rounded-lg border border-line bg-surface text-ink-dim transition hover:text-cyan-bright"
          >
            <Bell className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </header>
  );
}
