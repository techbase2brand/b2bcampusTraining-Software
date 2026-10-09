"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { RESET_WORD, isResetConfirmed } from "@/lib/resetSafety";
import GameButton from "@/components/game/GameButton";
import GameModal from "@/components/game/GameModal";

// Reset is destructive and permanent, so it never happens from one click: the student must read what
// will be lost and type RESET before the button is enabled.
export default function ResetProgress({ onReset }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const close = () => {
    setOpen(false);
    setTyped("");
  };

  return (
    <>
      <GameButton variant="ghost" size="sm" className="mt-3" onClick={() => setOpen(true)}>
        Reset training progress
      </GameButton>
      <GameModal open={open} onClose={close} title="Reset all training progress">
        <h2 className="flex items-center gap-2 text-lg font-extrabold uppercase text-danger">
          <TriangleAlert className="size-5" aria-hidden="true" /> Reset all training progress?
        </h2>
        <p className="mt-3 text-sm text-ink">This will permanently clear:</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-ink-dim">
          <li>mission progress and unlocked levels</li>
          <li>XP and stars</li>
          <li>dispatch history</li>
          <li>all saved training state</li>
        </ul>
        <p className="mt-3 text-sm font-semibold text-ink">This cannot be undone.</p>
        <label className="mt-3 block text-sm text-ink-dim">
          Type <span className="font-extrabold text-ink">{RESET_WORD}</span> to confirm
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            aria-label={`Type ${RESET_WORD} to confirm`}
            className="mt-1 h-10 w-full rounded-lg app-border bg-navy-900 px-3 text-sm text-ink outline-none focus:border-danger"
          />
        </label>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <GameButton variant="ghost" onClick={close}>
            CANCEL
          </GameButton>
          <button
            type="button"
            disabled={!isResetConfirmed(typed)}
            onClick={onReset}
            className="rounded-lg app-border app-border-error bg-danger px-4 py-2.5 text-sm font-bold uppercase text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            RESET EVERYTHING
          </button>
        </div>
      </GameModal>
    </>
  );
}
