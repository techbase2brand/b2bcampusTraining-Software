"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Lock } from "lucide-react";
import { useRequireAccess } from "@/hooks/useRequireAccess";
import { levels } from "@/data/levels";
import { homeNav } from "@/data/navigation";
import { resolveNav } from "@/lib/access";
import { missions } from "@/data/missions";
import GameTopBar from "@/components/game/GameTopBar";
import GameSidebar from "@/components/game/GameSidebar";
import GameButton from "@/components/game/GameButton";
import GameModal from "@/components/game/GameModal";
import GameImage from "@/components/game/GameImage";

function levelStatus(level, state) {
  if (state.completedLevels.includes(level.id)) return "completed";
  if (level.id === state.currentLevel) return "current";
  return "locked";
}

const nodeStyle = {
  current:
    "app-border-warning bg-linear-to-b from-gold-bright to-gold text-navy-950 shadow-[0_0_36px_rgb(255_176_0/0.65)] hover:scale-105",
  completed: "app-border-success bg-success/20 text-success shadow-[0_0_24px_rgb(0_200_150/0.45)] hover:scale-105",
  locked: "cursor-not-allowed bg-surface text-ink-dim",
};

// Winding path through the level positions (percent coordinates in a 100x100 box).
function buildPath(points) {
  return points.reduce((d, p, i) => {
    if (i === 0) return `M${p.x} ${p.y}`;
    const prev = points[i - 1];
    const mid = (prev.x + p.x) / 2;
    return `${d} C ${mid} ${prev.y}, ${mid} ${p.y}, ${p.x} ${p.y}`;
  }, "");
}
const PATH = buildPath(levels.map((l) => l.pos));

export default function LevelMap() {
  const router = useRouter();
  const { state, allowed, reset } = useRequireAccess();
  const [selected, setSelected] = useState(null);

  if (!allowed) return <main className="game-backdrop min-h-screen" />;

  const open = levels.find((l) => l.id === selected);
  const openStatus = open ? levelStatus(open, state) : null;

  return (
    <div className="game-backdrop flex min-h-screen flex-col">
      <GameTopBar />
      <div className="flex flex-1">
        <aside className="app-sidebar hidden shrink-0 border-r border-line bg-navy-900/60 lg:block">
          <GameSidebar
            items={resolveNav(homeNav, state)}
            activeId="home"
            onSelect={(id) => {
              const item = homeNav.find((i) => i.id === id);
              if (item?.route) router.push(item.route);
            }}
          />
          <div className="p-3">
            <button
              type="button"
              className="text-[11px] text-ink-dim hover:text-cyan-bright"
              onClick={() => {
                reset();
                router.replace("/login");
              }}
            >
              Log out &amp; reset progress (dev)
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <h1 className="text-2xl font-extrabold text-ink">Level Map</h1>
          <p className="mt-1 text-sm text-ink-dim">Complete missions to unlock the next level.</p>

          {/* Desktop: glowing path map */}
          <div className="relative mt-6 hidden h-[calc(100vh-15rem)] min-h-120 overflow-hidden rounded-2xl app-border shadow-[0_0_40px_rgb(32_199_232/0.12)] md:block">
            <GameImage
              src="/images/levelmap-bg.png"
              alt=""
              className="absolute inset-0"
              fallback={<div className="game-backdrop game-grid absolute inset-0" />}
              sizes="80vw"
              priority
            />
            {/* subtle readability overlay, kept light so the map stays visible */}
            <div className="absolute inset-0 bg-navy-950/25" />
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
              <path d={PATH} fill="none" stroke="#0b2342" strokeWidth="5" vectorEffect="non-scaling-stroke" />
              <path
                d={PATH}
                fill="none"
                stroke="#ffb000"
                strokeWidth="2"
                strokeDasharray="10 10"
                opacity="0.8"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {levels.map((level) => {
              const status = levelStatus(level, state);
              return (
                <div
                  key={level.id}
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
                  style={{ left: `${level.pos.x}%`, top: `${level.pos.y}%` }}
                >
                  <button
                    type="button"
                    disabled={status === "locked"}
                    onClick={() => setSelected(level.id)}
                    aria-label={`Level ${level.id}: ${level.title} (${status})`}
                    className={`grid size-16 place-items-center rounded-full border-4 text-2xl font-black transition ${nodeStyle[status]}`}
                  >
                    {status === "locked" ? (
                      <Lock className="size-6" aria-hidden="true" />
                    ) : status === "completed" ? (
                      <CheckCircle2 className="size-7" aria-hidden="true" />
                    ) : (
                      level.id
                    )}
                  </button>
                  <p className="rounded-lg app-border bg-navy-950/85 px-3 py-1.5 text-center text-xs font-semibold leading-tight text-ink">
                    {level.label.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Mobile: stacked list */}
          <ol className="mt-6 space-y-3 md:hidden">
            {levels.map((level) => {
              const status = levelStatus(level, state);
              return (
                <li key={level.id}>
                  <button
                    type="button"
                    disabled={status === "locked"}
                    onClick={() => setSelected(level.id)}
                    className={`flex w-full items-center gap-4 rounded-2xl app-border p-4 text-left ${
                      status === "current"
                        ? "app-border-warning bg-surface-2"
                        : status === "completed"
                          ? "app-border-success bg-surface"
                          : " bg-surface opacity-60"
                    }`}
                  >
                    <span className="grid size-10 place-items-center rounded-full app-border font-bold text-ink">
                      {status === "locked" ? <Lock className="size-4" aria-label="Locked" /> : level.id}
                    </span>
                    <span>
                      <span className="block font-bold text-ink">{level.title}</span>
                      <span className="text-xs uppercase text-ink-dim">
                        {status === "completed" ? "Completed" : status === "current" ? "Unlocked" : "Locked"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </main>
      </div>

      <GameModal open={Boolean(open)} onClose={() => setSelected(null)} title="Mission">
        {open && (
          <div>
            <p className="text-xs font-bold tracking-wider text-gold">MISSION 0{open.id}</p>
            <h2 className="mt-1 text-2xl font-extrabold text-ink">{open.title}</h2>
            <p className="mt-3 text-sm text-ink-dim">
              {open.missionId ? missions[open.missionId].intro : "This mission arrives in a later training phase."}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <GameButton variant="ghost" onClick={() => setSelected(null)}>
                Close
              </GameButton>
              {!open.missionId ? (
                <span className="self-center text-sm font-semibold text-gold">Coming later</span>
              ) : openStatus === "current" ? (
                <GameButton onClick={() => router.push(open.route)}>Start Mission</GameButton>
              ) : (
                <span className="self-center text-sm font-semibold text-success">Mission completed</span>
              )}
            </div>
          </div>
        )}
      </GameModal>
    </div>
  );
}
