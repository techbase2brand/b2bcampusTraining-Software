"use client";

import { useRouter } from "next/navigation";
import { Sparkles, BarChart3, GraduationCap, Settings, Star, Coins, Trophy, CheckCircle2, Circle } from "lucide-react";
import { useRequireAccess } from "@/hooks/useRequireAccess";
import { dispatcherNav } from "@/data/navigation";
import { moduleShells } from "@/data/modules";
import { missions } from "@/data/missions";
import { levels } from "@/data/levels";
import { canAccessRoute } from "@/lib/access";
import DispatcherLayout from "@/components/dispatcher/DispatcherLayout";
import AccessGate from "@/components/game/AccessGate";
import ResetProgress from "./ResetProgress";
import { features } from "@/data/features";

const ICONS = { "ai-assistant": Sparkles, reports: BarChart3, learning: GraduationCap, settings: Settings };

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-line bg-navy-900/60 p-3">
      <Icon className="size-4 text-cyan-bright" aria-hidden="true" />
      <p className="mt-1 text-xl font-extrabold tabular-nums text-ink">{value}</p>
      <p className="label-xs">{label}</p>
    </div>
  );
}

// Per-module extras that use the saved progress (no new data): results, missions, profile.
function Extras({ id, state, router, reset }) {
  const missionRows = levels.filter((l) => l.missionId && missions[l.missionId]);
  const done = (l) => state.completedLevels.includes(l.id);
  if (id === "reports") {
    return (
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Trophy} label="XP" value={state.xp} />
        <Stat icon={Star} label="Stars" value={state.stars} />
        {features.coins && <Stat icon={Coins} label="Coins" value={state.coins} />}
        <Stat icon={CheckCircle2} label="Missions done" value={`${state.completedLevels.length} / ${missionRows.length}`} />
      </div>
    );
  }
  if (id === "learning") {
    return (
      <ul className="mt-4 space-y-1.5" aria-label="Missions">
        {missionRows.map((l) => (
          <li key={l.id} className="flex items-center gap-2 rounded-lg border border-line bg-navy-900/60 px-3 py-2 text-sm">
            {done(l) ? <CheckCircle2 className="size-4 text-success" aria-label="Completed" /> : <Circle className="size-4 text-ink-dim" aria-label="Not completed" />}
            <span className="min-w-0 flex-1 truncate font-semibold text-ink">
              Level {l.id}: {l.title}
            </span>
            <button type="button" onClick={() => router.push(l.route)} className="text-xs font-semibold text-cyan-bright hover:underline">
              Open
            </button>
          </li>
        ))}
      </ul>
    );
  }
  if (id === "settings") {
    return (
      <div className="mt-4 rounded-xl border border-line bg-navy-900/60 p-3 text-sm">
        <p className="text-ink">
          <span className="label-xs mr-2">Name</span>
          {state.profile?.name}
        </p>
        <p className="mt-1 text-ink">
          <span className="label-xs mr-2">Role</span>
          {state.profile?.role}
        </p>
        <p className="mt-1 text-ink">
          <span className="label-xs mr-2">Avatar</span>
          {state.avatarSelection ?? "Not chosen"}
        </p>
        <ResetProgress
          onReset={() => {
            reset();
            router.replace("/login");
          }}
        />
      </div>
    );
  }
  return null;
}

// Accessible shell for AI Assistant, Reports, Learning and Settings. Access uses the same rule as the
// sidebar; content comes from src/data/modules.js.
export default function ModulePage({ moduleId }) {
  const router = useRouter();
  const { state, allowed, reset } = useRequireAccess();
  const mod = moduleShells[moduleId];

  if (!allowed) return <main className="game-backdrop min-h-screen" />;
  if (!canAccessRoute(dispatcherNav, mod.route, state)) {
    return <AccessGate title={`${mod.eyebrow} is locked`} text="Complete Driver Communication + Load Assignment (Mission 5) to unlock this module." action="Back to Level Map" onAction={() => router.push("/home")} />;
  }
  const Icon = ICONS[moduleId];

  return (
    <DispatcherLayout activeId={mod.navId}>
      <div className="mx-auto max-w-5xl space-y-4">
        <section className="rounded-2xl border border-cyan/15 bg-navy-900 p-5 shadow-[0_8px_30px_rgb(0_0_0/0.3)]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-blue/25 text-cyan-bright">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">{mod.eyebrow}</p>
              <h1 className="text-xl font-extrabold text-ink sm:text-2xl">{mod.title}</h1>
            </div>
            <span className="rounded-full border border-cyan/40 bg-cyan/10 px-2.5 py-1 text-[11px] font-bold text-cyan-bright">{mod.badge}</span>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-ink-dim">{mod.subtitle}</p>
          <Extras id={moduleId} state={state} router={router} reset={reset} />
        </section>

        <ul className="grid gap-3 sm:grid-cols-2">
          {mod.features.map((f) => (
            <li key={f.title} className="panel p-4">
              <h2 className="text-sm font-extrabold text-ink">{f.title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-ink-dim">{f.text}</p>
            </li>
          ))}
        </ul>
        <p className="text-center text-xs text-ink-dim">{mod.note}</p>
      </div>
    </DispatcherLayout>
  );
}
