"use client";

import { Lock } from "lucide-react";
import GameButton from "./GameButton";

// Full-page notice for a route the student cannot open yet (the same rule as the sidebar decides).
export default function AccessGate({ title, text, action, onAction }) {
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
