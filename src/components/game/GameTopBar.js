"use client";

import { Star, Coins, Flame, Bell, Zap } from "lucide-react";
import Avatar from "./Avatar";
import { useGameProgress } from "@/hooks/useGameProgress";
import { TOTAL_LEVELS } from "@/data/levels";
import ProgressBar from "./ProgressBar";
import StatBadge from "./StatBadge";

// Shared across Level Map, Dispatcher Control Center and later phases.
// `onProfileClick` is the hook-in point for a future profile panel.
// `center` replaces the XP/course bars (e.g. a search field) and moves the profile to the right.
export default function GameTopBar({ onProfileClick, center, showXp = false }) {
  const { state, ready } = useGameProgress();
  if (!ready) return <header className="h-16 border-b border-line bg-navy-900" />;

  const { profile, currentLevel, xp, nextLevelXp, stars, coins, streak, completedLevels } = state;

  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b border-cyan/10 bg-navy-900/90 shadow-[0_1px_0_rgb(32_199_232/0.08)] px-3 backdrop-blur sm:px-5">
      <button
        type="button"
        onClick={onProfileClick}
        className={`flex min-w-0 items-center gap-3 rounded-lg p-1 text-left transition hover:bg-surface focus-visible:outline-2 focus-visible:outline-cyan-bright ${center ? "order-last" : ""}`}
      >
        <Avatar gender={state.avatarSelection} className="size-10 shrink-0" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-ink">{profile.name}</span>
          <span className="block truncate text-xs font-semibold uppercase text-cyan-bright">Level {currentLevel}</span>
        </span>
      </button>

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
        <StatBadge icon={Coins} value={coins} label="Coins" tone="gold" />
        <StatBadge icon={Flame} value={streak} label="Day streak" tone="cyan" />
        <button
          type="button"
          aria-label="Notifications"
          className="grid size-9 place-items-center rounded-lg border border-line bg-surface text-ink-dim transition hover:text-cyan-bright"
        >
          <Bell className="size-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
