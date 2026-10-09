"use client";

import { useState } from "react";
import { CheckCircle2, Circle, ArrowRight, ChevronUp, ChevronDown } from "lucide-react";
import TrainingAgentSlot from "@/components/training/TrainingAgentSlot";
import TrainingFeedback from "@/components/training/TrainingFeedback";
import GameButton from "@/components/game/GameButton";
import ProgressBar from "@/components/game/ProgressBar";

// Right column on desktop; collapsible bottom sheet below lg.
export default function MissionPanel({ m }) {
  const { mission, progress, task, choices, feedback, hint, instructionKey } = m;
  const [open, setOpen] = useState(false);
  const total = mission.tasks.length;

  return (
    <aside
      aria-label="Mission panel"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-navy-900 shadow-[0_-8px_30px_rgb(0_0_0/0.4)] lg:static lg:z-auto lg:w-[clamp(15rem,19vw,20rem)] lg:shrink-0 lg:border-l lg:border-t-0 lg:shadow-none"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left lg:hidden"
      >
        <span className="text-sm font-semibold text-ink">
          Task {Math.min(progress.currentTask + 1, total)} / {total}: {task?.title ?? "Complete"}
        </span>
        {open ? <ChevronDown className="size-4" aria-hidden="true" /> : <ChevronUp className="size-4" aria-hidden="true" />}
      </button>

      <div className={`${open ? "block" : "hidden"} max-h-[60vh] overflow-y-auto p-4 lg:block lg:max-h-none lg:p-5`}>
        <p className="text-[11px] font-bold tracking-wider text-gold">CURRENT MISSION</p>
        <h2 className="mt-1 text-lg font-extrabold text-ink">{mission.title}</h2>
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar value={progress.completedTasks.length} max={total} tone="success" label="Mission progress" />
          <span className="text-xs font-semibold tabular-nums text-ink-dim">
            {progress.completedTasks.length} / {total}
          </span>
        </div>

        <ul className="mt-4 space-y-2">
          {mission.tasks.map((t, i) => {
            const done = progress.completedTasks.includes(t.id);
            const current = i === progress.currentTask && !progress.completed;
            return (
              <li
                key={t.id}
                className={`flex items-center gap-2 text-sm ${
                  done ? "text-success" : current ? "font-semibold text-cyan-bright" : "text-ink-dim"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="size-4" aria-label="Done" />
                ) : current ? (
                  <ArrowRight className="size-4" aria-label="Current" />
                ) : (
                  <Circle className="size-4" aria-label="Pending" />
                )}
                {t.title}
              </li>
            );
          })}
        </ul>

        {task && (
          <div className="mt-5 space-y-3">
            <div className="flex items-start gap-3">
              <TrainingAgentSlot size="sm" />
              <p key={instructionKey} className="animate-fade-up text-sm text-ink">
                {task.instruction}
              </p>
            </div>

            {choices.length > 0 && (
              <div className="grid gap-2" role="group" aria-label="Answer choices">
                {choices.map((c) => (
                  <GameButton
                    key={c.value}
                    variant="ghost"
                    className="justify-start normal-case"
                    onClick={() => m.report({ type: "answer", value: c.value })}
                  >
                    {c.label}
                  </GameButton>
                ))}
              </div>
            )}

            {feedback && <TrainingFeedback tone={feedback.tone}>{feedback.text}</TrainingFeedback>}
            {hint && <TrainingFeedback tone="hint">{hint}</TrainingFeedback>}

            <div className="flex gap-2">
              <GameButton variant="ghost" className="flex-1 px-3" onClick={m.requestHint}>
                Hint
              </GameButton>
              <GameButton variant="ghost" className="flex-1 px-3" onClick={m.replayInstruction}>
                Replay
              </GameButton>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
