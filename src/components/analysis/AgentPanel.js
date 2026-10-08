"use client";

import { useState } from "react";
import { Lightbulb, CircleHelp, ArrowRight } from "lucide-react";
import { mission03, selectionCopy } from "@/data/phase4Missions";
import { missingText } from "@/lib/taskChecklists";
import GameButton from "@/components/game/GameButton";
import GameModal from "@/components/game/GameModal";
import TaskChecklist from "@/components/game/TaskChecklist";
import TrainingFeedback from "@/components/training/TrainingFeedback";

// Current task for Load Analysis: the instruction, its visible checklist (when the task needs
// several things), the question's answer buttons, feedback, Hint and View Help. The Training Agent
// is one line, not a card with a character.
export default function AgentPanel({ m, onFinish }) {
  const [help, setHelp] = useState(false);
  const { run, task, feedback, hint, checklist } = m;
  const number = task ? String(run.currentTask + 1).padStart(2, "0") : null;
  const inDecision = Boolean(m.selectedBestLoadId) || m.accepted; // decision feedback is shown beside the reasons
  const showFeedback = feedback && !inDecision;
  const agentSays = (checklist && missingText(checklist)) || null;

  return (
    <section aria-label="Current task" className="panel p-3">
      <p className="label-xs text-cyan-bright">{run.completed ? "Mission complete" : run.started ? "Current task" : "Ready?"}</p>
      <div className="mt-1.5 space-y-2.5">
        {!run.started ? (
          <>
            <p className="text-sm leading-snug text-ink">{mission03.intro}</p>
            <GameButton size="sm" onClick={m.start}>
              Start Mission <ArrowRight className="size-3.5" aria-hidden="true" />
            </GameButton>
          </>
        ) : run.completed ? (
          <p className="text-sm text-ink">Analysis complete. Your chosen load carries forward to broker communication.</p>
        ) : (
          <>
            {task && (
              <p className="flex items-start gap-2 text-sm leading-snug text-ink">
                <span className="mt-0.5 rounded bg-blue/25 px-1.5 py-0.5 text-xs font-bold tabular-nums text-cyan-bright">TASK {number}</span>
                <span>{m.taskText}</span>
              </p>
            )}
            {task && <TaskChecklist checklist={checklist} />}
            {m.allTasksDone && !run.completed && (
              <GameButton size="sm" onClick={onFinish}>
                Complete Mission <ArrowRight className="size-3.5" aria-hidden="true" />
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

        {agentSays && run.started && !run.completed && (
          <p className="text-xs text-ink-dim">
            <span className="font-bold text-cyan-bright">Training Agent:</span> {agentSays}
          </p>
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
          <div className="flex gap-2">
            <GameButton size="sm" variant="ghost" onClick={m.requestHint} disabled={!task}>
              <Lightbulb className="size-3.5" aria-hidden="true" /> Hint
            </GameButton>
            <GameButton size="sm" variant="ghost" onClick={() => setHelp(true)} disabled={!task}>
              <CircleHelp className="size-3.5" aria-hidden="true" /> View Help
            </GameButton>
          </div>
        )}
      </div>

      <GameModal open={help} onClose={() => setHelp(false)} title="Training help">
        <p className="label-xs text-cyan-bright">This task</p>
        <p className="mt-1 text-sm text-ink">{m.taskText}</p>
        {checklist && <TaskChecklist checklist={checklist} className="mt-3" />}
        <p className="label-xs mt-3">Hint</p>
        <p className="mt-1 text-sm text-ink-dim">{task?.hint}</p>
        <GameButton className="mt-5 w-full" variant="ghost" onClick={() => setHelp(false)}>
          Close
        </GameButton>
      </GameModal>
    </section>
  );
}
