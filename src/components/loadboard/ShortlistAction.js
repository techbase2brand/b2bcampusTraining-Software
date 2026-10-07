"use client";

import { Check, ListPlus, X } from "lucide-react";
import { simulationConfig } from "@/data/simulationConfig";
import GameButton from "@/components/game/GameButton";
import TrainingFeedback from "@/components/training/TrainingFeedback";

// Primary action for the selected load, with the shortlist count and the educational feedback.
export default function ShortlistAction({ m, load }) {
  const { max } = simulationConfig.shortlist;
  const shortlisted = m.shortlistedIds.includes(load.id);

  return (
    <section aria-label="Shortlist action" className="panel p-3">
      {shortlisted ? (
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <GameButton className="w-full" disabled aria-label="Shortlisted">
            SHORTLISTED <Check className="size-4" aria-hidden="true" />
          </GameButton>
          <GameButton variant="ghost" onClick={() => m.removeFromShortlist(load.id)} aria-label="Remove from shortlist">
            <X className="size-4" aria-hidden="true" /> REMOVE
          </GameButton>
        </div>
      ) : (
        <GameButton className="w-full py-3" onClick={() => m.shortlistLoad(load.id)}>
          <ListPlus className="size-4" aria-hidden="true" /> SHORTLIST LOAD
        </GameButton>
      )}

      <div className="mt-2 flex items-center justify-center gap-1.5" aria-live="polite">
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className={`size-1.5 rounded-full transition-colors ${i < m.shortlistedIds.length ? "bg-success" : "bg-line"}`} />
        ))}
        <p className="ml-1 text-[11px] font-semibold tabular-nums text-ink-dim">
          {m.shortlistedIds.length} / {max} shortlisted
        </p>
      </div>

      {m.actionFeedback && (
        <div className="mt-2.5">
          <TrainingFeedback tone={m.actionFeedback.tone}>{m.actionFeedback.text}</TrainingFeedback>
        </div>
      )}
    </section>
  );
}
