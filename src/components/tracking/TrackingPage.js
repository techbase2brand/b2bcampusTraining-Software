"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRequireAccess } from "@/hooks/useRequireAccess";
import { useTrackingMission } from "@/hooks/useTrackingMission";
import { dispatcherNav } from "@/data/navigation";
import { mission06, phase7Page } from "@/data/phase7Missions";
import { canAccessRoute } from "@/lib/access";
import DispatcherLayout from "@/components/dispatcher/DispatcherLayout";
import AccessGate from "@/components/game/AccessGate";
import PhaseProgressCard from "@/components/loadboard/PhaseProgressCard";
import PhaseComplete from "@/components/training/PhaseComplete";
import TrackingHeader from "./TrackingHeader";
import LiveMap from "./LiveMap";
import { ActiveShipments, TrainingControls, EtaHealthPanel } from "./ShipPanels";
import { ShipmentTimeline, PickupMonitor, ExceptionPanel, ArrivalCard } from "./TimelineAndActions";
import TrackingComms from "./TrackingComms";
import { AlertsPanel, LoadDriverStatus, ActivityLog, CheckCallLog, TaskList } from "./SidePanels";

// Access gate: Tracking must be unlocked (same rule as the sidebar) and Phase 6 must have left an
// assigned load. `?preview=1` (development only) uses a demo assignment, not saved.
export default function TrackingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { state, allowed } = useRequireAccess();

  if (!allowed) return <main className="game-backdrop min-h-screen" />;

  const preview = params.get("preview") === "1";
  if (!preview && !canAccessRoute(dispatcherNav, "/dispatcher/tracking", state)) {
    return <AccessGate title="Tracking is locked" text="Complete Driver Communication + Load Assignment (Mission 5) to unlock shipment tracking." action="Back to Level Map" onAction={() => router.push("/home")} />;
  }
  if (!preview && !(state.assignedLoadId && state.assignedDriverId)) {
    return <AccessGate title="Assign a driver first" text="Tracking continues with the load you assigned to a driver." action="Go to Dispatch" onAction={() => router.push("/dispatcher/dispatch")} />;
  }
  return <Tracking avatar={state.avatarSelection ?? "male"} preview={preview} />;
}

// Column heights on large screens: the workspace fills the viewport under the header and each
// column scrolls inside itself, so the page does not grow just because a panel is long.
const COL_H = "2xl:h-[calc(100vh-15.5rem)] 2xl:min-h-[32rem]";
const SEC_H = "lg:max-h-[calc(100vh-13rem)] lg:overflow-y-auto 2xl:max-h-none";

function Tracking({ avatar, preview }) {
  const router = useRouter();
  const m = useTrackingMission(preview);
  const [tab, setTab] = useState("map"); // below lg: one panel group at a time
  const [sec, setSec] = useState("comms"); // lg to 2xl: secondary group under the map
  const [showComplete, setShowComplete] = useState(false);
  const { run } = m;

  if (!m.ctx.ok) return <AccessGate title="No active shipment" text="Assign a driver to a load in Dispatch first." action="Go to Dispatch" onAction={() => router.push("/dispatcher/dispatch")} />;

  const pct = Math.round((run.completedTasks.length / mission06.tasks.length) * 100);
  const finish = () => {
    m.complete();
    setShowComplete(true);
  };
  // Visibility: mobile tab, then the lg-2xl secondary tab, then always visible at 2xl.
  const group = (id) => `${tab === id ? "block" : "hidden"} ${sec === id ? "lg:block" : "lg:hidden"} 2xl:block`;

  return (
    <DispatcherLayout activeId="tracking" footer={<PhaseProgressCard pct={pct} phaseLabel="Mission 6 Progress" levelLabel="Level 6" title={mission06.title} />}>
      <div className="mx-auto max-w-[110rem] space-y-3">
        <TrackingHeader m={m} gender={avatar} />

        {/* Below lg: tab bar, one group at a time. */}
        <div role="tablist" aria-label="Tracking panels" className="grid grid-cols-5 gap-1 rounded-xl bg-navy-900 p-1 text-[11px] font-semibold lg:hidden">
          {phase7Page.panelTabs.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`rounded-lg py-2 ${tab === t.id ? "bg-blue text-white" : "text-ink-dim"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid items-start gap-3 lg:grid-cols-2 2xl:grid-cols-[16rem_minmax(0,1fr)_24rem]">
          {/* Centre: live map, timeline and the contextual action panels. */}
          <div className={`${tab === "map" ? "block" : "hidden"} space-y-3 lg:order-1 lg:col-span-2 lg:block 2xl:order-2 2xl:col-span-1 ${COL_H} 2xl:overflow-y-auto 2xl:pr-1`}>
            <LiveMap m={m} />
            <ShipmentTimeline m={m} />
            <PickupMonitor m={m} />
            <ExceptionPanel m={m} />
            <ArrivalCard m={m} />
          </div>

          {/* lg to 2xl: tabs for the secondary groups under the map. */}
          <div role="tablist" aria-label="More panels" className="hidden gap-1 rounded-xl bg-navy-900 p-1 text-xs font-semibold lg:order-2 lg:col-span-2 lg:grid lg:grid-cols-4 2xl:hidden">
            {phase7Page.secondaryTabs.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={sec === t.id} onClick={() => setSec(t.id)} className={`rounded-lg py-2 ${sec === t.id ? "bg-blue text-white" : "text-ink-dim hover:text-ink"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Left: shipments, trip controls, ETA and health. */}
          <div className={`${group("ship")} space-y-3 lg:order-3 lg:col-span-2 2xl:order-1 2xl:col-span-1 ${COL_H} ${SEC_H} 2xl:pr-1`}>
            <ActiveShipments m={m} />
            <TrainingControls m={m} />
            <EtaHealthPanel m={m} />
          </div>

          {/* Right: communication, alerts, load and driver details. */}
          <div className={`contents ${COL_H} 2xl:order-3 2xl:block 2xl:space-y-3 2xl:overflow-y-auto 2xl:pr-1`}>
            <div className={`${group("comms")} space-y-3 lg:order-3 lg:col-span-2 2xl:col-span-1`}>
              <TrackingComms m={m} />
              <AlertsPanel m={m} />
            </div>
            <div className={`${group("details")} lg:order-3 lg:col-span-2 2xl:col-span-1`}>
              <LoadDriverStatus m={m} />
            </div>
          </div>

          {/* Bottom group: logs and tasks. */}
          <div className={`${group("log")} grid gap-3 lg:order-3 lg:col-span-2 lg:grid-cols-3 2xl:col-span-3 2xl:order-4`}>
            <ActivityLog m={m} />
            <CheckCallLog m={m} />
            <TaskList m={m} />
          </div>
        </div>

        {run.started && !run.completed && m.allTasksDone && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-success/40 bg-success/5 px-4 py-2.5">
            <p className="text-sm font-semibold text-ink">All monitoring tasks are complete.</p>
            <button type="button" onClick={finish} className="rounded-lg bg-linear-to-r from-blue to-[#1f7bff] px-4 py-2 text-sm font-semibold text-white">
              Mark as Completed
            </button>
          </div>
        )}
      </div>

      {showComplete && run.completed && (() => {
        const sum = m.summary();
        const copy = phase7Page.completion;
        return (
          <PhaseComplete
            title={copy.title}
            subtitle={copy.subtitle}
            unlocked={copy.unlocked}
            stars={sum.stars}
            rows={[
              ["Check Calls / Driver Messages", `${sum.checkCalls} / ${sum.driverMessages}`],
              ["ETA Accuracy", `${sum.etaAccuracy}%`],
              ["Exceptions / Broker Updates", `${sum.exceptionsHandled} / ${sum.brokerUpdates}`],
              ["Incorrect / Hints", `${sum.incorrect} / ${sum.hintsUsed}`],
              ["Final Status", sum.status],
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
