"use client";

import { useState } from "react";
import { Lightbulb, Bot, Sparkles, ArrowRight } from "lucide-react";
import { mission03, selectionCopy } from "@/data/phase4Missions";
import GameButton from "@/components/game/GameButton";
import TrainingAgentSlot from "@/components/training/TrainingAgentSlot";
import TrainingFeedback from "@/components/training/TrainingFeedback";

// Mission instructor: the current task, its question and feedback. The AI tab is a preview with
// predefined observations (no live AI).
export default function AgentPanel({ m, gender = "male", onFinish }) {
  const [tab, setTab] = useState("agent");
  const [asked, setAsked] = useState(false);
  const { run, task, feedback, hint } = m;
  const number = task ? String(run.currentTask + 1).padStart(2, "0") : null;
  const inDecision = Boolean(m.selectedBestLoadId) || m.accepted; // decision feedback is shown beside the reasons
  const showFeedback = feedback && !inDecision;

  return (
    <section aria-label="Training agent" className="panel overflow-hidden">
      <div role="tablist" className="grid grid-cols-2 border-b border-line/70 text-xs font-semibold">
        {[
          ["agent", "Training Agent", Bot],
          ["ai", "AI Assistant", Sparkles],
        ].map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 transition-colors ${tab === id ? "bg-blue/25 text-ink" : "text-ink-dim hover:text-ink"}`}
          >
            <Icon className="size-3.5" aria-hidden="true" /> {label}
          </button>
        ))}
      </div>

      {tab === "agent" ? (
        <div className="relative p-3">
          <TrainingAgentSlot gender={gender} className="pointer-events-none absolute -bottom-2 right-0 hidden h-36 w-24 opacity-90 2xl:block" />
          <div className="relative space-y-2 2xl:pr-20">
            {!run.started ? (
              <>
                <p className="text-sm leading-snug text-ink">{mission03.intro}</p>
                <GameButton size="sm" onClick={m.start}>
                  Start Mission <ArrowRight className="size-3.5" aria-hidden="true" />
                </GameButton>
              </>
            ) : run.completed ? (
              <p className="text-sm text-ink">Analysis complete. Your selected load carries forward to the next phase.</p>
            ) : (
              <>
                {task && (
                  <p className="flex items-start gap-2 text-sm leading-snug text-ink">
                    <span className="mt-0.5 rounded bg-blue/25 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-cyan-bright">TASK {number}</span>
                    <span>{m.taskText}</span>
                  </p>
                )}
                {m.allTasksDone && !run.completed && (
                  <GameButton size="sm" onClick={onFinish}>
                    Finish Analysis <ArrowRight className="size-3.5" aria-hidden="true" />
                  </GameButton>
                )}
                {task?.question && (
                  <div role="group" aria-label="Answer choices" className="grid gap-1.5">
                    {m.choices.map((c) => (
                      <GameButton key={String(c.value)} variant="ghost" size="sm" className="justify-start" onClick={() => m.answer(c.value)}>
                        {c.label}
                      </GameButton>
                    ))}
                  </div>
                )}
              </>
            )}

            {showFeedback && (
              <div className="space-y-1.5">
                <TrainingFeedback tone={feedback.tone}>
                  {feedback.title && <strong className="mr-1 uppercase">{feedback.title}.</strong>}
                  {feedback.text}
                </TrainingFeedback>
                {feedback.title === "REVIEW YOUR DECISION" && (
                  <GameButton size="sm" variant="ghost" onClick={m.compareAgain}>
                    {selectionCopy.compareAgain}
                  </GameButton>
                )}
              </div>
            )}
            {hint && <TrainingFeedback tone="hint">{hint}</TrainingFeedback>}

            {run.started && !run.completed && (
              <GameButton size="sm" variant="ghost" onClick={m.requestHint} disabled={!task}>
                <Lightbulb className="size-3.5" aria-hidden="true" /> Hint
              </GameButton>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2 p-3">
          <p className="text-xs text-ink-dim">Preview only: these are fixed training observations, not a live AI.</p>
          <GameButton size="sm" variant="ghost" onClick={() => setAsked(true)}>
            <Sparkles className="size-3.5" aria-hidden="true" /> {mission03.aiPreview.prompt}
          </GameButton>
          {asked && (
            <ul className="space-y-1.5">
              {mission03.aiPreview.observations.map((o) => (
                <li key={o} className="rounded-lg border border-line/60 bg-navy-900/60 px-2.5 py-1.5 text-xs text-ink">
                  {o}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
