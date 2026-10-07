// The single progression rule for sidebar items AND route guards.
// Unlocks are CUMULATIVE: access depends on the highest level the student has reached, which only
// ever increases, so finishing a later mission can never lock an earlier module again.

// Highest level reached. Also derived from completedLevels, so older or inconsistent saved state
// (e.g. a stale currentLevel) can never lower it.
export function effectiveLevel(state) {
  const completed = (state.completedLevels ?? []).map((id) => id + 1);
  return Math.max(1, state.currentLevel ?? 1, ...completed);
}

export const hasReachedLevel = (state, level) => effectiveLevel(state) >= level;

export function isNavUnlocked(item, state) {
  return item.unlockLevel != null && hasReachedLevel(state, item.unlockLevel);
}

// Resolve a nav definition (data/navigation.js) against the saved progress.
// Items without an unlockLevel keep their static status (preview / locked).
export function resolveNav(items, state) {
  return items.map((item) => {
    if (item.unlockLevel == null) return item;
    return { ...item, status: isNavUnlocked(item, state) ? "enabled" : "locked" };
  });
}

// Route guard using the same rule as the sidebar: a route is open when its nav item is unlocked.
export function canAccessRoute(items, route, state) {
  const matches = items.filter((i) => i.page && i.route === route);
  return matches.length === 0 || matches.every((i) => isNavUnlocked(i, state));
}
