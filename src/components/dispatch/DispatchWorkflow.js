"use client";

import { Check } from "lucide-react";
import { phase6Page } from "@/data/phase6Missions";
import { requiredTopicsFor } from "@/lib/driverChat";
import { formatCurrency } from "@/lib/text";
import GameButton from "@/components/game/GameButton";

// Live workflow: each card reflects real progress (reviewed load, driver, topics, dispatch, assignment).
export default function DispatchWorkflow({ m, onComplete }) {
  const { d, neg, entry, run, workflow } = m;
  const required = requiredTopicsFor(neg.load);
  const covered = required.filter((t) => d.topics.includes(t)).length;

  const body = [
    d.loadReviewed ? `${neg.load.referenceNumber} reviewed at ${formatCurrency(neg.agreedRate)}` : "Review the negotiated load and its agreed rate.",
    entry ? `${entry.driver.name} · ${entry.truck.id}` : "Find a driver who can make the pickup.",
    `${covered} / ${required.length} topics communicated`,
    d.response === "accepted" ? "Driver accepted the dispatch" : d.dispatchSent ? "Dispatch sent, waiting on the driver" : d.dispatchReviewed ? "Dispatch reviewed, ready to send" : "Review and send the dispatch sheet.",
    d.assigned ? m.statusLabel : "Confirm the assignment once the driver accepts.",
  ];

  return (
    <ol aria-label="Mission workflow" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
      {phase6Page.workflow.map((step, i) => {
        const state = workflow[i];
        return (
          <li
            key={step.id}
            aria-current={state === "current" ? "step" : undefined}
            className={`rounded-xl border px-3 py-2 transition-all duration-300 ${state === "done" ? "border-success/40 bg-success/5" : state === "current" ? "border-cyan/60 bg-cyan/5 shadow-[0_0_16px_rgb(32_199_232/0.2)]" : "border-line/70 bg-surface/60"}`}
          >
            <p className="flex items-center gap-2 text-xs font-bold text-ink">
              <span className={`grid size-5 place-items-center rounded-full text-[10px] ${state === "done" ? "bg-success text-navy-950" : state === "current" ? "bg-cyan-bright text-navy-950" : "bg-surface-2 text-ink-dim"}`}>
                {state === "done" ? <Check className="size-3" aria-label="Done" /> : i + 1}
              </span>
              {step.title}
            </p>
            <div className="mt-1.5 text-[11px] leading-snug text-ink-dim">{body[i]}</div>
            {i === 4 && !run.completed && (
              <GameButton size="sm" className="mt-2 w-full" disabled={!m.allTasksDone} onClick={onComplete}>
                Mark as Completed
              </GameButton>
            )}
          </li>
        );
      })}
    </ol>
  );
}
