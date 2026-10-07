"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { useRequireAccess } from "@/hooks/useRequireAccess";
import { usePhase4Mission } from "@/hooks/usePhase4Mission";
import { mission03, phase4Page } from "@/data/phase4Missions";
import { simulationConfig } from "@/data/simulationConfig";
import { listCompatibleLoadIds } from "@/lib/loadRules";
import { hasReachedLevel } from "@/lib/access";
import DispatcherLayout from "@/components/dispatcher/DispatcherLayout";
import GameButton from "@/components/game/GameButton";
import GameImage from "@/components/game/GameImage";
import PhaseProgressCard from "@/components/loadboard/PhaseProgressCard";
import PhaseComplete from "@/components/training/PhaseComplete";
import StepTracker from "./StepTracker";
import AssignedTruckPanel from "./AssignedTruckPanel";
import ShortlistedLoadCards from "./ShortlistedLoadCards";
import AgentPanel from "./AgentPanel";
import AnalysisTabs from "./AnalysisTabs";
import SelectedLoadPanel from "./SelectedLoadPanel";
import DecisionReasonPanel from "./DecisionReasonPanel";
import BestLoadConfirmation from "./BestLoadConfirmation";
import FlowStrip from "./FlowStrip";

const LEVEL_ID = mission03.levelId;

function Gate({ title, text, action, onAction }) {
  return (
    <main className="game-backdrop grid min-h-screen place-items-center p-6">
      <div className="max-w-md rounded-2xl border border-line bg-surface/90 p-8 text-center">
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

// Access gate: Level 3 must be unlocked and the Phase 3 shortlist present.
// `?preview=1` (development only) shows the page with a demo shortlist that is not saved.
export default function LoadAnalysisPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { state, allowed } = useRequireAccess();

  if (!allowed) return <main className="game-backdrop min-h-screen" />;

  const preview = params.get("preview") === "1";
  const unlocked = hasReachedLevel(state, LEVEL_ID);
  const shortlist = state.shortlistedLoadIds ?? [];

  if (!preview && !unlocked) {
    return <Gate title="Load Analysis is locked" text="Complete Finding Loads (Phase 3) to unlock this mission." action="Back to Level Map" onAction={() => router.push("/home")} />;
  }
  if (!preview && shortlist.length < simulationConfig.shortlist.min) {
    return (
      <Gate
        title="Shortlist your loads first"
        text={`Load Analysis compares the loads you shortlisted in Phase 3. You need at least ${simulationConfig.shortlist.min}.`}
        action="Back to the Load Board"
        onAction={() => router.push("/dispatcher/load-board")}
      />
    );
  }

  return <LoadAnalysis avatar={state.avatarSelection ?? "male"} previewIds={preview && shortlist.length < simulationConfig.shortlist.min ? listCompatibleLoadIds().slice(0, 3) : null} />;
}

function LoadAnalysis({ avatar, previewIds }) {
  const router = useRouter();
  const m = usePhase4Mission(previewIds);
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

  return (
    <DispatcherLayout
      activeId="load-board"
      footer={<PhaseProgressCard pct={pct} phaseLabel="Phase 4 Progress" levelLabel={`Level ${LEVEL_ID}`} title={mission03.title} />}
    >
      <div className="mx-auto max-w-[110rem] space-y-4">
        <section className="relative overflow-hidden rounded-2xl border border-cyan/15 bg-navy-900 shadow-[0_8px_30px_rgb(0_0_0/0.3)]">
          <GameImage src="/images/login-truck.png" alt="" sizes="60vw" className="absolute inset-y-0 left-[30%] right-0 [mask-image:linear-gradient(90deg,transparent,#000_40%)]" />
          <div className="absolute inset-0 bg-linear-to-r from-navy-950 via-navy-950/75 to-navy-950/30" />
          <div className="relative grid items-center gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-gold">{phase4Page.eyebrow}</p>
              <h1 className="mt-1 text-xl font-extrabold uppercase leading-tight tracking-wide text-ink sm:text-2xl">{phase4Page.title}</h1>
              <p className="mt-1.5 max-w-md text-xs leading-relaxed text-ink-dim">{phase4Page.subtitle}</p>
            </div>
            <div className="rounded-xl border border-cyan/25 bg-navy-950/80 p-3 backdrop-blur-sm">
              <StepTracker index={m.stepIndex} completed={run.completed} />
            </div>
          </div>
        </section>

        <div className="grid items-start gap-3 xl:grid-cols-[17rem_minmax(0,1fr)_21rem]">
          <AssignedTruckPanel />
          <ShortlistedLoadCards m={m} highlight={highlight} />
          <AgentPanel m={m} gender={avatar} onFinish={finish} />
        </div>

        <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_21rem]">
          <AnalysisTabs m={m} highlight={highlight} tab={tab} onTab={setTab} />
          <div className="space-y-3">
            <SelectedLoadPanel m={m} highlight={highlight} onSelect={setConfirmId} onShowMap={() => setTab("route")} />
            <DecisionReasonPanel key={`${m.selectedBestLoadId}-${m.accepted}`} m={m} onFinish={finish} />
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
            title={copy.title}
            subtitle={copy.subtitle}
            unlocked={copy.unlocked}
            stars={sum.stars}
            rows={[
              ["Loads Compared", sum.loadsCompared],
              ["Calculation Accuracy", `${sum.accuracy}%`],
              ["Deadhead Awareness", sum.deadheadAwareness],
              ["RPM Understanding", sum.rpmUnderstanding],
              ["Profitability Decision", sum.profitabilityDecision],
              ["Decision Quality", sum.decisionQuality],
              ["Hints Used", sum.hintsUsed],
              ["XP Earned", `+${sum.xp}`],
            ]}
            primaryLabel={copy.cta}
            onPrimary={() => router.push("/dispatcher/brokers")}
            secondaryLabel={copy.secondary}
            onSecondary={() => router.push("/home")}
          />
        );
      })()}
    </DispatcherLayout>
  );
}
