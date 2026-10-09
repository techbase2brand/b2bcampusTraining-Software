"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { useRequireAccess } from "@/hooks/useRequireAccess";
import { usePhase4Mission } from "@/hooks/usePhase4Mission";
import { mission03, phase4Page } from "@/data/phase4Missions";
import { getDispatchBySlug, ROUTES } from "@/lib/dispatchRecords";
import { hasReachedLevel } from "@/lib/access";
import DispatcherLayout from "@/components/dispatcher/DispatcherLayout";
import GameButton from "@/components/game/GameButton";
import GameImage from "@/components/game/GameImage";
import PhaseProgressCard from "@/components/loadboard/PhaseProgressCard";
import PhaseComplete from "@/components/training/PhaseComplete";
import { getCompletionStats } from "@/lib/completionStats";
import StepTracker from "./StepTracker";
import AssignedTruckPanel from "./AssignedTruckPanel";
import ShortlistedLoadCards from "./ShortlistedLoadCards";
import AgentPanel from "./AgentPanel";
import AnalysisTabs from "./AnalysisTabs";
import SelectedLoadPanel from "./SelectedLoadPanel";
import DecisionReasonPanel from "./DecisionReasonPanel";
import BestLoadConfirmation from "./BestLoadConfirmation";
import FlowStrip from "./FlowStrip";
import PracticeSummary from "@/components/practice/PracticeSummary";
import DispatchBar from "@/components/dispatches/DispatchBar";
import DispatchNotFound from "@/components/dispatches/DispatchNotFound";

const LEVEL_ID = mission03.levelId;

function Gate({ title, text, action, onAction }) {
  return (
    <main className="game-backdrop grid min-h-screen place-items-center p-6">
      <div className="max-w-md rounded-2xl app-border bg-surface/90 p-8 text-center">
        <Lock className="mx-auto size-10 text-gold" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-extrabold text-ink">{title}</h1>
        <p className="mt-2 text-sm text-ink-dim">{text}</p>
        <GameButton className="mt-6" onClick={onAction}>
          {action}
        </GameButton>
      </div>
    </main>
  );
}

// Access gate: Level 3 must be unlocked. The dispatch (and its shortlist) comes from the slug.
export default function LoadAnalysisPage() {
  const router = useRouter();
  const { dispatchSlug } = useParams();
  const { state, allowed } = useRequireAccess();

  if (!allowed) return <main className="game-backdrop min-h-screen" />;

  const record = getDispatchBySlug(state, dispatchSlug);
  if (!record) return <DispatchNotFound slug={dispatchSlug} />;
  if (!hasReachedLevel(state, LEVEL_ID)) {
    return <Gate title="Load Analysis is locked" text="Complete Finding Loads (Mission 2) to unlock this mission." action="Back to Level Map" onAction={() => router.push("/home")} />;
  }
  return <LoadAnalysis slug={dispatchSlug} />;
}

function LoadAnalysis({ slug }) {
  const router = useRouter();
  const m = usePhase4Mission(slug);
  const [tab, setTab] = useState("comparison");
  const [confirmId, setConfirmId] = useState(null);
  const [showComplete, setShowComplete] = useState(false);
  const { run, task } = m;

  const highlight = run.started && !run.completed ? task?.highlight ?? null : null;
  const pct = Math.round((run.completedTasks.length / mission03.tasks.length) * 100);
  const finish = () => {
    m.complete();
    setShowComplete(true);
  };
  // Once the mission is complete, "continue" just goes on to the broker for the current candidate.
  const proceed = run.completed ? () => router.push(ROUTES.brokers(slug)) : finish;

  return (
    <DispatcherLayout
      activeId="load-board"
      footer={<PhaseProgressCard pct={pct} phaseLabel="Mission 3 Progress" levelLabel={`Level ${LEVEL_ID}`} title={mission03.title} />}
    >
      <div className="mx-auto max-w-[110rem] space-y-4">
        <DispatchBar slug={slug} />
        <section className="relative overflow-hidden rounded-2xl app-border app-border-subtle bg-navy-900 shadow-[0_8px_30px_rgb(0_0_0/0.3)]">
          <GameImage src="/images/login-truck.png" alt="" sizes="60vw" className="absolute inset-y-0 left-[30%] right-0 [mask-image:linear-gradient(90deg,transparent,#000_40%)]" />
          <div className="absolute inset-0 bg-linear-to-r from-navy-950 via-navy-950/75 to-navy-950/30" />
          <div className="relative grid items-center gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-gold">{phase4Page.eyebrow}</p>
              <h1 className="mt-1 text-xl font-extrabold uppercase leading-tight tracking-wide text-ink sm:text-2xl">{phase4Page.title}</h1>
              <p className="mt-1.5 max-w-md text-xs leading-relaxed text-ink-dim">{phase4Page.subtitle}</p>
            </div>
            <div className="rounded-xl app-border app-border-subtle bg-navy-950/80 p-3 backdrop-blur-sm">
              <StepTracker index={m.stepIndex} completed={run.completed} />
            </div>
          </div>
        </section>

        <div className="grid items-start gap-3 lg:max-[1439px]:grid-cols-[15rem_minmax(0,1fr)] min-[1440px]:grid-cols-[15rem_minmax(0,1fr)_19rem]">
          <AssignedTruckPanel />
          <ShortlistedLoadCards m={m} highlight={highlight} />
          <div className="lg:max-[1439px]:col-span-2">
            <AgentPanel m={m} onFinish={finish} />
          </div>
        </div>

        <div className="grid items-start gap-3 min-[1280px]:grid-cols-[minmax(0,1fr)_clamp(17rem,22vw,21rem)]">
          <AnalysisTabs m={m} highlight={highlight} tab={tab} onTab={setTab} />
          <div className="space-y-3">
            <SelectedLoadPanel m={m} highlight={highlight} onSelect={setConfirmId} onShowMap={() => setTab("route")} />
            <DecisionReasonPanel key={`${m.selectedBestLoadId}-${m.accepted}`} m={m} onFinish={proceed} />
            <PracticeSummary slug={slug}>
              {m.hasBrokerAttempt && (
                <button type="button" onClick={() => router.push(ROUTES.brokers(slug))} className="mt-2 w-full rounded-lg app-border py-1.5 text-xs font-semibold text-ink transition-colors hover:border-cyan hover:text-cyan-bright">
                  Return to Broker
                </button>
              )}
            </PracticeSummary>
          </div>
        </div>

        <FlowStrip stepIndex={m.stepIndex} />
      </div>

      <BestLoadConfirmation
        m={m}
        loadId={confirmId}
        onCancel={() => setConfirmId(null)}
        onConfirm={() => {
          m.choose(confirmId);
          setConfirmId(null);
        }}
      />

      {showComplete && run.completed && (() => {
        const sum = m.summary();
        const copy = phase4Page.completion;
        return (
          <PhaseComplete
            missionName={mission03.title}
            subtitle={copy.subtitle}
            unlocked={copy.unlocked}
            stars={sum.stars}
            stats={getCompletionStats(run, mission03)}
            rows={[
              ["Loads Compared", sum.loadsCompared],
              ["Calculation Accuracy", `${sum.accuracy}%`],
              ["Deadhead Awareness", sum.deadheadAwareness],
              ["RPM Understanding", sum.rpmUnderstanding],
              ["Profitability Decision", sum.profitabilityDecision],
              ["Decision Quality", sum.decisionQuality],
            ]}
            onPrimary={() => router.push(ROUTES.brokers(slug))}
          />
        );
      })()}
    </DispatcherLayout>
  );
}
