"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useRequireAccess } from "@/hooks/useRequireAccess";
import { useTrackingMission } from "@/hooks/useTrackingMission";
import { dispatcherNav } from "@/data/navigation";
import { mission06, phase7Page } from "@/data/phase7Missions";
import { canAccessRoute } from "@/lib/access";
import { getDispatchBySlug, projectDispatchState, getDispatchResumeRoute, ROUTES } from "@/lib/dispatchRecords";
import DispatcherLayout from "@/components/dispatcher/DispatcherLayout";
import AccessGate from "@/components/game/AccessGate";
import GameButton from "@/components/game/GameButton";
import GameDrawer from "@/components/game/GameDrawer";
import MissionTaskBar from "@/components/game/MissionTaskBar";
import PhaseProgressCard from "@/components/loadboard/PhaseProgressCard";
import PhaseComplete from "@/components/training/PhaseComplete";
import { getCompletionStats } from "@/lib/completionStats";
import DispatchBar from "@/components/dispatches/DispatchBar";
import DispatchNotFound from "@/components/dispatches/DispatchNotFound";
import TrackingStatus from "./TrackingStatus";
import NextAction from "./NextAction";
import LiveMap from "./LiveMap";
import { ActiveShipments, EtaHealthPanel } from "./ShipPanels";
import { ShipmentTimeline, PickupMonitor, ExceptionPanel } from "./TimelineAndActions";
import TrackingComms from "./TrackingComms";
import { AlertsPanel, LoadDriverStatus, ActivityLog, CheckCallLog, TaskList } from "./SidePanels";

// Access gate: Tracking must be unlocked (same rule as the sidebar) and THIS dispatch must have an
// assigned driver. The dispatch comes from the slug in the URL.
export default function TrackingPage() {
  const router = useRouter();
  const { dispatchSlug } = useParams();
  const { state: global, allowed } = useRequireAccess();

  if (!allowed) return <main className="game-backdrop min-h-screen" />;

  const record = getDispatchBySlug(global, dispatchSlug);
  if (!record) return <DispatchNotFound slug={dispatchSlug} />;
  const state = projectDispatchState(global, record);
  if (!canAccessRoute(dispatcherNav, "/dispatcher/tracking", global)) {
    return <AccessGate title="Tracking is locked" text="Complete Driver Communication + Load Assignment (Mission 5) to unlock shipment tracking." action="Back to Level Map" onAction={() => router.push("/home")} />;
  }
  if (!(state.assignedLoadId && state.assignedDriverId)) {
    return <AccessGate title="Complete driver assignment first" text="Complete driver assignment before tracking this dispatch." action="Continue Assignment" onAction={() => router.push(getDispatchResumeRoute(record))} />;
  }
  return <Tracking slug={dispatchSlug} />;
}

const SHORTCUTS = [
  { id: "comms", label: "Driver Comms" },
  { id: "pickup", label: "Pickup Monitor" },
  { id: "eta", label: "ETA & Health" },
  { id: "details", label: "Shipment Details" },
  { id: "activity", label: "View Activity" },
  { id: "calls", label: "Check Call History" },
  { id: "alerts", label: "Alert History" },
];

function Tracking({ slug }) {
  const router = useRouter();
  const m = useTrackingMission(slug);
  const [drawer, setDrawer] = useState(null); // which detail drawer is open, or null
  const [showComplete, setShowComplete] = useState(false);
  const { run } = m;

  if (!m.ctx.ok) return <AccessGate title="No active shipment" text="Assign a driver to a load in Dispatch first." action="Go to Dispatch" onAction={() => router.push(ROUTES.assignment(slug))} />;

  const pct = Math.round((run.completedTasks.length / mission06.tasks.length) * 100);
  const finish = () => {
    m.complete();
    setShowComplete(true);
  };
  const close = () => setDrawer(null);

  // The one main action for the current task, from the engine's highlight. Check calls, the ETA
  // review and the delay steps happen in drawers, so their button opens the right one.
  const PRIMARY = {
    "start-trip": { label: "Start Trip", onClick: m.startTrip },
    advance: { label: "Advance Simulation", onClick: m.advance },
    "confirm-departed": { label: "Confirm Departed", onClick: () => m.confirm("departed") },
    "confirm-arrived": { label: "Confirm Arrived", onClick: () => m.confirm("arrived") },
    "confirm-loading": { label: "Confirm Loading", onClick: () => m.confirm("loading") },
    "confirm-picked-up": { label: "Confirm Pickup Complete", onClick: () => m.confirm("pickedUp") },
    comms: { label: "Perform Check Call", onClick: () => setDrawer("comms") },
    "eta-review": { label: "Review ETA", onClick: () => setDrawer("eta") },
    "ex-ack": { label: "Handle Delay", onClick: () => setDrawer("delay") },
    "ex-eta": { label: "Handle Delay", onClick: () => setDrawer("delay") },
    "ex-appt": { label: "Handle Delay", onClick: () => setDrawer("delay") },
    "ex-record": { label: "Handle Delay", onClick: () => setDrawer("delay") },
    "ex-broker": { label: "Update Broker", onClick: () => setDrawer("delay") },
    "confirm-arrival": { label: "Confirm Arrival", onClick: m.confirmArrival },
  };
  const primary = run.started && !run.completed ? PRIMARY[m.highlight] ?? null : null;
  const shortcuts = m.exception ? [{ id: "delay", label: "Delay / Exception" }, ...SHORTCUTS] : SHORTCUTS;

  return (
    <DispatcherLayout activeId="tracking" footer={<PhaseProgressCard pct={pct} phaseLabel="Mission 6 Progress" levelLabel="Level 6" title={mission06.title} />}>
      <div className="mx-auto max-w-[110rem] space-y-3">
        <DispatchBar slug={slug} />
        <MissionTaskBar eyebrow={phase7Page.eyebrow} title={phase7Page.title} m={m} primary={primary} onComplete={finish} />
        {m.readOnly && (
          <section aria-label="Dispatch completed" className="flex flex-wrap items-center gap-2 rounded-xl border border-success/40 bg-success/10 px-4 py-2.5">
            <p className="mr-auto text-sm font-bold text-success">✓ This dispatch is completed and saved to your history.</p>
            <GameButton size="sm" variant="ghost" onClick={() => router.push("/dispatcher")}>
              Return to Dashboard
            </GameButton>
            <GameButton size="sm" variant="ghost" onClick={() => router.push(ROUTES.hub)}>
              View Dispatch History
            </GameButton>
            <GameButton size="sm" onClick={() => router.push(ROUTES.board)}>
              Start New Dispatch
            </GameButton>
          </section>
        )}
        <TrackingStatus m={m} />

        <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_17rem] xl:grid-cols-[minmax(0,1fr)_19rem]">
          <LiveMap m={m} />
          <NextAction m={m} primary={primary} onOpen={setDrawer} shortcuts={shortcuts} />
        </div>
      </div>

      <GameDrawer open={drawer === "comms"} onClose={close} title="Driver Communication" subtitle="Chat or call the driver for a status update" width="lg">
        <TrackingComms m={m} />
      </GameDrawer>
      <GameDrawer open={drawer === "pickup"} onClose={close} title="Pickup Monitoring">
        <PickupMonitor m={m} />
      </GameDrawer>
      <GameDrawer open={drawer === "eta"} onClose={close} title="ETA & Shipment Health">
        <EtaHealthPanel m={m} />
      </GameDrawer>
      <GameDrawer open={drawer === "delay"} onClose={close} title="Delay / Exception" subtitle="Acknowledge, re-plan the ETA, record it and update the broker">
        {m.exception ? <ExceptionPanel m={m} /> : <p className="text-sm text-ink-dim">No delay has been reported yet.</p>}
      </GameDrawer>
      <GameDrawer open={drawer === "details"} onClose={close} title="Shipment Details" subtitle={m.load.referenceNumber}>
        <ActiveShipments m={m} />
        <LoadDriverStatus m={m} />
      </GameDrawer>
      <GameDrawer open={drawer === "activity"} onClose={close} title="Activity" subtitle="Timeline, events and mission tasks" width="lg">
        <ShipmentTimeline m={m} />
        <ActivityLog m={m} />
        <TaskList m={m} />
      </GameDrawer>
      <GameDrawer open={drawer === "calls"} onClose={close} title="Check Call History">
        <CheckCallLog m={m} />
      </GameDrawer>
      <GameDrawer open={drawer === "alerts"} onClose={close} title="Alert History">
        <AlertsPanel m={m} />
      </GameDrawer>

      {showComplete && run.completed && (() => {
        const sum = m.summary();
        const copy = phase7Page.completion;
        return (
          <PhaseComplete
            missionName={mission06.title}
            subtitle={copy.subtitle}
            unlocked={copy.unlocked}
            stars={sum.stars}
            stats={getCompletionStats(run, mission06)}
            rows={[
              ["Check Calls / Driver Messages", `${sum.checkCalls} / ${sum.driverMessages}`],
              ["ETA Accuracy", `${sum.etaAccuracy}%`],
              ["Exceptions / Broker Updates", `${sum.exceptionsHandled} / ${sum.brokerUpdates}`],
              ["Incorrect / Hints", `${sum.incorrect} / ${sum.hintsUsed}`],
              ["Final Status", sum.status],
            ]}
            onPrimary={() => router.push(ROUTES.board)}
          />
        );
      })()}
    </DispatcherLayout>
  );
}
