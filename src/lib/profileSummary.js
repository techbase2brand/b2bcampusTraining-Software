// Everything the profile popup shows, resolved from the saved game state. Nothing is stored or
// hardcoded here: levels, XP and rewards are read as saved, dispatch counts use the same dispatch
// records as the Dashboard, and milestones are derived from real progress.

import { getDashboard } from "./dashboardStats";
import { describeDispatch } from "./dispatchView";
import { getDispatches, DISPATCH_MISSIONS } from "./dispatchRecords";
import { effectiveLevel } from "./access";

const sum = (list, pick) => list.reduce((n, x) => n + (pick(x) ?? 0), 0);

// Runs counted once each: Mission 1 and Mission 2 are global; Missions 3-6 live in each dispatch.
// (Legacy global copies of Missions 3-6 are only used when no dispatch exists, so a migrated save
// is never counted twice.)
function countedRuns(state) {
  const dispatches = getDispatches(state);
  const global = ["mission-02", ...(dispatches.length ? [] : DISPATCH_MISSIONS)].map((id) => state.missionRuns?.[id]).filter(Boolean);
  const perDispatch = dispatches.flatMap((d) => DISPATCH_MISSIONS.map((id) => d.missionRuns?.[id]).filter(Boolean));
  return [state.missionProgress, ...global, ...perDispatch].filter(Boolean);
}

// Tasks done / (tasks done + incorrect attempts). "Tasks done" counts each task once ever (the
// reward ledger plus Mission 1), so replaying tasks in new dispatches does not inflate it.
export function getTrainingAccuracy(state) {
  const runs = countedRuns(state);
  const done = new Set([...(state.trainingLedger?.tasks ?? []), ...(state.missionProgress?.completedTasks ?? []).map((t) => `mission-01:${t}`)]);
  const mission2 = (state.missionRuns?.["mission-02"]?.completedTasks ?? []).map((t) => `mission-02:${t}`);
  mission2.forEach((k) => done.add(k));
  const attempts = sum(runs, (r) => r.attempts);
  const total = done.size + attempts;
  return { tasksDone: done.size, attempts, percent: total ? Math.round((done.size / total) * 100) : null };
}

export function getMilestones(state) {
  const dispatches = getDispatches(state);
  const negotiated = dispatches.some((d) => d.ops?.negotiation?.status === "agreed" || (d.ops?.attemptHistory ?? []).some((a) => a.agreedRate != null));
  return [
    { id: "first-mission", label: "First Mission Complete", done: (state.completedLevels ?? []).length >= 1 },
    { id: "first-dispatch", label: "First Dispatch", done: dispatches.length >= 1 },
    { id: "first-negotiation", label: "First Negotiation", done: negotiated },
    { id: "first-completed-load", label: "First Completed Load", done: dispatches.some((d) => d.completion?.isCompleted) },
  ];
}

// The dispatch being worked on: the last-opened one if unfinished, else the most recently updated unfinished one.
export function getCurrentDispatch(state) {
  const open = getDispatches(state).filter((d) => !d.completion?.isCompleted);
  const last = open.find((d) => d.slug === state.activeDispatchSlug);
  const pick = last ?? [...open].sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))[0];
  return pick ? describeDispatch(pick) : null;
}

export function getProfileSummary(state) {
  const dash = getDashboard(state);
  const level = effectiveLevel(state);
  const acc = getTrainingAccuracy(state);
  const current = getCurrentDispatch(state);
  return {
    student: {
      name: state.profile?.name ?? "Student",
      id: state.profile?.id ?? null,
      avatar: state.avatarSelection ?? null,
      level,
      xp: state.xp,
      nextLevelXp: state.nextLevelXp,
      xpPercent: state.nextLevelXp > 0 ? Math.min(100, Math.round((state.xp / state.nextLevelXp) * 100)) : 0,
    },
    stats: {
      missionsCompleted: dash.progress.completed,
      totalMissions: dash.progress.totalMissions,
      totalDispatches: dash.stats.total,
      completedDispatches: dash.stats.completed,
      activeDispatches: dash.records.filter((r) => r.live).length,
      accuracy: acc.percent,
      hintsUsed: sum(countedRuns(state), (r) => r.hintsUsed),
    },
    rewards: { stars: state.stars, coins: state.coins, xp: state.xp, streak: state.streak },
    milestones: getMilestones(state),
    progress: {
      mission: dash.progress.currentMission,
      level,
      dispatch: current ? { slug: current.slug, label: current.label, reference: current.reference, route: current.resumeRoute, stage: current.stageLabel } : null,
    },
  };
}
