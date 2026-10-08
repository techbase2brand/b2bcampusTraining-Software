// The one action on the Load Board's sticky bar, and exactly what is still missing. Pure, so the
// enable/disable rules are testable. Continue is only possible once the shortlist is valid AND the
// mission is complete (completing it unlocks Load Analysis).
export function getShortlistCta({ count, min, validity, missionDone, tasksDone, tasksLeft, creating = false }) {
  const plural = (n) => (n === 1 ? "" : "s");
  const continueCta = { label: "Continue to Analysis", kind: "continue", disabled: true };
  if (count < min) return { ...continueCta, text: `${count} / ${min} minimum shortlisted. Add ${min - count} more suitable load${plural(min - count)}.` };
  if (!validity.valid) return { ...continueCta, text: validity.reason === "too-many" ? "Too many loads shortlisted. Remove one." : "Remove the loads your truck cannot move before you continue." };
  if (missionDone) return { ...continueCta, disabled: creating, text: `${count} loads shortlisted. Ready to analyse them.` };
  if (tasksDone) return { label: "Complete Mission", kind: "complete", disabled: false, text: `${count} loads shortlisted. All tasks are done: complete the mission to unlock Load Analysis.` };
  return { ...continueCta, text: `${count} loads shortlisted. Finish the ${tasksLeft} remaining mission task${plural(tasksLeft)} to continue.` };
}
