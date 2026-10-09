"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Lock } from "lucide-react";
import { useRequireAccess } from "@/hooks/useRequireAccess";
import { useDispatchMission } from "@/hooks/useDispatchMission";
import { dispatcherNav } from "@/data/navigation";
import { mission05, phase6Page } from "@/data/phase6Missions";
import { canAccessRoute } from "@/lib/access";
import { getDispatchBySlug, projectDispatchState, getDispatchResumeRoute, ROUTES } from "@/lib/dispatchRecords";
import { getRosterEntry } from "@/lib/dispatchRoster";
import DispatcherLayout from "@/components/dispatcher/DispatcherLayout";
import GameButton from "@/components/game/GameButton";
import GameDrawer from "@/components/game/GameDrawer";
import MissionTaskBar from "@/components/game/MissionTaskBar";
import PhaseProgressCard from "@/components/loadboard/PhaseProgressCard";
import PhaseComplete from "@/components/training/PhaseComplete";
import { getCompletionStats } from "@/lib/completionStats";
import DispatchBar from "@/components/dispatches/DispatchBar";
import DispatchNotFound from "@/components/dispatches/DispatchNotFound";
import DriverList from "./DriverList";
import DriverCommsPanel from "./DriverCommsPanel";
import DispatchSheetPanel from "./DispatchSheetPanel";
import AssignmentSummary, { NegotiatedLoadCard, DriverDetails } from "./LoadDriverPanel";
import DriverRoutePreview from "./DriverRoutePreview";

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

// Access gate: Dispatch must be unlocked (same rule as the sidebar) and THIS dispatch must have a
// finalized (negotiated) load. The dispatch comes from the slug in the URL.
export default function DispatchPage() {
  const router = useRouter();
  const { dispatchSlug } = useParams();
  const { state: global, allowed } = useRequireAccess();

  if (!allowed) return <main className="game-backdrop min-h-screen" />;

  const record = getDispatchBySlug(global, dispatchSlug);
  if (!record) return <DispatchNotFound slug={dispatchSlug} />;
  const state = projectDispatchState(global, record);
  if (!canAccessRoute(dispatcherNav, "/dispatcher/dispatch", global)) {
    return <Gate title="Dispatch is locked" text="Complete Broker Communication (Mission 4) to unlock Driver Communication + Load Assignment." action="Back to Brokers" onAction={() => router.push(ROUTES.brokers(dispatchSlug))} />;
  }
  if (!state.negotiatedLoadId) {
    return <Gate title="Lock in a deal first" text="Driver assignment continues with the deal you locked in with the broker for this dispatch." action="Go to Brokers" onAction={() => router.push(getDispatchResumeRoute(record))} />;
  }
  return <Dispatch slug={dispatchSlug} />;
}

// Column height on large screens: the workspace fills the viewport under the task bar, and each
// column scrolls inside itself, so the page does not grow just because a panel is long.
const WORK_H = "lg:h-[calc(100dvh-21rem)] lg:min-h-[24rem]";
// Third column only gets a fixed height once it sits beside the chat (>= 1360px); below that it stacks.
const WORK_H_WIDE = "min-[1360px]:h-[calc(100dvh-21rem)] min-[1360px]:min-h-[24rem]";

function Dispatch({ slug }) {
  const router = useRouter();
  const m = useDispatchMission(slug);
  const [tab, setTab] = useState("drivers"); // below lg: one panel at a time
  const [drawer, setDrawer] = useState(null); // "load" | "suitability" | "dispatch" | "route" | null
  const [draft, setDraft] = useState("");
  const [showComplete, setShowComplete] = useState(false);
  const { run, task, d } = m;

  const highlight = run.started && !run.completed ? task?.highlight ?? null : null;
  const pct = Math.round((run.completedTasks.length / mission05.tasks.length) * 100);
  const finish = () => {
    m.complete();
    setShowComplete(true);
  };
  const close = () => setDrawer(null);
  const runCheck = (code) => {
    if (d.selectedDriverId && m.viewDriverId !== d.selectedDriverId) m.viewDriver(d.selectedDriverId);
    m.revealChecks(d.selectedDriverId, [code]);
    setDrawer("suitability");
  };
  const viewed = m.viewDriverId && m.viewDriverId !== d.selectedDriverId ? m.viewDriverId : null;

  // The one main action for the current task. Communication tasks have none: they happen in the
  // chat or call workspace, so the bar just points there.
  const PRIMARY = {
    "load-review": { label: "Mark Load Reviewed", onClick: m.reviewLoad },
    "driver-list": viewed ? { label: "Select This Driver", onClick: () => m.selectDriver(viewed) } : null,
    "check-hos": { label: "Check HOS", onClick: () => runCheck("hos") },
    "check-pickup": { label: "Check Pickup Feasibility", onClick: () => runCheck("pickup") },
    dispatch: { label: "Review Dispatch", onClick: () => setDrawer("dispatch") },
    "confirm-assignment": { label: "Confirm Assignment", onClick: m.confirmAssignment },
  };
  const WHERE = {
    "driver-list": "Pick a driver from the list on the left.",
    comms: "Use the chat or call in the middle.",
  };

  return (
    <DispatcherLayout activeId="dispatch" footer={<PhaseProgressCard pct={pct} phaseLabel="Mission 5 Progress" levelLabel="Level 5" title={mission05.title} />}>
      <div className="mx-auto max-w-[110rem] space-y-3">
        <DispatchBar slug={slug} />
        <MissionTaskBar eyebrow={phase6Page.eyebrow} title={phase6Page.title} m={m} primary={run.started ? PRIMARY[highlight] ?? null : null} where={WHERE[highlight]} onComplete={finish} />

        {/* Below lg: tab bar, one panel at a time. */}
        <div role="tablist" aria-label="Mission panels" className="grid grid-cols-3 gap-1 rounded-xl bg-navy-900 p-1 text-xs font-semibold lg:hidden">
          {phase6Page.panelTabs.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`rounded-lg py-2 ${tab === t.id ? "bg-blue text-white" : "text-ink-dim"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid items-start gap-3 lg:max-[1359px]:grid-cols-[15.5rem_minmax(0,1fr)] min-[1360px]:max-[1699px]:grid-cols-[14rem_minmax(0,1fr)_16rem] min-[1700px]:grid-cols-[15rem_minmax(0,1fr)_17rem]">
          <div className={`${tab === "drivers" ? "block h-[70vh] min-h-[26rem]" : "hidden"} lg:block ${WORK_H}`}>
            <DriverList m={m} highlight={highlight} />
          </div>
          <div className={`${tab === "comms" ? "block h-[75vh] min-h-[28rem]" : "hidden"} lg:block ${WORK_H}`}>
            <DriverCommsPanel m={m} highlight={highlight} draft={draft} setDraft={setDraft} />
          </div>
          <div className={`${tab === "assign" ? "block" : "hidden"} lg:block lg:max-[1359px]:col-span-2 min-[1360px]:overflow-y-auto min-[1360px]:pr-1 ${WORK_H_WIDE}`}>
            <AssignmentSummary m={m} highlight={highlight} onOpen={setDrawer} />
          </div>
        </div>
      </div>

      <GameDrawer open={drawer === "load"} onClose={close} title={`Negotiated Load (${m.vars.ref})`}>
        <NegotiatedLoadCard m={m} highlight={highlight} />
      </GameDrawer>
      <GameDrawer open={drawer === "suitability"} onClose={close} title="Driver Suitability" subtitle="Equipment, availability, HOS and pickup feasibility">
        <DriverDetails m={m} highlight={highlight} />
      </GameDrawer>
      <GameDrawer open={drawer === "dispatch"} onClose={close} title="Dispatch Sheet" subtitle="Review every field, then send it to the driver" width="lg">
        <DispatchSheetPanel m={m} highlight={highlight} />
      </GameDrawer>
      <GameDrawer open={drawer === "route"} onClose={close} title="Route Preview">
        <DriverRoutePreview load={m.neg.load} entry={m.viewDriverId ? getRosterEntry(m.viewDriverId) : null} />
      </GameDrawer>

      {showComplete && run.completed && (() => {
        const sum = m.summary();
        const copy = phase6Page.completion;
        return (
          <PhaseComplete
            missionName={mission05.title}
            subtitle={copy.subtitle}
            unlocked={copy.unlocked}
            stars={sum.stars}
            stats={getCompletionStats(run, mission05)}
            rows={[
              ["Driver / Truck", `${sum.driver} · ${sum.truck}`],
              ["Remaining HOS / Deadhead", `${sum.remainingHos} · ${sum.deadhead}`],
              ["Dispatch Sent / Confirmed", `${sum.dispatchSent} / ${sum.driverConfirmed}`],
              ["Load Status", sum.status],
              ["Incorrect Attempts / Hints", `${sum.incorrect} / ${sum.hintsUsed}`],
            ]}
            onPrimary={() => router.push(ROUTES.tracking(slug))}
          />
        );
      })()}
    </DispatcherLayout>
  );
}
