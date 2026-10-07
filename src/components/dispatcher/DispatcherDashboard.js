import { Truck, CheckCircle2, ArrowRight, Lock, MousePointerClick, IdCard, Clock, MapPin } from "lucide-react";
import { useGameProgress } from "@/hooks/useGameProgress";
import { getDashboard } from "@/lib/dashboardStats";
import GameImage from "@/components/game/GameImage";
import GameButton from "@/components/game/GameButton";
import ProgressBar from "@/components/game/ProgressBar";
import TrainingAgentSlot from "@/components/training/TrainingAgentSlot";
import { StatCards, CurrentShipment, TrackingSummary, NeedsAttention, DispatchOverview, RecentActivity, QuickActions, TrainingProgress } from "@/components/dashboard/OperationsDashboard";

// Which workspace section each mission task is done in, and its icon.
const taskMeta = {
  "open-trucks": { section: "trucks", icon: Truck, tone: "bg-blue/20 text-blue" },
  "find-dry-van": { section: "trucks", icon: MousePointerClick, tone: "bg-success/20 text-success" },
  "open-driver": { section: "trucks", icon: IdCard, tone: "bg-gold/20 text-gold-bright" },
  "check-hos": { section: "drivers", icon: Clock, tone: "bg-danger/20 text-danger" },
  "confirm-location": { section: "drivers", icon: MapPin, tone: "bg-cyan/20 text-cyan-bright" },
};

function Panel({ title, action, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-line bg-surface/90 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

// Brand-new player (Mission 1 in progress): the guided welcome and task list lead.
// After Mission 1 the operational control-center view is the main experience.
export default function DispatcherDashboard({ m, onContinue, onNavigate }) {
  const { state } = useGameProgress();
  const { mission, progress, task } = m;
  const total = mission.tasks.length;
  const done = progress.completedTasks.length;
  // Operational numbers come from the saved simulation (lib/dashboardStats.js), never from constants.
  const dash = getDashboard(state);
  const liveRecord = dash.records.find((r) => r.live) ?? null;

  return (
    <div className="space-y-3.5">
      {task ? (
        <section className="relative overflow-hidden rounded-2xl border border-line bg-navy-900">
          <GameImage
            src="/images/login-truck.png"
            alt=""
            sizes="70vw"
            className="absolute inset-y-0 left-[26%] right-0 [mask-image:linear-gradient(90deg,transparent,#000_35%)]"
          />
          <div className="absolute inset-0 bg-linear-to-r from-navy-950/90 via-navy-950/40 to-navy-950/20" />
          <div className="relative grid items-center gap-4 p-5 sm:p-7 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Welcome back, {state.profile.name}!</h1>
              <p className="mt-1 text-sm text-ink-dim">Continue your journey to become a professional dispatcher.</p>
              <div className="mt-5 max-w-md rounded-xl border-l-4 border-l-success border-y border-r border-line bg-navy-950/75 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-ink">Phase 1: Foundation</span>
                  <span className="font-semibold tabular-nums text-cyan-bright">{Math.round((done / total) * 100)}%</span>
                </div>
                <ProgressBar value={done} max={total} tone="success" label="Phase 1 progress" className="mt-2" />
                <p className="mt-2 text-xs text-ink-dim">
                  {done} of {total} tasks completed
                </p>
                <GameButton onClick={onContinue} className="mt-3">
                  Continue Mission <ArrowRight className="size-4" aria-hidden="true" />
                </GameButton>
              </div>
            </div>
            <div className="flex items-end justify-end gap-2">
              <div className="rounded-2xl border border-cyan/25 bg-navy-950/80 p-4 text-sm backdrop-blur-sm sm:max-w-xs">
                <p className="font-bold text-ink">Training Agent</p>
                <p className="mt-2 text-ink-dim">
                  Your next task is <span className="font-semibold text-ink">&quot;{task.title}&quot;</span>. {task.instruction}
                </p>
                <GameButton onClick={onContinue} className="mt-3 w-full">
                  Let&apos;s Continue <ArrowRight className="size-4" aria-hidden="true" />
                </GameButton>
              </div>
              <TrainingAgentSlot gender={state.avatarSelection ?? "male"} className="-mb-5 hidden h-56 w-36 shrink-0 sm:block" />
            </div>
          </div>
        </section>
      ) : (
        <header>
          <h1 className="text-xl font-extrabold text-ink sm:text-2xl">Dispatch Control Center</h1>
          <p className="text-xs text-ink-dim">Welcome back, {state.profile.name}. Here is where your dispatches stand.</p>
        </header>
      )}

      <StatCards cards={dash.cards} onNavigate={onNavigate} />

      {task ? (
        <Panel title="Upcoming Tasks">
          <ul className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {mission.tasks.map((t, i) => {
              const meta = taskMeta[t.id];
              const Icon = meta.icon;
              const isDone = progress.completedTasks.includes(t.id);
              const current = i === progress.currentTask && !progress.completed;
              return (
                <li key={t.id} className={`flex items-center gap-3 rounded-xl border p-2.5 ${current ? "border-cyan bg-surface-2" : "border-line bg-navy-900/60"}`}>
                  <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${meta.tone}`}>
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className={`min-w-0 flex-1 text-sm ${current ? "font-semibold text-ink" : "text-ink-dim"}`}>{t.title}</span>
                  {isDone ? (
                    <CheckCircle2 className="size-5 shrink-0 text-success" aria-label="Done" />
                  ) : current ? (
                    <GameButton className="shrink-0 px-3 py-1.5 text-xs" onClick={() => onNavigate(meta.section)}>
                      Start
                    </GameButton>
                  ) : (
                    <Lock className="size-4 shrink-0 text-ink-dim" aria-label="Locked until earlier tasks are done" />
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      ) : (
        <>
          <div className="grid items-start gap-3 xl:grid-cols-[1.6fr_1fr]">
            <CurrentShipment current={dash.current} hasPending={dash.pending.length > 0} actions={dash.actions} onNavigate={onNavigate} />
            <div className="space-y-3">
              <TrackingSummary tracking={dash.tracking} />
              <NeedsAttention items={dash.attention} onNavigate={onNavigate} />
            </div>
          </div>

          <DispatchOverview records={dash.records} actions={dash.actions} onNavigate={onNavigate} />

          <div className="grid items-start gap-3 lg:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr]">
            <RecentActivity events={dash.activity} context={liveRecord ? `${liveRecord.reference}${liveRecord.driverName ? ` · ${liveRecord.driverName}` : ""}` : null} />
            <TrainingProgress progress={dash.progress} />
            <QuickActions actions={dash.actions} onNavigate={onNavigate} />
          </div>
        </>
      )}
    </div>
  );
}
