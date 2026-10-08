"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useRequireAccess } from "@/hooks/useRequireAccess";
import { ROUTES } from "@/lib/dispatchRecords";
import DispatcherLayout from "@/components/dispatcher/DispatcherLayout";
import GameButton from "@/components/game/GameButton";
import DispatchList from "./DispatchList";

// Dispatch hub / history: every dispatch the student has created, grouped Active / Pending /
// Completed, each opening at the stage where it left off. A simple switcher, not a management tool.
export default function DispatchHubPage() {
  const router = useRouter();
  const { state, allowed } = useRequireAccess();
  if (!allowed) return <main className="game-backdrop min-h-screen" />;

  return (
    <DispatcherLayout activeId="dispatches">
      <div className="mx-auto max-w-4xl space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-ink sm:text-2xl">Dispatches</h1>
            <p className="text-xs text-ink-dim">Every dispatch you have created. Open one to continue where you left off.</p>
          </div>
          <GameButton onClick={() => router.push(ROUTES.board)}>
            <Plus className="size-4" aria-hidden="true" /> New Dispatch
          </GameButton>
        </header>
        <section className="panel p-4">
          <DispatchList state={state} onOpen={(route) => router.push(route)} detailed />
        </section>
      </div>
    </DispatcherLayout>
  );
}
