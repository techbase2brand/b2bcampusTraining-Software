"use client";

import { useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import GameButton from "@/components/game/GameButton";
import GameDrawer from "@/components/game/GameDrawer";
import TaskHighlight from "@/components/dispatcher/TaskHighlight";
import MissionLoadDetails from "./MissionLoadDetails";

const STATUS_TONE = {
  AVAILABLE: "bg-success/15 text-success",
  "UNDER REVIEW": "bg-cyan/15 text-cyan-bright",
  "UNDER NEGOTIATION": "bg-gold/15 text-gold-bright",
  "RATE AGREED": "bg-success/25 text-success",
};

// Compact view of the selected load. The full details (commodity, weight, broker, miles...) open in
// a drawer. Marking the details reviewed is possible from here, so the task never needs the drawer.
export default function LoadSummary({ m, highlight }) {
  const [open, setOpen] = useState(false);
  const { vars } = m.cc;
  const reviewed = m.comms.detailsReviewed;
  const canReview = m.run.started && m.correctSelected && !reviewed;

  return (
    <section aria-label="Load summary" className="panel p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-extrabold text-ink">{vars.ref}</h2>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${STATUS_TONE[m.loadStatus]}`}>{m.loadStatus}</span>
      </div>
      <p className="mt-1 text-xs font-semibold text-ink">
        {vars.origin} → {vars.destination}
      </p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums leading-tight text-success">{vars.rate}</p>
      <p className="text-[11px] text-ink-dim">
        Pickup: {vars.pickupDay}, {vars.pickupTime}
      </p>

      {reviewed ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-success">
          <Check className="size-4" aria-hidden="true" /> LOAD DETAILS VERIFIED
        </p>
      ) : (
        <TaskHighlight active={highlight === "details-review"} className="mt-2">
          <GameButton size="sm" className="w-full" disabled={!canReview} onClick={m.reviewDetails}>
            Mark Details Reviewed
          </GameButton>
        </TaskHighlight>
      )}
      {!reviewed && !canReview && <p className="mt-1 text-center text-[10px] text-ink-dim">{m.run.started ? "Select the correct broker first." : "Start the mission first."}</p>}

      <button type="button" onClick={() => setOpen(true)} className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-line py-1.5 text-xs font-semibold text-ink transition-colors hover:border-cyan hover:text-cyan-bright">
        View Full Load Details <ChevronRight className="size-3.5" aria-hidden="true" />
      </button>

      <GameDrawer open={open} onClose={() => setOpen(false)} title={`Load Details (${vars.ref})`} subtitle={`${vars.origin} → ${vars.destination}`}>
        <MissionLoadDetails m={m} highlight={highlight} />
      </GameDrawer>
    </section>
  );
}
