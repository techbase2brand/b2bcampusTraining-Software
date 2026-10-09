"use client";

import { useRouter } from "next/navigation";
import { SearchX } from "lucide-react";
import { ROUTES } from "@/lib/dispatchRecords";
import GameButton from "@/components/game/GameButton";

// Friendly page for a dispatch slug that does not exist (never a crash or a blank screen).
export default function DispatchNotFound({ slug = null }) {
  const router = useRouter();
  return (
    <main className="game-backdrop grid min-h-screen place-items-center p-6">
      <div className="max-w-md rounded-2xl app-border bg-surface/90 p-8 text-center">
        <SearchX className="mx-auto size-10 text-gold" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-extrabold text-ink">Dispatch not found</h1>
        <p className="mt-2 text-sm text-ink-dim">{slug ? `There is no dispatch called "${slug}" in your training history.` : "That dispatch does not exist."}</p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <GameButton variant="ghost" onClick={() => router.push(ROUTES.hub)}>
            View Dispatches
          </GameButton>
          <GameButton onClick={() => router.push(ROUTES.board)}>Start New Dispatch</GameButton>
        </div>
      </div>
    </main>
  );
}
