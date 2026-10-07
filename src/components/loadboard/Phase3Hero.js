import { ArrowRight, Lightbulb } from "lucide-react";
import { phase3Page } from "@/data/phase3Missions";
import GameImage from "@/components/game/GameImage";
import GameButton from "@/components/game/GameButton";
import TrainingAgentSlot from "@/components/training/TrainingAgentSlot";
import TrainingFeedback from "@/components/training/TrainingFeedback";

// Compact page header: phase title on the left, trainer and the mission-instructor card on the right.
export default function Phase3Hero({ gender = "male", m }) {
  const { mission, run, task, taskText, feedback, hint, agentLine } = m;
  const taskNumber = task ? String(run.currentTask + 1).padStart(2, "0") : null;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-cyan/15 bg-navy-900 shadow-[0_8px_30px_rgb(0_0_0/0.3)]">
      <GameImage
        src="/images/login-truck.png"
        alt=""
        sizes="70vw"
        className="absolute inset-y-0 left-[22%] right-0 [mask-image:linear-gradient(90deg,transparent,#000_40%)]"
      />
      <div className="absolute inset-0 bg-linear-to-r from-navy-950 via-navy-950/70 to-navy-950/10" />

      <div className="relative flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4 sm:px-6 lg:flex-nowrap">
        <div className="min-w-0 lg:w-[26%] lg:shrink-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-gold">{phase3Page.eyebrow}</p>
          <h1 className="mt-1 text-xl font-extrabold uppercase leading-tight tracking-wide text-ink sm:text-2xl">{phase3Page.title}</h1>
          <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-ink-dim">{phase3Page.subtitle}</p>
        </div>

        <TrainingAgentSlot gender={gender} className="-mb-4 hidden h-36 w-24 shrink-0 self-end lg:block" />

        <div className="w-full min-w-0 rounded-xl border border-cyan/30 bg-navy-950/85 p-3 shadow-[0_0_24px_rgb(32_199_232/0.15)] backdrop-blur-sm lg:ml-auto lg:max-w-md lg:flex-1">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-cyan opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-cyan-bright" />
            </span>
            <p className="label-xs text-cyan-bright">Training Agent</p>
            <p className="text-[10px] text-ink-dim">Mission Instructor</p>
          </div>

          {run.completed ? (
            <p className="mt-2 text-sm leading-snug text-ink">{phase3Page.completion.subtitle}</p>
          ) : run.started ? (
            <>
              <p className="mt-2 text-sm leading-snug text-ink">{agentLine}</p>
              {task && (
                <p className="mt-2 flex items-start gap-2 rounded-lg bg-surface-2/70 px-2.5 py-1.5 text-xs text-ink-dim">
                  <span className="rounded bg-blue/25 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-cyan-bright">TASK {taskNumber}</span>
                  <span className="min-w-0">{taskText}</span>
                </p>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm leading-snug text-ink-dim">{mission.intro}</p>
          )}

          {(feedback || hint) && (
            <div className="mt-2 space-y-1.5">
              {feedback && <TrainingFeedback tone={feedback.tone}>{feedback.text}</TrainingFeedback>}
              {hint && <TrainingFeedback tone="hint">{hint}</TrainingFeedback>}
            </div>
          )}

          <div className="mt-2.5">
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
