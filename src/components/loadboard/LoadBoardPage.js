"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, PackageSearch } from "lucide-react";
import { useRequireAccess } from "@/hooks/useRequireAccess";
import { usePhase3Mission } from "@/hooks/usePhase3Mission";
import { mission02, phase3Page } from "@/data/phase3Missions";
import { loadBoardSources } from "@/data/loadFilters";
import { dispatcherNav } from "@/data/navigation";
import { canAccessRoute } from "@/lib/access";
import { filterLoads } from "@/lib/loadFiltering";
import DispatcherLayout from "@/components/dispatcher/DispatcherLayout";
import GameButton from "@/components/game/GameButton";
import Phase3Hero from "./Phase3Hero";
import AssignedTruckStrip from "./AssignedTruckStrip";
import LoadFilters from "./LoadFilters";
import LoadResultsTable from "./LoadResultsTable";
import LoadRoutePreview from "./LoadRoutePreview";
import LoadDetailPanel from "./LoadDetailPanel";
import Phase3MissionPanel from "./Phase3MissionPanel";
import HowItWorks from "./HowItWorks";
import ShortlistPanel from "./ShortlistPanel";
import CompatibilityReview from "./CompatibilityReview";
import ShortlistAction from "./ShortlistAction";
import PhaseProgressCard from "./PhaseProgressCard";
import PhaseComplete from "@/components/training/PhaseComplete";

const LEVEL_ID = mission02.levelId;

// Access gate. The board itself mounts only once the student may see it (hooks below depend on it).
export default function LoadBoardPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { state, allowed } = useRequireAccess();

  if (!allowed) return <main className="game-backdrop min-h-screen" />;

  // Level 2 opens once Mission 01 is done. `?preview=1` is a development-only way to view the layout.
  const unlocked = canAccessRoute(dispatcherNav, "/dispatcher/load-board", state);
  if (!unlocked && params.get("preview") !== "1") {
    return (
      <main className="game-backdrop grid min-h-screen place-items-center p-6">
        <div className="max-w-md rounded-2xl border border-line bg-surface/90 p-8 text-center">
          <Lock className="mx-auto size-10 text-gold" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-extrabold text-ink">Finding Loads is locked</h1>
          <p className="mt-2 text-sm text-ink-dim">Complete Mission 01 (Dispatcher Desk Setup) to unlock the Load Board.</p>
          <GameButton className="mt-6" onClick={() => router.push("/home")}>
            Back to Level Map
          </GameButton>
        </div>
      </main>
    );
  }

  return <LoadBoard avatar={state.avatarSelection ?? "male"} />;
}

function LoadBoard({ avatar }) {
  const router = useRouter();
  const m = usePhase3Mission();
  const [showComplete, setShowComplete] = useState(false);
  const { run, task, filters, selectedLoad } = m;
  const toAnalysis = () => router.push("/dispatcher/load-analysis");

  const results = filterLoads(filters);
  const highlight = run.started && !run.completed ? task?.highlight ?? null : null;
  const pct = Math.round((run.completedTasks.length / mission02.tasks.length) * 100);

  const footer = (
    <PhaseProgressCard pct={pct} phaseLabel="Phase 3 Progress" levelLabel={`Level ${LEVEL_ID}`} title={mission02.title} />
  );

  return (
    <DispatcherLayout
      activeId="load-board"
      highlightId={highlight === "nav-load-board" ? "load-board" : null}
      footer={footer}
    >
      <div className="mx-auto max-w-[110rem] space-y-4">
        <Phase3Hero gender={avatar} m={m} />
        <AssignedTruckStrip />

        <section
          aria-label={phase3Page.boardTitle}
          className="rounded-2xl border border-cyan/25 bg-navy-900/80 p-3 shadow-[0_0_40px_rgb(32_199_232/0.08),0_10px_30px_rgb(0_0_0/0.35)]"
        >
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-line/70">
            <div className="flex items-center gap-2 pb-2">
              <span className="grid size-8 place-items-center rounded-lg bg-linear-to-br from-cyan to-blue text-navy-950">
                <PackageSearch className="size-4" aria-hidden="true" />
              </span>
              <h2 className="text-lg font-extrabold uppercase tracking-wide text-ink">{phase3Page.boardTitle}</h2>
            </div>
            <div role="tablist" aria-label="Load board source" className="-mb-px flex flex-wrap gap-1">
              {loadBoardSources.map((src) => {
                const active = src.id === filters.sourceId;
                return (
                  <button
                    key={src.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => m.applyFilters({ ...filters, sourceId: src.id })}
                    className={`rounded-t-lg border border-b-0 px-3.5 py-2 text-xs font-semibold transition-colors ${
                      active
                        ? "border-blue bg-linear-to-b from-blue to-[#1f7bff] text-white shadow-[0_0_16px_rgb(38_140_255/0.35)]"
                        : "border-line bg-surface/70 text-ink-dim hover:bg-surface-2 hover:text-ink"
                    }`}
                  >
                    {src.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 space-y-3">
            <LoadFilters key={JSON.stringify(filters)} applied={filters} onApply={m.applyFilters} onReset={m.reset} highlight={highlight} />

            <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_26rem]">
              <LoadResultsTable results={results} m={m} onApply={m.applyFilters} onReset={m.reset} highlight={highlight} />
              <div className="space-y-3">
                <LoadRoutePreview load={selectedLoad} />
                <LoadDetailPanel load={selectedLoad} />
                {selectedLoad && (
                  <>
                    <CompatibilityReview m={m} load={selectedLoad} highlight={highlight} />
                    <ShortlistAction m={m} load={selectedLoad} />
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <ShortlistPanel m={m} highlight={highlight} />
          <Phase3MissionPanel
            m={m}
            onContinue={toAnalysis}
            onComplete={() => {
              m.complete();
              setShowComplete(true);
            }}
          />
        </div>

        <HowItWorks />
      </div>

      {showComplete && run.completed && (() => {
        const sum = m.summary();
        const copy = phase3Page.completion;
        return (
          <PhaseComplete
            title={copy.title}
            subtitle={copy.subtitle}
            unlocked={copy.unlocked}
            stars={sum.stars}
            rows={[
              ["Loads Reviewed", sum.loadsReviewed],
              ["Compatible Loads Found", sum.compatibleFound],
              ["Shortlisted Loads", sum.shortlisted],
              ["Incorrect Selections", sum.incorrect],
              ["Hints Used", sum.hintsUsed],
              ["Accuracy", `${sum.accuracy}%`],
              ["XP Earned", `+${sum.xp}`],
            ]}
            primaryLabel={copy.cta}
            onPrimary={toAnalysis}
            secondaryLabel={copy.secondary}
            onSecondary={() => router.push("/home")}
          />
        );
      })()}
    </DispatcherLayout>
  );
}
