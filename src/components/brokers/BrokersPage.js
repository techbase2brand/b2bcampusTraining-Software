"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Lock } from "lucide-react";
import { useRequireAccess } from "@/hooks/useRequireAccess";
import { useBrokerMission } from "@/hooks/useBrokerMission";
import { dispatcherNav } from "@/data/navigation";
import { mission04, phase5Page } from "@/data/phase5Missions";
import { canAccessRoute } from "@/lib/access";
import { getDispatchBySlug, projectDispatchState, ROUTES } from "@/lib/dispatchRecords";
import { formatCurrency } from "@/lib/text";
import DispatcherLayout from "@/components/dispatcher/DispatcherLayout";
import GameButton from "@/components/game/GameButton";
import GameModal from "@/components/game/GameModal";
import MissionTaskBar from "@/components/game/MissionTaskBar";
import PhaseProgressCard from "@/components/loadboard/PhaseProgressCard";
import PhaseComplete from "@/components/training/PhaseComplete";
import { getCompletionStats } from "@/lib/completionStats";
import BrokerList from "./BrokerList";
import BrokerChat from "./BrokerChat";
import LoadSummary from "./LoadSummary";
import NegotiationHelper from "./NegotiationHelper";
import PracticeSummary from "@/components/practice/PracticeSummary";
import DispatchBar from "@/components/dispatches/DispatchBar";
import DispatchNotFound from "@/components/dispatches/DispatchNotFound";

// LOCK IN: the explicit, permanent decision. Only this commits the deal that Driver Assignment will receive.
function LockInModal({ m, open, onClose }) {
  const { load, vars } = m.cc;
  const rate = m.comms.negotiation.agreedRate;
  return (
    <GameModal open={open} onClose={onClose} title="Lock in this deal">
      <h2 className="text-xl font-extrabold uppercase text-ink">Lock in this deal?</h2>
      <p className="mt-3 text-sm font-bold text-ink">{vars.ref}</p>
      <p className="text-xs text-ink-dim">
        {vars.origin} → {vars.destination}
      </p>
      <p className="mt-2 text-xs text-ink-dim">Agreed rate</p>
      <p className="text-3xl font-extrabold tabular-nums text-success">{formatCurrency(rate ?? load.rate)}</p>
      <p className="mt-3 text-sm text-ink-dim">Locking in makes this the load and rate used in Driver Assignment. You cannot change it afterwards.</p>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <GameButton variant="ghost" onClick={onClose}>
          BACK
        </GameButton>
        <GameButton
          onClick={() => {
            m.finalize();
            onClose();
          }}
        >
          LOCK IN DEAL
        </GameButton>
      </div>
    </GameModal>
  );
}

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

// Access gate: the Brokers module must be unlocked (same rule as the sidebar) and this dispatch must
// have a candidate load from Load Analysis. The dispatch comes from the slug in the URL.
export default function BrokersPage() {
  const router = useRouter();
  const { dispatchSlug } = useParams();
  const { state: global, allowed } = useRequireAccess();

  if (!allowed) return <main className="game-backdrop min-h-screen" />;

  const record = getDispatchBySlug(global, dispatchSlug);
  if (!record) return <DispatchNotFound slug={dispatchSlug} />;
  const state = projectDispatchState(global, record);
  if (!canAccessRoute(dispatcherNav, "/dispatcher/brokers", global)) {
    return <Gate title="Brokers is locked" text="Complete Load Analysis & Matching (Mission 3) to unlock Broker Communication." action="Back to Level Map" onAction={() => router.push("/home")} />;
  }
  if (!state.selectedBestLoadId) {
    return <Gate title="Choose a load first" text="Broker Communication continues with the load you chose in Load Analysis. You can come back and try another load at any time." action="Go to Load Analysis" onAction={() => router.push(ROUTES.analysis(dispatchSlug))} />;
  }

  return <Brokers slug={dispatchSlug} />;
}

// Column height on large screens: the workspace fills the viewport under the task bar, and each
// column scrolls inside itself, so the page does not grow just because a panel is long.
const WORK_H = "lg:h-[calc(100dvh-21rem)] lg:min-h-[22rem]";
// Third column only gets a fixed height once it sits beside the chat (>= 1360px); below that it stacks.
const WORK_H_WIDE = "min-[1360px]:h-[calc(100dvh-21rem)] min-[1360px]:min-h-[22rem]";

function Brokers({ slug }) {
  const router = useRouter();
  const m = useBrokerMission(slug);
  const [tab, setTab] = useState("brokers"); // below lg: one panel at a time
  const [mode, setMode] = useState("chat"); // Chat / Call inside the workspace
  const [draft, setDraft] = useState("");
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const { run, task } = m;

  const highlight = run.started && !run.completed ? task?.highlight ?? null : null;
  const pct = Math.round((run.completedTasks.length / mission04.tasks.length) * 100);
  const finish = () => {
    m.complete();
    setShowComplete(true);
  };

  // The one main action for the current task. Chat and negotiation tasks have none: they happen in
  // the workspace, so the bar just points there.
  // This attempt reached an agreement: keep the deal (finalize) or practise with another load.
  const keepDeal = m.attemptDone && !m.finalized ? { label: "Lock In Deal", onClick: () => setFinalizeOpen(true) } : null;
  const tryAnother = () => {
    m.tryAnother();
    router.push(ROUTES.analysis(slug));
  };
  const linkBtn = "w-full rounded-lg app-border py-1.5 text-xs font-semibold text-ink transition-colors hover:border-cyan hover:text-cyan-bright";
  const PRIMARY = {
    "details-review": { label: "Mark Details Reviewed", onClick: m.reviewDetails, disabled: !m.correctSelected },
    confirm: { label: "Review Agreement", onClick: () => setAgreementOpen(true) },
  };
  const WHERE = {
    "broker-list": "Pick the broker from the list on the left.",
    chat: "Ask in the chat below.",
    helper: "Write your request in the chat. The helper can suggest wording.",
  };

  return (
    <DispatcherLayout activeId="brokers" footer={<PhaseProgressCard pct={pct} phaseLabel="Mission 4 Progress" levelLabel="Level 4" title={mission04.title} />}>
      <div className="mx-auto max-w-[110rem] space-y-3">
        <DispatchBar slug={slug} />
        <MissionTaskBar eyebrow={phase5Page.eyebrow} title={phase5Page.title} m={m} primary={run.started ? keepDeal ?? PRIMARY[highlight] ?? null : null} where={WHERE[highlight]} doneText={m.finalized ? undefined : "Agreement confirmed. Lock in this deal, or try another load to compare."} onComplete={finish} />

        {/* Below lg: tab bar, one panel at a time. */}
        <div role="tablist" aria-label="Mission panels" className="grid grid-cols-3 gap-1 rounded-xl bg-navy-900 p-1 text-xs font-semibold lg:hidden">
          {phase5Page.panelTabs.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`rounded-lg py-2 ${tab === t.id ? "bg-blue text-white" : "text-ink-dim"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid items-start gap-3 lg:max-[1359px]:grid-cols-[15.5rem_minmax(0,1fr)] min-[1360px]:max-[1699px]:grid-cols-[14rem_minmax(0,1fr)_16rem] min-[1700px]:grid-cols-[15rem_minmax(0,1fr)_17rem]">
          <div className={`${tab === "brokers" ? "block h-[70vh] min-h-[26rem]" : "hidden"} lg:block ${WORK_H}`}>
            <BrokerList m={m} highlight={highlight} />
          </div>
          <div className={`${tab === "chat" ? "block h-[75vh] min-h-[28rem]" : "hidden"} lg:block ${WORK_H}`}>
            <BrokerChat m={m} draft={draft} setDraft={setDraft} highlight={highlight} mode={mode} setMode={setMode} />
          </div>
          <div className={`${tab === "load" ? "block" : "hidden"} space-y-3 lg:block lg:max-[1359px]:col-span-2 min-[1360px]:overflow-y-auto min-[1360px]:pr-1 ${WORK_H_WIDE}`}>
            <LoadSummary m={m} highlight={highlight} />
            <NegotiationHelper m={m} setDraft={setDraft} highlight={highlight} agreementOpen={agreementOpen} setAgreementOpen={setAgreementOpen} />
            <PracticeSummary slug={slug}>
              <div className="mt-2 space-y-1.5">
                {m.finalized ? (
                  <>
                    <p className="flex items-center gap-1.5 text-xs font-bold text-success">✓ DEAL LOCKED IN</p>
                    <GameButton size="sm" variant="ghost" className="w-full" onClick={() => router.push(ROUTES.assignment(slug))}>
                      Continue to Driver Assignment
                    </GameButton>
                  </>
                ) : (
                  <>
                    <button type="button" className={linkBtn} onClick={tryAnother}>
                      Try Another Load
                    </button>
                    <button type="button" className={linkBtn} onClick={() => router.push(ROUTES.analysis(slug))}>
                      Compare Again
                    </button>
                    <button type="button" className={linkBtn} onClick={() => router.push(ROUTES.board)}>
                      Back to Load Board
                    </button>
                  </>
                )}
              </div>
            </PracticeSummary>
          </div>
        </div>
      </div>

      <LockInModal m={m} open={finalizeOpen} onClose={() => setFinalizeOpen(false)} />

      {showComplete && run.completed && (() => {
        const sum = m.summary();
        const copy = phase5Page.completion;
        return (
          <PhaseComplete
            missionName={mission04.title}
            subtitle={copy.subtitle}
            unlocked={copy.unlocked}
            stars={sum.stars}
            stats={getCompletionStats(run, mission04)}
            rows={[
              ["Broker Selected", sum.broker],
              ["Questions Verified", sum.questionsVerified],
              ["Negotiation Attempts", sum.negotiationAttempts],
              ["Final Agreed Rate", formatCurrency(sum.agreedRate)],
              ["Rate Improvement", `${sum.rateImprovement >= 0 ? "+" : "-"}${formatCurrency(Math.abs(sum.rateImprovement))}`],
              ["Communication Accuracy", `${sum.communicationAccuracy}%`],
            ]}
            onPrimary={() => router.push("/home")}
          />
        );
      })()}
    </DispatcherLayout>
  );
}
