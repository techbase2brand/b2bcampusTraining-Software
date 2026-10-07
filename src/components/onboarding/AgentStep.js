"use client";

import { useState } from "react";
import * as Icons from "lucide-react";
import { agentMessage, agentCapabilities } from "@/data/onboarding";
import TrainingAgentSlot from "@/components/training/TrainingAgentSlot";
import GameButton from "@/components/game/GameButton";
import StepNav from "./StepNav";

const GREETING = "Hi! I'm your Training Agent.";

export default function AgentStep({ state, onNext, onBack }) {
  const [replays, setReplays] = useState(0);

  return (
    <div>
      <div className="grid items-center gap-6 md:grid-cols-[1fr_1.2fr]">
        <TrainingAgentSlot gender={state.avatarSelection ?? "male"} className="h-72 md:h-[26rem]" />
        <div className="space-y-6">
          <div
            key={replays}
            className="animate-fade-up rounded-2xl rounded-bl-none border border-line bg-surface-2 p-6"
          >
            <h2 className="text-xl font-bold text-ink">{GREETING}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-dim">{agentMessage.replace(`${GREETING} `, "")}</p>
          </div>
          <ul className="space-y-3 pl-2">
            {agentCapabilities.map((c) => {
              const Icon = Icons[c.icon];
              return (
                <li key={c.label} className="flex items-center gap-3 text-sm text-ink">
                  <span className="grid size-8 place-items-center rounded-lg border border-cyan/50 bg-surface text-cyan-bright">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  {c.label}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <StepNav onBack={onBack} onNext={onNext}>
        <GameButton variant="ghost" onClick={() => setReplays((n) => n + 1)}>
          Replay Instruction
        </GameButton>
        <GameButton variant="ghost" onClick={onNext}>
          Skip
        </GameButton>
      </StepNav>
    </div>
  );
}
