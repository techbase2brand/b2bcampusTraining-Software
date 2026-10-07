"use client";

import { Check } from "lucide-react";
import { phase5Page } from "@/data/phase5Missions";
import { commsTopics } from "@/data/brokerComms";
import { formatCurrency } from "@/lib/text";
import GameButton from "@/components/game/GameButton";
import BrokerAvatar from "./BrokerAvatar";

// Live workflow: each card reflects real progress (selected broker, topics verified, offers, agreed rate).
export default function WorkflowStrip({ m, onComplete }) {
  const { comms, workflow, cc, run } = m;
  const n = comms.negotiation;
  const covered = `${comms.coveredTopics.length} / ${commsTopics.length} topics verified`;

  const body = [
    comms.selectedBrokerId ? (
      <span className="flex items-center gap-2 text-ink">
        <BrokerAvatar broker={cc.broker} className="size-6 text-[10px]" /> {cc.broker.name}
      </span>
    ) : (
      "Find the broker who posted your load."
    ),
    covered,
    n.status === "agreed" ? `Agreed at ${formatCurrency(n.agreedRate)}` : n.counter != null ? `Broker offer ${formatCurrency(n.counter)}` : n.attempts ? `${n.attempts} request(s) made` : "Ask for a better rate and say why.",
    comms.confirmed ? `Final rate ${formatCurrency(n.agreedRate)} confirmed` : "Confirm the final rate and terms.",
    run.completed ? "Mission completed" : "Save your notes and finish the mission.",
  ];

  return (
    <ol aria-label="Mission workflow" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
      {phase5Page.workflow.map((step, i) => {
        const state = workflow[i];
        return (
          <li
            key={step.id}
            aria-current={state === "current" ? "step" : undefined}
            className={`rounded-xl border px-3 py-2 transition-all duration-300 ${
              state === "done" ? "border-success/40 bg-success/5" : state === "current" ? "border-cyan/60 bg-cyan/5 shadow-[0_0_16px_rgb(32_199_232/0.2)]" : "border-line/70 bg-surface/60"
            }`}
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
