"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Coins, Flame, Zap, Check, Circle, LayoutDashboard, List, Settings, LogOut, Lock } from "lucide-react";
import { useGameProgress } from "@/hooks/useGameProgress";
import { dispatcherNav } from "@/data/navigation";
import { resolveNav } from "@/lib/access";
import { getProfileSummary } from "@/lib/profileSummary";
import { ROUTES } from "@/lib/dispatchRecords";
import Avatar from "./Avatar";
import ProgressBar from "./ProgressBar";

function Stat({ label, value }) {
  return (
    <div className="liquid-border liquid-border-subtle rounded-lg bg-navy-900/70 px-2.5 py-1.5">
      <dd className="text-base font-extrabold tabular-nums text-ink">{value}</dd>
      <dt className="text-xs text-ink-dim">{label}</dt>
    </div>
  );
}

// The profile area of the top bar. Clicking it opens a compact popup with the student's saved
// progress: a dropdown under the button on desktop, a bottom sheet on small screens. It closes on
// outside click, Escape and any action. `onProfileClick` (optional) is still called on open.
export default function ProfileMenu({ state, onProfileClick, reversed = false }) {
  const router = useRouter();
  const { update } = useGameProgress();
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const panel = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        root.current?.querySelector("button[aria-haspopup]")?.focus();
      }
    };
    const onDown = (e) => {
      if (root.current && !root.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    panel.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const sum = getProfileSummary(state);
  const { student, stats, rewards, progress } = sum;
  const settings = resolveNav(dispatcherNav, state).find((i) => i.id === "settings");
  const settingsOpen = settings?.status === "enabled";

  const go = (route) => {
    setOpen(false);
    router.push(route);
  };
  const logOut = () => {
    setOpen(false);
    update({ isAuthenticated: false }); // progress is kept; the route guard sends the student to /login
  };
  const action = "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-semibold text-ink transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div ref={root} className={`relative ${reversed ? "order-last" : ""}`}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Open profile"
        onClick={() => {
          setOpen((v) => !v);
          onProfileClick?.();
        }}
        className="liquid-border liquid-border-subtle flex min-w-0 items-center gap-3 rounded-full app-border app-border-subtle bg-surface/40 p-1 pr-4 text-left backdrop-blur transition hover:border-cyan/40 hover:bg-surface/70 focus-visible:outline-2 focus-visible:outline-cyan-bright"
      >
        <Avatar gender={state.avatarSelection} className="size-10 shrink-0" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-ink">{student.name}</span>
          <span className="block truncate text-xs font-semibold uppercase text-cyan-bright">Level {state.currentLevel}</span>
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-navy-950/60 sm:hidden" aria-hidden="true" />
          <div
            ref={panel}
            role="dialog"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="modal-in glass-strong liquid-border liquid-border-strong fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl outline-none sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-[80vh] sm:w-[23rem] sm:rounded-2xl"
          >
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="flex items-center gap-3">
              <Avatar gender={student.avatar} className="size-14 shrink-0" />
              <div className="min-w-0">
                <h2 id={titleId} className="truncate text-base font-extrabold text-ink">
                  {student.name}
                </h2>
                {student.id && <p className="truncate text-xs text-ink-dim">Student ID: {student.id}</p>}
                <p className="text-xs font-bold uppercase text-cyan-bright">Level {student.level}</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-ink-dim">
                <span>XP</span>
                <span className="tabular-nums">
                  {student.xp} / {student.nextLevelXp}
                </span>
              </div>
              <ProgressBar value={student.xp} max={student.nextLevelXp} label="XP progress to next level" />
            </div>

            <h3 className="label-xs mt-4">Training stats</h3>
            <dl className="mt-1.5 grid grid-cols-3 gap-1.5">
              <Stat label="Missions" value={`${stats.missionsCompleted} / ${stats.totalMissions}`} />
              <Stat label="Dispatches" value={stats.totalDispatches} />
              <Stat label="Completed" value={stats.completedDispatches} />
              <Stat label="Active" value={stats.activeDispatches} />
              <Stat label="Accuracy" value={stats.accuracy == null ? "-" : `${stats.accuracy}%`} />
              <Stat label="Hints used" value={stats.hintsUsed} />
            </dl>

            <h3 className="label-xs mt-4">Rewards</h3>
            <ul className="liquid-border liquid-border-subtle mt-1.5 flex flex-wrap gap-x-4 gap-y-1 rounded-lg bg-navy-900/60 px-3 py-2 text-sm font-semibold text-ink">
              <li className="flex items-center gap-1.5">
                <Zap className="size-4 text-cyan-bright" aria-hidden="true" /> {rewards.xp} XP
              </li>
              <li className="flex items-center gap-1.5">
                <Star className="size-4 text-gold-bright" aria-hidden="true" /> {rewards.stars} Stars
              </li>
              <li className="flex items-center gap-1.5">
                <Coins className="size-4 text-gold-bright" aria-hidden="true" /> {rewards.coins} Coins
              </li>
              <li className="flex items-center gap-1.5">
                <Flame className="size-4 text-cyan-bright" aria-hidden="true" /> {rewards.streak} Streak
              </li>
            </ul>

            <h3 className="label-xs mt-4">Milestones</h3>
            <ul className="mt-1.5 space-y-1">
              {sum.milestones.map((b) => (
                <li key={b.id} className={`flex items-center gap-2 text-sm ${b.done ? "font-semibold text-success" : "text-ink-dim"}`}>
                  {b.done ? <Check className="size-4 shrink-0" aria-hidden="true" /> : <Circle className="size-3.5 shrink-0" aria-hidden="true" />}
                  <span className="sr-only">{b.done ? "Unlocked: " : "Locked: "}</span>
                  {b.label}
                </li>
              ))}
            </ul>

            <h3 className="label-xs mt-4">Current progress</h3>
            <dl className="mt-1.5 space-y-1.5 text-sm">
              <div>
                <dt className="text-xs text-ink-dim">Current mission</dt>
                <dd className="font-semibold text-ink">{progress.mission ?? "All available missions complete"}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-dim">Current dispatch</dt>
                <dd className="font-semibold text-ink">
                  {progress.dispatch ? (
                    <button type="button" onClick={() => go(progress.dispatch.route)} className="text-left text-cyan-bright underline-offset-2 hover:underline">
                      {progress.dispatch.label}
                      {progress.dispatch.reference ? ` — ${progress.dispatch.reference}` : ""}
                    </button>
                  ) : (
                    <span className="text-ink-dim">None open</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-dim">Level</dt>
                <dd className="font-semibold text-ink">Level {progress.level}</dd>
              </div>
            </dl>

            <nav aria-label="Profile actions" className="mt-4 space-y-0.5 border-t border-line/70 pt-3">
              <button type="button" className={action} onClick={() => go("/dispatcher")}>
                <LayoutDashboard className="size-4 text-cyan-bright" aria-hidden="true" /> View Dashboard
              </button>
              <button type="button" className={action} onClick={() => go(ROUTES.hub)}>
                <List className="size-4 text-cyan-bright" aria-hidden="true" /> View Dispatches
              </button>
              <button type="button" className={action} disabled={!settingsOpen} onClick={() => go("/dispatcher/settings")}>
                <Settings className="size-4 text-cyan-bright" aria-hidden="true" /> Settings
                {!settingsOpen && <Lock className="ml-auto size-3.5" aria-label="Locked" />}
              </button>
              <button type="button" className={action} onClick={logOut}>
                <LogOut className="size-4 text-danger" aria-hidden="true" /> Log Out
              </button>
            </nav>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
