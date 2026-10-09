// Suggested-message chips follow the visible checklist: topics still missing come first and are
// highlighted, topics already covered are marked and sink to the end. Order is otherwise unchanged.
export function orderChips(chips, checklist, covered = []) {
  const missing = new Set((checklist?.items ?? []).filter((i) => !i.done && i.topicId).map((i) => i.topicId));
  return chips
    .map((q, index) => ({ ...q, needed: missing.has(q.id), covered: covered.includes(q.id), index }))
    .sort((a, b) => Number(b.needed) - Number(a.needed) || Number(a.covered) - Number(b.covered) || a.index - b.index);
}

export const chipClass = (q) =>
  `rounded-full app-border px-2.5 py-1 text-xs transition-colors disabled:opacity-40 ${
    q.needed ? "app-border-active bg-cyan/10 font-semibold text-cyan-bright" : q.covered ? "app-border-subtle bg-navy-900/60 text-ink-dim" : " bg-navy-900 text-ink hover:border-cyan hover:text-cyan-bright"
  }`;

export const chipLabel = (q) => (q.covered ? `✓ ${q.label}` : q.label);
