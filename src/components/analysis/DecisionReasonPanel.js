"use client";

import { useState } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { mission03, selectionCopy } from "@/data/phase4Missions";
import { getLoad } from "@/lib/loadSelectors";
import GameButton from "@/components/game/GameButton";
import TrainingFeedback from "@/components/training/TrainingFeedback";

// "Why did you choose this load?" Tested reasons (and the tempting distractors) are selectable;
// the always-true gate confirmations are shown as information only and are never scored.
export default function DecisionReasonPanel({ m, onFinish }) {
  const [draft, setDraft] = useState(m.reasonIds.filter((id) => mission03.decisionReasons.some((r) => r.id === id && !r.informational)));
  const loadId = m.selectedBestLoadId;
  if (!loadId && !m.accepted) return null;

  const selectable = mission03.decisionReasons.filter((r) => !r.informational);
  const informational = mission03.decisionReasons.filter((r) => r.informational);
  const toggle = (id) => setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  const load = getLoad(loadId ?? m.analyses.find((a) => a.loadId)?.loadId);

  return (
    <section aria-label="Decision reasons" className="panel p-3">
      <h2 className="panel-title">{selectionCopy.reasonsTitle}</h2>
      <p className="mt-1 text-[11px] text-ink-dim">
        {m.accepted ? "Decision recorded." : `${load?.referenceNumber ?? ""} selected. ${selectionCopy.reasonsHint}`}
      </p>

      <ul className="mt-2.5 space-y-1.5">
        {selectable.map((r) => (
          <li key={r.id}>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-line/60 bg-navy-900/60 px-2.5 py-1.5 text-xs text-ink transition-colors hover:border-cyan/50">
              <input type="checkbox" className="size-3.5 accent-cyan" checked={draft.includes(r.id)} disabled={m.accepted} onChange={() => toggle(r.id)} />
              {r.label}
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-2.5">
        <p className="label-xs">{selectionCopy.informationalTitle}</p>
        <ul className="mt-1 flex flex-wrap gap-1.5">
          {informational.map((r) => (
            <li key={r.id} className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] text-success">
              <CheckCircle2 className="size-3" aria-hidden="true" /> {r.label}
            </li>
          ))}
        </ul>
      </div>

      {m.feedback && (
        <div className="mt-2.5">
          <TrainingFeedback tone={m.feedback.tone}>
            {m.feedback.title && <strong className="mr-1 uppercase">{m.feedback.title}.</strong>}
            {m.feedback.text}
          </TrainingFeedback>
        </div>
      )}

      <div className="mt-3">
        {m.accepted ? (
          <GameButton className="w-full" onClick={onFinish}>
            Finish Analysis <ArrowRight className="size-4" aria-hidden="true" />
          </GameButton>
        ) : (
          <GameButton className="w-full" onClick={() => m.submit(draft)}>
            {selectionCopy.submitReasons}
          </GameButton>
        )}
      </div>
    </section>
  );
}
