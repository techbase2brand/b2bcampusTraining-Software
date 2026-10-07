"use client";

import { ArrowRight, Check, Lightbulb } from "lucide-react";
import { phase5Page } from "@/data/phase5Missions";
import GameImage from "@/components/game/GameImage";
import GameButton from "@/components/game/GameButton";
import TrainingAgentSlot from "@/components/training/TrainingAgentSlot";
import TrainingFeedback from "@/components/training/TrainingFeedback";

// Compact mission header: title, the 5-step flow, the trainer and the Training Agent card.
export default function MissionHeader({ m, gender = "male" }) {
  const { mission, run, task, taskText, feedback, hint, agentLine } = m;
  const current = run.completed ? mission.steps.length : run.started ? task?.step ?? 0 : -1; // -1 = not started

  return (
    <section className="relative overflow-hidden rounded-2xl border border-cyan/15 bg-navy-900 shadow-[0_8px_30px_rgb(0_0_0/0.3)]">
      <GameImage src="/images/login-truck.png" alt="" sizes="60vw" className="absolute inset-y-0 left-[30%] right-0 [mask-image:linear-gradient(90deg,transparent,#000_40%)]" />
      <div className="absolute inset-0 bg-linear-to-r from-navy-950 via-navy-950/75 to-navy-950/30" />

      <div className="relative flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-5 lg:flex-nowrap">
        <div className="min-w-0 lg:flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">{phase5Page.eyebrow}</p>
          <h1 className="text-lg font-extrabold uppercase leading-tight tracking-wide text-ink sm:text-xl">{phase5Page.title}</h1>
          <p className="mt-0.5 hidden max-w-lg text-[11px] leading-snug text-ink-dim sm:block">{phase5Page.subtitle}</p>

          <ol aria-label="Mission steps" className="mt-2 flex flex-wrap items-center gap-x-0.5 gap-y-1">
            {mission.steps.map((label, i) => {
              const done = i < current;
              const active = i === current;
              return (
                <li key={label} className="flex items-center gap-0.5">
                  <span
                    aria-current={active ? "step" : undefined}
                    className={`flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold transition-all duration-300 ${
                      active
                        ? "border-cyan-bright bg-cyan/10 text-ink shadow-[0_0_12px_rgb(37_217_255/0.4)]"
                        : done
                          ? "border-success/50 bg-success/10 text-success"
                          : "border-line bg-navy-950/60 text-ink-dim"
                    }`}
                  >
                    <span className={`grid size-3.5 place-items-center rounded-full text-[8px] font-bold ${done ? "bg-success text-navy-950" : active ? "bg-cyan-bright text-navy-950" : "bg-surface-2"}`}>
                      {done ? <Check className="size-2.5" aria-label="Done" /> : i + 1}
                    </span>
                    {label}
                  </span>
                  {i < mission.steps.length - 1 && <ArrowRight className={`size-3 ${done ? "text-success" : "text-line"}`} aria-hidden="true" />}
                </li>
              );
            })}
          </ol>
        </div>

        <TrainingAgentSlot gender={gender} className="-mb-2 hidden h-24 w-16 shrink-0 self-end xl:block" />

        <div className="w-full min-w-0 rounded-xl border border-cyan/30 bg-navy-950/85 p-2.5 shadow-[0_0_20px_rgb(32_199_232/0.15)] backdrop-blur-sm lg:max-w-md">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-cyan opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-cyan-bright" />
            </span>
            <p className="label-xs text-cyan-bright">Training Agent</p>
          </div>
          <p className="mt-1.5 text-xs leading-snug text-ink">{agentLine}</p>
          {run.started && task && (
            <p className="mt-1.5 flex items-start gap-2 rounded-md bg-surface-2/70 px-2 py-1 text-[11px] text-ink-dim">
              <span className="rounded bg-blue/25 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-cyan-bright">TASK {String(run.currentTask + 1).padStart(2, "0")}</span>
              <span className="min-w-0">{taskText}</span>
            </p>
          )}
          {(feedback || hint) && (
            <div className="mt-1.5 space-y-1">
              {feedback && <TrainingFeedback tone={feedback.tone}>{feedback.text}</TrainingFeedback>}
              {hint && <TrainingFeedback tone="hint">{hint}</TrainingFeedback>}
            </div>
          )}
          <div className="mt-2">
            {!run.started ? (
              <GameButton size="sm" onClick={m.start}>
                Start Mission <ArrowRight className="size-3.5" aria-hidden="true" />
              </GameButton>
            ) : (
              <GameButton size="sm" variant="ghost" onClick={m.requestHint} disabled={!task}>
                <Lightbulb className="size-3.5" aria-hidden="true" /> Hint
              </GameButton>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
