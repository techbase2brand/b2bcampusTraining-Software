import { Check, Circle } from "lucide-react";
import { checklistProgress } from "@/lib/taskChecklists";

// Visible checklist for a task that needs several things done. Pure display: `checklist` comes from
// lib/taskChecklists.js, so every tick reflects real mission state.
export default function TaskChecklist({ checklist, className = "" }) {
  if (!checklist) return null;
  const { done, total } = checklistProgress(checklist);
  return (
    <div className={className} aria-label={checklist.title}>
      <p className="flex items-center gap-2 text-xs font-bold text-ink">
        {checklist.title}
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${done === total ? "bg-success/20 text-success" : "bg-surface-2 text-ink-dim"}`}>
          {done} / {total} complete
        </span>
      </p>
      <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
        {checklist.items.map((i) => (
          <li key={i.id} className={`flex items-center gap-1.5 text-sm ${i.done ? "font-semibold text-success" : "text-ink-dim"}`}>
            {i.done ? <Check className="size-4 shrink-0" aria-hidden="true" /> : <Circle className="size-3.5 shrink-0" aria-hidden="true" />}
            <span className="sr-only">{i.done ? "Done: " : "To do: "}</span>
            {i.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
