"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { useRequireAccess } from "@/hooks/useRequireAccess";
import { useDispatchMission } from "@/hooks/useDispatchMission";
import { dispatcherNav } from "@/data/navigation";
import { mission05, phase6Page } from "@/data/phase6Missions";
import { canAccessRoute } from "@/lib/access";
import { listCompatibleLoadIds } from "@/lib/loadRules";
import DispatcherLayout from "@/components/dispatcher/DispatcherLayout";
import GameButton from "@/components/game/GameButton";
import PhaseProgressCard from "@/components/loadboard/PhaseProgressCard";
import PhaseComplete from "@/components/training/PhaseComplete";
import DispatchHeader from "./DispatchHeader";
import DriverList from "./DriverList";
import DriverCommsPanel from "./DriverCommsPanel";
import DispatchSheetPanel from "./DispatchSheetPanel";
import LoadDriverPanel from "./LoadDriverPanel";
import DispatchWorkflow from "./DispatchWorkflow";

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

// Access gate: Dispatch must be unlocked (same rule as the sidebar) and Mission 4 must have left a
// negotiated load. `?preview=1` (development only) uses a demo load, not saved.
export default function DispatchPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { state, allowed } = useRequireAccess();

  if (!allowed) return <main className="game-backdrop min-h-screen" />;

  const preview = params.get("preview") === "1";
  if (!preview && !canAccessRoute(dispatcherNav, "/dispatcher/dispatch", state)) {
    return <Gate title="Dispatch is locked" text="Complete Broker Communication (Mission 4) to unlock Driver Communication + Load Assignment." action="Back to Level Map" onAction={() => router.push("/home")} />;
  }
  const hasLoad = state.negotiatedLoadId ?? state.selectedBestLoadId;
  if (!preview && !hasLoad) {
    return <Gate title="Negotiate a load first" text="Dispatch continues with the load you negotiated with the broker." action="Go to Brokers" onAction={() => router.push("/dispatcher/brokers")} />;
  }

  const previewLoadId = preview && !hasLoad ? listCompatibleLoadIds()[0] ?? null : null;
  return <Dispatch avatar={state.avatarSelection ?? "male"} previewLoadId={previewLoadId} />;
}

// Column heights on large screens: the workspace fills the viewport under the header, and each
// column scrolls inside itself, so the page does not grow just because a panel is long.
const WORK_H = "lg:h-[calc(100vh-15.5rem)] lg:min-h-[32rem]";
const COL_H = "2xl:h-[calc(100vh-15.5rem)] 2xl:min-h-[32rem]";

function Dispatch({ avatar, previewLoadId }) {
  const router = useRouter();
  const m = useDispatchMission(previewLoadId);
  const [tab, setTab] = useState("drivers"); // below lg: one panel at a time
  const [sec, setSec] = useState("details"); // lg to 2xl: Dispatch Sheet / Load & Driver under the main row
  const [draft, setDraft] = useState("");
  const [showComplete, setShowComplete] = useState(false);
  const { run, task } = m;

  const highlight = run.started && !run.completed ? task?.highlight ?? null : null;
  const pct = Math.round((run.completedTasks.length / mission05.tasks.length) * 100);
  const finish = () => {
    m.complete();
    setShowComplete(true);
  };
  // Visibility: mobile tab, then the lg-2xl secondary tab, then always visible at 2xl.
  const secondary = (id) => `${tab === id ? "block" : "hidden"} ${sec === id ? "lg:block" : "lg:hidden"} 2xl:block lg:col-span-2 2xl:col-span-1`;

  return (
    <DispatcherLayout activeId="dispatch" footer={<PhaseProgressCard pct={pct} phaseLabel="Mission 5 Progress" levelLabel="Level 5" title={mission05.title} />}>
      <div className="mx-auto max-w-[110rem] space-y-3">
        <DispatchHeader m={m} gender={avatar} />

        {/* Below lg: tab bar, one panel at a time. */}
        <div role="tablist" aria-label="Mission panels" className="grid grid-cols-4 gap-1 rounded-xl bg-navy-900 p-1 text-[11px] font-semibold lg:hidden">
          {phase6Page.panelTabs.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`rounded-lg py-2 ${tab === t.id ? "bg-blue text-white" : "text-ink-dim"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid items-start gap-3 lg:grid-cols-[15rem_minmax(0,1fr)] 2xl:grid-cols-[15rem_minmax(0,1fr)_19rem_19rem]">
          <div className={`${tab === "drivers" ? "block h-[70vh] min-h-[26rem]" : "hidden"} lg:block ${WORK_H}`}>
            <DriverList m={m} highlight={highlight} />
          </div>
          <div className={`${tab === "comms" ? "block h-[75vh] min-h-[28rem]" : "hidden"} lg:block ${WORK_H}`}>
            <DriverCommsPanel m={m} highlight={highlight} draft={draft} setDraft={setDraft} />
          </div>

          {/* lg to 2xl: tabs for the secondary panels under the main row. */}
          <div role="tablist" aria-label="More panels" className="hidden gap-1 rounded-xl bg-navy-900 p-1 text-xs font-semibold lg:col-span-2 lg:grid lg:grid-cols-2 2xl:hidden">
            {phase6Page.secondaryTabs.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={sec === t.id} onClick={() => setSec(t.id)} className={`rounded-lg py-2 ${sec === t.id ? "bg-blue text-white" : "text-ink-dim hover:text-ink"}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className={`${secondary("dispatch")} ${COL_H} lg:max-h-[calc(100vh-13rem)] lg:overflow-y-auto 2xl:max-h-none`}>
            <DispatchSheetPanel m={m} highlight={highlight} />
          </div>
          <div className={`${secondary("details")} ${COL_H} lg:max-h-[calc(100vh-13rem)] lg:overflow-y-auto 2xl:max-h-none 2xl:pr-1`}>
            <LoadDriverPanel m={m} highlight={highlight} />
          </div>
        </div>

        <DispatchWorkflow m={m} onComplete={finish} />
      </div>

      {showComplete && run.completed && (() => {
        const sum = m.summary();
        const copy = phase6Page.completion;
        return (
          <PhaseComplete
            title={copy.title}
            subtitle={copy.subtitle}
            unlocked={copy.unlocked}
            stars={sum.stars}
            rows={[
              ["Driver / Truck", `${sum.driver} · ${sum.truck}`],
              ["Remaining HOS / Deadhead", `${sum.remainingHos} · ${sum.deadhead}`],
              ["Dispatch Sent / Confirmed", `${sum.dispatchSent} / ${sum.driverConfirmed}`],
              ["Load Status", sum.status],
              ["Incorrect Attempts / Hints", `${sum.incorrect} / ${sum.hintsUsed}`],
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
