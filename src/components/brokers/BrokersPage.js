"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { useRequireAccess } from "@/hooks/useRequireAccess";
import { useBrokerMission } from "@/hooks/useBrokerMission";
import { dispatcherNav } from "@/data/navigation";
import { mission04, phase5Page } from "@/data/phase5Missions";
import { canAccessRoute } from "@/lib/access";
import { listCompatibleLoadIds } from "@/lib/loadRules";
import { formatCurrency } from "@/lib/text";
import DispatcherLayout from "@/components/dispatcher/DispatcherLayout";
import GameButton from "@/components/game/GameButton";
import PhaseProgressCard from "@/components/loadboard/PhaseProgressCard";
import PhaseComplete from "@/components/training/PhaseComplete";
import MissionHeader from "./MissionHeader";
import BrokerList from "./BrokerList";
import BrokerChat from "./BrokerChat";
import CallPanel from "./CallPanel";
import MissionLoadDetails from "./MissionLoadDetails";
import NegotiationHelper from "./NegotiationHelper";
import WorkflowStrip from "./WorkflowStrip";

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

// Access gate: the Brokers module must be unlocked (same rule as the sidebar) and a best load must
// have been selected in Load Analysis. `?preview=1` (development only) uses a demo load, not saved.
export default function BrokersPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { state, allowed } = useRequireAccess();

  if (!allowed) return <main className="game-backdrop min-h-screen" />;

  const preview = params.get("preview") === "1";
  if (!preview && !canAccessRoute(dispatcherNav, "/dispatcher/brokers", state)) {
    return <Gate title="Brokers is locked" text="Complete Load Analysis & Matching (Mission 3) to unlock Broker Communication." action="Back to Level Map" onAction={() => router.push("/home")} />;
  }
  if (!preview && !state.selectedBestLoadId) {
    return <Gate title="Select your best load first" text="Broker Communication continues with the load you selected in Load Analysis." action="Go to Load Analysis" onAction={() => router.push("/dispatcher/load-analysis")} />;
  }

  const previewLoadId = preview && !state.selectedBestLoadId ? listCompatibleLoadIds()[0] ?? null : null;
  return <Brokers avatar={state.avatarSelection ?? "male"} previewLoadId={previewLoadId} />;
}

// Column heights on large screens: the workspace fills the viewport under the header, and each
// column scrolls inside itself, so the page does not grow just because a panel is long.
const WORK_H = "lg:h-[calc(100vh-15.5rem)] lg:min-h-[32rem]";
const COL_H = "2xl:h-[calc(100vh-15.5rem)] 2xl:min-h-[32rem]";

function Brokers({ avatar, previewLoadId }) {
  const router = useRouter();
  const m = useBrokerMission(previewLoadId);
  const [tab, setTab] = useState("brokers"); // below lg: one panel at a time
  const [sec, setSec] = useState("details"); // lg to 2xl: Call / Load Details / Negotiation under the main row
  const [draft, setDraft] = useState("");
  const [showComplete, setShowComplete] = useState(false);
  const { run, task } = m;

  const highlight = run.started && !run.completed ? task?.highlight ?? null : null;
  const pct = Math.round((run.completedTasks.length / mission04.tasks.length) * 100);
  const finish = () => {
    m.complete();
    setShowComplete(true);
  };
  // Visibility: mobile tab, then the lg-2xl secondary tab, then always visible at 2xl.
  const secondary = (id) => `${tab === id ? "block" : "hidden"} ${sec === id ? "lg:block" : "lg:hidden"} 2xl:block lg:col-span-2 2xl:col-span-1`;

  return (
    <DispatcherLayout activeId="brokers" footer={<PhaseProgressCard pct={pct} phaseLabel="Mission 4 Progress" levelLabel="Level 4" title={mission04.title} />}>
      <div className="mx-auto max-w-[110rem] space-y-3">
        <MissionHeader m={m} gender={avatar} />

        {/* Below lg: tab bar, one panel at a time. */}
        <div role="tablist" aria-label="Mission panels" className="grid grid-cols-5 gap-1 rounded-xl bg-navy-900 p-1 text-[11px] font-semibold lg:hidden">
          {phase5Page.panelTabs.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`rounded-lg py-2 ${tab === t.id ? "bg-blue text-white" : "text-ink-dim"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid items-start gap-3 lg:grid-cols-[15rem_minmax(0,1fr)] 2xl:grid-cols-[15rem_minmax(0,1fr)_14.5rem_19rem]">
          <div className={`${tab === "brokers" ? "block" : "hidden"} lg:block ${WORK_H}`}>
            <BrokerList m={m} highlight={highlight} />
          </div>
          <div className={`${tab === "chat" ? "block" : "hidden"} lg:block ${WORK_H}`}>
            <BrokerChat
              m={m}
              draft={draft}
              setDraft={setDraft}
              highlight={highlight}
              onCall={() => {
                m.startCall();
                setTab("call");
                setSec("call");
              }}
            />
          </div>

          {/* lg to 2xl: tabs for the secondary panels under the main row. */}
          <div role="tablist" aria-label="More panels" className="hidden gap-1 rounded-xl bg-navy-900 p-1 text-xs font-semibold lg:col-span-2 lg:grid lg:grid-cols-3 2xl:hidden">
            {phase5Page.secondaryTabs.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={sec === t.id} onClick={() => setSec(t.id)} className={`rounded-lg py-2 ${sec === t.id ? "bg-blue text-white" : "text-ink-dim hover:text-ink"}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className={`${secondary("call")} ${COL_H} 2xl:overflow-y-auto`}>
            <CallPanel m={m} />
          </div>

          <div className={`contents ${COL_H} 2xl:block 2xl:space-y-3 2xl:overflow-y-auto 2xl:pr-1`}>
            <div className={secondary("details")}>
              <MissionLoadDetails m={m} highlight={highlight} />
            </div>
            <div className={secondary("helper")}>
              <NegotiationHelper m={m} setDraft={setDraft} highlight={highlight} />
            </div>
          </div>
        </div>

        <WorkflowStrip m={m} onComplete={finish} />
      </div>

      {showComplete && run.completed && (() => {
        const sum = m.summary();
        const copy = phase5Page.completion;
        return (
          <PhaseComplete
            title={copy.title}
            subtitle={copy.subtitle}
            unlocked={copy.unlocked}
            stars={sum.stars}
            rows={[
              ["Broker Selected", sum.broker],
              ["Questions Verified", sum.questionsVerified],
              ["Negotiation Attempts", sum.negotiationAttempts],
              ["Final Agreed Rate", formatCurrency(sum.agreedRate)],
              ["Rate Improvement", `${sum.rateImprovement >= 0 ? "+" : "-"}${formatCurrency(Math.abs(sum.rateImprovement))}`],
              ["Communication Accuracy", `${sum.communicationAccuracy}%`],
              ["Hints Used", sum.hintsUsed],
              ["XP Earned", `+${sum.xp}`],
            ]}
            primaryLabel={copy.cta}
            onPrimary={() => router.push("/home")}
            secondaryLabel={copy.secondary}
            onSecondary={() => setShowComplete(false)}
          />
        );
      })()}
    </DispatcherLayout>
  );
}
