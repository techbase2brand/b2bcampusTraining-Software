// Presentation model for the Tracking journey view. Pure functions over the existing tracker output
// (lib/trackingEngine.js timeline + snapshot). Nothing is simulated or calculated here that the
// engine does not already provide: miles, legs, fractions, ETAs and health come straight from it.
// This only reshapes them for display (which phase we are in, segment sizes, checkpoint positions).

import { timelineRows } from "@/data/phase7Missions";
import { formatDuration } from "./text";

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const pct = (part, whole) => (whole > 0 ? Math.round((clamp(part, 0, whole) / whole) * 100) : 100);

export const PHASES = {
  "to-pickup": { title: "Driver to pickup", short: "TO PICKUP" },
  "at-pickup": { title: "At the shipper", short: "AT PICKUP" },
  loaded: { title: "Loaded transit", short: "LOADED TRANSIT" },
  arrived: { title: "Arrived at delivery", short: "ARRIVED" },
};

export function getPhase(snap) {
  if (snap.statusId === "arrived-delivery") return "arrived";
  if (snap.leg === "loaded") return "loaded";
  if (snap.statusId === "arrived-pickup" || snap.statusId === "loading") return "at-pickup";
  return "to-pickup";
}

// Everything the journey card draws. `legPercent` is the progress on the leg the truck is on now,
// `tripPercent` the progress over deadhead + loaded miles together.
export function getJourney({ tl, snap }) {
  const deadhead = tl.deadhead;
  const loaded = tl.loadedMiles;
  const total = deadhead + loaded;
  const remaining = snap.remainingMiles;
  const completed = clamp(total - remaining, 0, total);
  const phase = getPhase(snap);

  const toPickupRemaining = snap.leg === "pickup" ? Math.max(0, remaining - loaded) : 0;
  const toPickupDone = deadhead - toPickupRemaining;
  const loadedRemaining = snap.leg === "loaded" ? remaining : loaded;
  const loadedDone = loaded - loadedRemaining;

  // Checkpoints: the scripted mid-leg positions (not the start / end events), each with its own leg.
  const checkpoints = tl.steps
    .filter((s) => s.frac > 0 && s.frac < 1)
    .map((s, i) => ({ id: s.id, index: s.index, leg: s.leg, frac: s.frac, label: `Checkpoint ${i + 1}`, reached: s.index <= snap.index }));

  // Combined view (before the pickup is done) when there is a deadhead leg to show; otherwise only
  // the loaded route is drawn. `split` = where pickup sits on the bar, in percent.
  const showDeadhead = deadhead > 0 && (phase === "to-pickup" || phase === "at-pickup");
  const split = showDeadhead ? clamp(Math.round((deadhead / total) * 100), 18, 55) : 0;
  const legFrac = snap.frac;
  const truckAt = showDeadhead ? (snap.leg === "pickup" ? split * legFrac : split + (100 - split) * legFrac) : snap.leg === "loaded" ? 100 * legFrac : 0;
  const at = (leg, frac) => (showDeadhead ? (leg === "pickup" ? split * frac : split + (100 - split) * frac) : leg === "loaded" ? 100 * frac : null);

  return {
    phase,
    deadhead,
    loaded,
    total,
    remaining,
    completed,
    tripPercent: pct(completed, total),
    legPercent: phase === "to-pickup" || phase === "at-pickup" ? pct(toPickupDone, deadhead) : pct(loadedDone, loaded),
    toPickupRemaining,
    loadedRemaining,
    showDeadhead,
    split,
    truckAt: clamp(truckAt, 0, 100),
    checkpoints: checkpoints.map((c) => ({ ...c, at: at(c.leg, c.frac) })).filter((c) => c.at != null),
    pickupDone: snap.leg === "loaded" || snap.statusId === "arrived-delivery",
  };
}

// The shipment status stepper (Assigned ... Arrived at Delivery). Assignment is already done by the
// time tracking exists, so the first two rows are always complete. "monitoring" is part of In Transit.
export function getStatusSteps(snap) {
  const currentId = snap.statusId === "monitoring" ? "in-transit" : snap.statusId;
  const currentIndex = timelineRows.findIndex((r) => r.id === currentId);
  return timelineRows.map((row, i) => {
    const arrived = currentId === "arrived-delivery";
    const state = row.status === null || i < currentIndex || (arrived && i === currentIndex) ? "done" : i === currentIndex ? "current" : "upcoming";
    return { id: row.id, label: row.label, state };
  });
}

// Why the shipment is not simply "on track" (short, for the health block). Null when it is.
export function getHealthReason({ snap }) {
  if (snap.health === "ON TRACK") return null;
  const slack = Math.round((snap.windowEnd.getTime() - snap.etaTarget.getTime()) / 60000);
  const where = snap.target === "pickup" ? "pickup" : "delivery";
  const window = slack >= 0 ? `ETA is ${formatDuration(slack)} before the ${where} window closes.` : `ETA is ${formatDuration(-slack)} after the ${where} window closes.`;
  const cause = snap.exception ? `${snap.exception.label}: +${snap.exception.minutes} min.` : snap.delays.length ? `${snap.delays.at(-1).label}: +${snap.delays.at(-1).minutes} min.` : null;
  return { cause, window };
}

// The latest events, oldest first, for the compact timeline.
export function getRecentEvents(t, count = 5) {
  return (t.activity ?? []).slice(-count);
}
