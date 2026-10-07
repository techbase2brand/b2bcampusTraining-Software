"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, Search } from "lucide-react";
import { useRequireAccess } from "@/hooks/useRequireAccess";
import { useMission } from "@/hooks/useMission";
import { useGameProgress } from "@/hooks/useGameProgress";
import GameTopBar from "@/components/game/GameTopBar";
import BrandMark from "@/components/game/BrandMark";
import ProgressBar from "@/components/game/ProgressBar";
import GameSidebar from "@/components/game/GameSidebar";
import { dispatcherNav } from "@/data/navigation";
import { resolveNav } from "@/lib/access";
import MissionIntro from "@/components/training/MissionIntro";
import MissionComplete from "@/components/training/MissionComplete";
import DispatcherDashboard from "./DispatcherDashboard";
import TruckList from "./TruckList";
import TruckProfile from "./TruckProfile";
import DriverList from "./DriverList";
import DriverProfile from "./DriverProfile";
import MissionPanel from "./MissionPanel";

export default function DispatcherApp() {
  const { allowed } = useRequireAccess();
  // Mission state exists only after hydration, so the workspace mounts once access is allowed.
  if (!allowed) return <main className="game-backdrop min-h-screen" />;
  return <DispatcherWorkspace />;
}

function DispatcherWorkspace() {
  const router = useRouter();
  const m = useMission();
  const { state } = useGameProgress();
  const [view, setView] = useState({ section: "dashboard", truckId: null, driverId: null });
  const [drawer, setDrawer] = useState(false);

  const { progress, task, mission } = m;
  // The completion card belongs to the moment the mission is finished. Coming back later opens the
  // dashboard directly, and "Go to Dashboard" just dismisses the card (completion is already saved).
  const [doneOnEntry] = useState(progress.completed);
  const [dismissed, setDismissed] = useState(false);
  const highlight = task?.highlight ?? null;
  const toHome = () => router.push("/home");

  // Sidebar access follows the cumulative progression rule (lib/access.js).
  const navItems = resolveNav(dispatcherNav, state);

  function navigate(section) {
    const target = navItems.find((i) => i.id === section);
    if (target?.page) {
      router.push(target.route);
      return;
    }
    setView({ section, truckId: null, driverId: null });
    setDrawer(false);
    m.report({ type: "navigate", section });
  }
  function openDriver(driverId) {
    setView({ section: "drivers", truckId: null, driverId });
    m.report({ type: "open-driver", driverId });
  }

  const total = mission.tasks.length;
  const pct = Math.round((progress.completedTasks.length / total) * 100);

  function continueMission() {
    navigate(progress.currentTask < 3 ? "trucks" : "drivers");
  }
  function openTruck(truckId) {
    setView({ section: "trucks", truckId, driverId: null });
    m.report({ type: "navigate", section: "trucks" });
  }

  const sidebar = (
    <GameSidebar
      items={navItems}
      activeId={view.section}
      onSelect={navigate}
      highlightId={highlight === "nav-trucks" ? "trucks" : null}
    />
  );

  const sidebarFull = (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <BrandMark />
        <p className="mt-2 text-xs text-ink-dim">Dispatcher Training</p>
      </div>
      {sidebar}
      <div className="mt-auto p-3">
        <div className="rounded-xl border border-line bg-surface p-3">
          <p className="text-xs text-ink-dim">Your Progress</p>
          <p className="text-sm font-bold text-ink">Level {state.currentLevel}</p>
          <ProgressBar value={pct} max={100} tone="success" label="Mission progress" className="mt-2" />
          <p className="mt-1 text-[11px] tabular-nums text-ink-dim">{pct}% of Mission 01</p>
        </div>
      </div>
    </div>
  );

  const search = (
    <div className="hidden max-w-xl items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink-dim sm:flex">
      <Search className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">Search loads, trucks, drivers... (Ctrl + K)</span>
      <span className="ml-auto shrink-0 text-[10px] uppercase text-gold">Later</span>
    </div>
  );

  return (
    <div className="game-backdrop flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-line bg-navy-900/80 lg:block">
        {sidebarFull}
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-navy-950/70"
            onClick={() => setDrawer(false)}
          />
          <div className="relative h-full w-64 border-r border-line bg-navy-900">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute right-2 top-2 p-2 text-ink-dim"
              onClick={() => setDrawer(false)}
            >
              <X className="size-4" />
            </button>
            <div className="h-full">{sidebarFull}</div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col pb-14 lg:pb-0">
        <GameTopBar
          center={
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawer(true)}
                aria-label="Open menu"
                className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-surface text-ink lg:hidden"
              >
                <Menu className="size-4" aria-hidden="true" />
              </button>
              {search}
            </div>
          }
        />
        <div className="flex flex-1">
          <main className="game-grid min-w-0 flex-1 p-4 sm:p-6">
            {view.section === "dashboard" && (
              <DispatcherDashboard m={m} onContinue={continueMission} onNavigate={navigate} onOpenTruck={openTruck} />
            )}
            {view.section === "trucks" && !view.truckId && (
              <TruckList onSelect={(truckId) => setView({ section: "trucks", truckId, driverId: null })} />
            )}
            {view.section === "trucks" && view.truckId && (
              <TruckProfile
                truckId={view.truckId}
                highlight={highlight}
                confirming={task?.id === "find-dry-van"}
                onBack={() => setView({ section: "trucks", truckId: null, driverId: null })}
                onOpenDriver={openDriver}
                onConfirmEquipment={(truckId) => m.report({ type: "confirm-equipment", truckId })}
              />
            )}
            {view.section === "drivers" && !view.driverId && <DriverList onSelect={openDriver} />}
            {view.section === "drivers" && view.driverId && (
              <DriverProfile
                driverId={view.driverId}
                highlight={highlight}
                onBack={() => setView({ section: "drivers", truckId: null, driverId: null })}
              />
            )}
          </main>

          {progress.started && !progress.completed && <MissionPanel m={m} />}
        </div>
      </div>

      {!progress.started && <MissionIntro mission={mission} onStart={m.start} onBack={toHome} />}
      {progress.completed && !doneOnEntry && !dismissed && (
        <MissionComplete
          progress={progress}
          accuracy={m.accuracy}
          totalTasks={mission.tasks.length}
          onReturn={toHome}
          onDashboard={() => setDismissed(true)}
        />
      )}
    </div>
  );
}
