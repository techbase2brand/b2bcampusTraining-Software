"use client";

import { useState } from "react";
import { ArrowRight, Check, Lightbulb, CircleHelp } from "lucide-react";
import { missingText } from "@/lib/taskChecklists";
import GameButton from "./GameButton";
import GameModal from "./GameModal";
import TaskChecklist from "./TaskChecklist";
import TrainingFeedback from "@/components/training/TrainingFeedback";
import TaskHighlight from "@/components/dispatcher/TaskHighlight";

// Compact stepper: done steps are green ticks, the current step is lit, the rest are muted.
export function MissionStepper({ steps, current }) {
  return (
    <ol aria-label="Mission steps" className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs font-semibold">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} aria-current={active ? "step" : undefined} className={`flex items-center gap-1 ${done ? "text-success" : active ? "text-cyan-bright" : "text-ink-dim/70"}`}>
            {i > 0 && <span className="mr-0.5 text-line" aria-hidden="true">-</span>}
            <span aria-hidden="true">{done ? <Check className="size-3" /> : active ? "→" : "○"}</span>
            <span className="sr-only">{done ? "Done: " : active ? "Current: " : "Upcoming: "}</span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}

// The top of every mission page: title, compact stepper, ONE current task with its visible checklist
// (when the task needs several things) and its main action.
// `primary` is { label, onClick, disabled?, icon? } or null when the action lives in the workspace.
// `where` is a short pointer ("Use the chat below") shown when there is no button.
// `hideFinishedCta` leaves the finished-state button to the page (one primary action per screen);
// `hideCta` does the same for every button once the mission has started (the page shows the one
// primary action elsewhere); `hideStepper` hides the mission stepper.
export default function MissionTaskBar({ eyebrow, title, m, primary = null, where = null, doneText = null, hideFinishedCta = false, hideCta = false, hideStepper = false, onComplete }) {
  const [help, setHelp] = useState(false);
  const { mission, run, task, taskText, feedback, hint, agentLine, checklist } = m;
  const steps = mission.steps ?? [];
  const current = run.completed ? steps.length : run.started ? task?.step ?? 0 : -1;
  const finished = run.started && !run.completed && !task;

  let cta = primary;
  if (!run.started) cta = { label: "Start Mission", onClick: m.start, icon: ArrowRight };
  else if (hideCta) cta = null;
  else if (finished) cta = hideFinishedCta ? null : primary ?? { label: "Complete Mission", onClick: onComplete, disabled: !m.allTasksDone };
  const Icon = cta?.icon;
  const showChecklist = run.started && task && checklist;
  // The Training Agent says what is missing, using the checklist when there is one.
  const agentSays = (showChecklist && missingText(checklist)) || agentLine;

  return (
    <section className="glass-strong rounded-2xl px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-base font-extrabold uppercase tracking-wide text-ink sm:text-lg">
          <span className="mr-2 text-xs font-bold tracking-[0.25em] text-gold">{eyebrow}</span>
          {title}
        </h1>
        {steps.length > 0 && !hideStepper && <MissionStepper steps={steps} current={current} />}
      </div>

      <div className="liquid-border liquid-border--active mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-navy-950/60 px-3 py-2.5">
        <div className="min-w-0 flex-1 basis-72">
          <p className="label-xs text-cyan-bright">{run.completed ? "Mission complete" : finished ? "All tasks done" : run.started ? "Current task" : "Ready?"}</p>
          <p className="mt-0.5 text-sm font-semibold leading-snug text-ink">
            {run.completed ? agentLine : finished ? doneText ?? "Finish the mission to save your result." : run.started ? taskText : agentLine}
          </p>
          {showChecklist && <TaskChecklist checklist={checklist} className="mt-2" />}
          {!cta && where && run.started && !showChecklist && <p className="mt-0.5 text-xs text-ink-dim">{where}</p>}
          {run.started && !run.completed && agentSays && (
            <p className="mt-1.5 text-xs text-ink-dim">
              <span className="font-bold text-cyan-bright">Training Agent:</span> {agentSays}
            </p>
          )}
          {(feedback || hint) && (
            <div className="mt-1.5 space-y-1">
              {feedback && <TrainingFeedback tone={feedback.tone}>{feedback.text}</TrainingFeedback>}
              {hint && <TrainingFeedback tone="hint">{hint}</TrainingFeedback>}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {run.started && (
            <>
              <GameButton size="sm" variant="ghost" onClick={m.requestHint} disabled={!task}>
                <Lightbulb className="size-3.5" aria-hidden="true" /> Hint
              </GameButton>
              <GameButton size="sm" variant="ghost" onClick={() => setHelp(true)}>
                <CircleHelp className="size-3.5" aria-hidden="true" /> View Help
              </GameButton>
            </>
          )}
          {cta && (
            <TaskHighlight active={!cta.disabled}>
              <GameButton onClick={cta.onClick} disabled={cta.disabled} className="uppercase tracking-wide">
                {cta.label} {Icon && <Icon className="size-4" aria-hidden="true" />}
              </GameButton>
            </TaskHighlight>
          )}
        </div>
      </div>

      <GameModal open={help} onClose={() => setHelp(false)} title="Training help">
        <p className="label-xs text-cyan-bright">Training Agent</p>
        <p className="mt-1 text-sm leading-relaxed text-ink">{agentLine}</p>
        {task && (
          <>
            <p className="label-xs mt-3">This task</p>
            <p className="mt-1 text-sm text-ink">{taskText}</p>
            {showChecklist && <TaskChecklist checklist={checklist} className="mt-3" />}
            <p className="label-xs mt-3">Hint</p>
            <p className="mt-1 text-sm text-ink-dim">{task.hint}</p>
          </>
        )}
        <GameButton className="mt-5 w-full" variant="ghost" onClick={() => setHelp(false)}>
          Close
        </GameButton>
      </GameModal>
    </section>
  );
}
