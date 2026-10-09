import { Check, Lightbulb, ChevronRight } from "lucide-react";
import { fillTemplate } from "@/lib/text";
import { getTaskVars } from "@/lib/phase3Engine";
import GameButton from "@/components/game/GameButton";
import ProgressBar from "@/components/game/ProgressBar";

// Mission progression: completed / current / pending, driven by the persisted mission run.
export default function Phase3MissionPanel({ m }) {
  const { mission, run, task } = m;
  const vars = getTaskVars();
  const total = mission.tasks.length;
  const done = run.completedTasks.length;

  return (
    <aside aria-label="Mission tasks" className="panel flex flex-col p-3">
      <div className="flex items-center justify-between">
        <h2 className="panel-title">Mission Tasks</h2>
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold tabular-nums text-ink">
          {done} / {total}
        </span>
      </div>
      <ProgressBar value={done} max={total} tone="success" label="Mission progress" className="mt-2" />

      <ol className="mt-3 space-y-1.5">
        {mission.tasks.map((t, i) => {
          const isDone = run.completedTasks.includes(t.id);
          const current = run.started && !run.completed && i === run.currentTask;
          const number = String(i + 1).padStart(2, "0");
          return (
            <li
              key={t.id}
              aria-current={current ? "step" : undefined}
              className={`rounded-lg app-border px-2.5 py-1.5 transition-all duration-300 ${
                current
                  ? "app-border-active bg-cyan/10 shadow-[0_0_16px_rgb(32_199_232/0.2)]"
                  : isDone
                    ? "app-border-success bg-success/5"
                    : "app-border-subtle bg-navy-900/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold tabular-nums ${
                    isDone ? "bg-success text-navy-950" : current ? "bg-cyan-bright text-navy-950" : "bg-surface-2 text-ink-dim"
                  }`}
                >
                  {isDone ? <Check className="size-3" aria-label="Done" /> : current ? <ChevronRight className="size-3" aria-label="Current" /> : number}
                </span>
                <span className={`text-xs font-semibold ${isDone ? "text-success" : current ? "text-ink" : "text-ink-dim"}`}>
                  <span className="mr-1.5 tabular-nums opacity-60">{number}</span>
                  {t.title}
                </span>
              </div>
              {current && <p className="mt-1 pl-7 text-[11px] leading-snug text-ink-dim">{fillTemplate(t.instruction, vars)}</p>}
            </li>
          );
        })}
      </ol>

    </aside>
  );
}
