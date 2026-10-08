"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Plus, Lock } from "lucide-react";
import { useGameProgress } from "@/hooks/useGameProgress";
import { getDispatchBySlug, ROUTES } from "@/lib/dispatchRecords";
import { describeDispatch } from "@/lib/dispatchView";
import StatusBadge from "@/components/dashboard/StatusBadge";
import GameButton from "@/components/game/GameButton";
import GameDrawer from "@/components/game/GameDrawer";
import DispatchList from "./DispatchList";

// Compact dispatch context shown on every operational page: which dispatch this is, its load,
// lane and stage, and a Switch drawer. The slug in the URL is the only source of truth.
export default function DispatchBar({ slug }) {
  const router = useRouter();
  const { state } = useGameProgress();
  const [open, setOpen] = useState(false);
  const record = state ? getDispatchBySlug(state, slug) : null;
  if (!record) return null;
  const d = describeDispatch(record);

  const go = (route) => {
    setOpen(false);
    router.push(route);
  };

  return (
    <section aria-label="Current dispatch" className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-cyan/25 bg-navy-900/80 px-4 py-2">
      <p className="text-sm font-extrabold uppercase tracking-wide text-ink">
        <span className="mr-2 text-[10px] tracking-[0.3em] text-gold">DISPATCH</span>#{d.number}
      </p>
      <p className="min-w-0 text-xs text-ink">
        {d.reference ? (
          <>
            <span className="font-bold">{d.reference}</span> <span className="text-ink-dim">{d.route}</span>
          </>
        ) : (
          <span className="text-ink-dim">{d.shortlistCount} loads shortlisted</span>
        )}
      </p>
      <span className="flex items-center gap-1.5 text-[11px] text-ink-dim">
        {d.stageLabel} <StatusBadge statusId={d.statusId} label={d.statusLabel} />
      </span>
      {d.completed && (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-gold-bright">
          <Lock className="size-3" aria-hidden="true" /> Completed, read-only
        </span>
      )}
      <GameButton size="sm" variant="ghost" className="ml-auto" onClick={() => setOpen(true)}>
        <ArrowLeftRight className="size-3.5" aria-hidden="true" /> Switch
      </GameButton>

      <GameDrawer open={open} onClose={() => setOpen(false)} title="Dispatches" subtitle="Switch to another dispatch">
        <GameButton className="w-full" onClick={() => go(ROUTES.board)}>
          <Plus className="size-4" aria-hidden="true" /> New Dispatch
        </GameButton>
        <DispatchList state={state} currentSlug={slug} onOpen={go} />
        <button type="button" onClick={() => go(ROUTES.hub)} className="w-full rounded-lg border border-line py-1.5 text-xs font-semibold text-ink transition-colors hover:border-cyan hover:text-cyan-bright">
          Open Dispatches page
        </button>
      </GameDrawer>
    </section>
  );
}
