"use client";

import { MapIcon, Trophy } from "lucide-react";
import { selectionCopy } from "@/data/phase4Missions";
import { getLoad } from "@/lib/loadSelectors";
import GameButton from "@/components/game/GameButton";
import LoadDetailPanel from "@/components/loadboard/LoadDetailPanel";
import TaskHighlight from "@/components/dispatcher/TaskHighlight";

// Load details for the card under review, with the "Choose This Load" action.
// Choosing a candidate opens once the earlier analysis tasks are done, and stays open for practice:
// the choice can be changed until a deal is locked in.
export default function SelectedLoadPanel({ m, highlight, onSelect, onShowMap }) {
  const load = m.detailLoadId ? getLoad(m.detailLoadId) : null;
  if (!load) return null;

  const canSelect = m.practiceReady;
  const isBest = m.selectedBestLoadId === load.id;

  return (
    <div className="space-y-3">
      <LoadDetailPanel load={load} />
      <TaskHighlight active={highlight === "select-best"}>
        <div className="panel p-3">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <GameButton onClick={() => onSelect(load.id)} disabled={!canSelect || isBest}>
              <Trophy className="size-4" aria-hidden="true" /> {isBest ? "Selected" : selectionCopy.selectButton}
            </GameButton>
            <GameButton variant="ghost" onClick={onShowMap} aria-label="View route on map">
              <MapIcon className="size-4" aria-hidden="true" /> Map
            </GameButton>
          </div>
          {!canSelect && (
            <p className="mt-2 text-[11px] text-ink-dim">{m.finalized ? "A deal is already locked in for this dispatch." : "Finish the analysis tasks first. Choosing a load is the last step."}</p>
          )}
        </div>
      </TaskHighlight>
    </div>
  );
}
