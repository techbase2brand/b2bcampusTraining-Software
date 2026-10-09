// Scripted shipment simulation (no GPS, no randomness). Given the assigned load and driver it builds a
// timeline of steps (data/phase7Missions.js trackingScenario) and answers, for any step: where the
// truck is, the ETA, the appointment status, remaining HOS, alerts and shipment health. All time maths
// is on the simulation clock. Nothing here names a load, driver or location.

import { simulationConfig } from "@/data/simulationConfig";
import { locations } from "@/data/locations";
import { trackingScenario, trackingStatuses, trackingAlertTemplates } from "@/data/phase7Missions";
import { straightLineMiles, driveMinutesForMiles } from "./geo";
import { getLocation } from "./loadSelectors";
import { evaluateDriver } from "./driverRules";
import { addMinutes, parseSimTime, fillTemplate, formatSimClock, formatDuration } from "./text";

const pad = (n) => String(n).padStart(2, "0");

// Date -> "YYYY-MM-DDTHH:mm" (the simulation's own string format; local fields, never real time).
export const toSimString = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

const minutesBetween = (a, b) => Math.round((b.getTime() - a.getTime()) / 60000);

// slack = minutes between the ETA and the end of its appointment window.
export function classifyEta(slackMinutes, buffer = trackingScenario.atRiskBufferMinutes) {
  if (slackMinutes < 0) return "LATE";
  return slackMinutes < buffer ? "AT RISK" : "ON TIME";
}

const lerp = (a, b, f) => a + (b - a) * f;

// Label for a point part-way along a leg: the end city at 0 / 1, otherwise the nearest reference city
// (not an endpoint) if one is close enough, else "N mi from <destination>".
function positionLabel(from, to, frac, remainingMiles) {
  const city = (l) => `${l.city}, ${l.state}`;
  if (frac <= 0) return city(from);
  if (frac >= 1) return city(to);
  const lat = lerp(from.lat, to.lat, frac);
  const lng = lerp(from.lng, to.lng, frac);
  let best = null;
  for (const l of locations) {
    if (l.id === from.id || l.id === to.id) continue;
    const d = straightLineMiles({ lat, lng }, l);
    if (!best || d < best.d) best = { l, d };
  }
  if (best && best.d <= trackingScenario.maxLocationMatchMiles) return `Near ${city(best.l)}`;
  return `${remainingMiles} mi from ${to.city}, ${to.state}`;
}

// The full scripted timeline for one load + driver, starting at the assignment time.
export function buildTimeline(load, entry, startString) {
  const sc = trackingScenario;
  const t0 = parseSimTime(startString ?? simulationConfig.clock.now);
  const driverLoc = getLocation(entry.truck.locationId);
  const pickupLoc = getLocation(load.originLocationId);
  const destLoc = getLocation(load.destinationLocationId);
  const deadhead = evaluateDriver(load, entry).deadheadMiles;
  const pickupMinutes = Math.max(driveMinutesForMiles(deadhead), sc.minLegMinutes);
  const loadedDrive = driveMinutesForMiles(load.loadedMiles);
  const { maxDriveHoursBeforeRest, restHours } = simulationConfig.hos;
  const rests = Math.floor(Math.max(loadedDrive - 1, 0) / (maxDriveHoursBeforeRest * 60));
  const loadedMinutes = loadedDrive + rests * restHours * 60;

  const depart = addMinutes(t0, sc.departAfterMinutes);
  const pickupStart = parseSimTime(load.pickupWindow.start);
  const arrive = addMinutes(depart, pickupMinutes);
  const loadingStart = arrive > pickupStart ? arrive : pickupStart;
  const loadDone = addMinutes(loadingStart, sc.loadingMinutes);
  const leave = addMinutes(loadDone, sc.leaveShipperMinutes);

  // Un-delayed time of each step, then the known delays shift every later step.
  const base = sc.steps.map((s, i) => {
    if (i === 0) return t0;
    if (s.leg === "pickup") {
      if (s.id === "loading") return loadingStart;
      return addMinutes(depart, pickupMinutes * s.frac);
    }
    if (s.id === "picked-up") return loadDone;
    return addMinutes(leave, loadedMinutes * s.frac);
  });
  const delayAt = (i) => (sc.steps[i].delay ? sc.delays[sc.steps[i].delay] : null);
  const steps = sc.steps.map((s, i) => {
    let shift = 0;
    for (let j = 0; j < i; j++) shift += delayAt(j)?.minutes ?? 0;
    const from = s.leg === "pickup" ? driverLoc : pickupLoc;
    const to = s.leg === "pickup" ? pickupLoc : destLoc;
    const legMiles = s.leg === "pickup" ? deadhead : load.loadedMiles;
    const remainingMiles = Math.round(legMiles * (1 - s.frac)) + (s.leg === "pickup" ? load.loadedMiles : 0);
    return {
      index: i,
      id: s.id,
      status: s.status,
      leg: s.leg,
      frac: s.frac,
      time: addMinutes(base[i], shift),
      delay: delayAt(i) ? { id: s.delay, ...delayAt(i) } : null,
      remainingMiles,
      mapPos: { x: lerp(from.mapPos.x, to.mapPos.x, s.frac), y: lerp(from.mapPos.y, to.mapPos.y, s.frac) },
      location: positionLabel(from, to, s.frac, remainingMiles),
      drivingMinutes: s.leg === "pickup" ? Math.round(pickupMinutes * s.frac) : pickupMinutes + Math.round(loadedDrive * s.frac),
    };
  });
  return {
    steps,
    deadhead,
    loadedMiles: load.loadedMiles,
    baseDelivery: base[base.length - 1],
    pickupEnd: parseSimTime(load.pickupWindow.end),
    deliveryEnd: parseSimTime(load.deliveryWindow.end),
    driverLoc,
    pickupLoc,
    destLoc,
    lastStep: steps.length - 1,
  };
}

export const knownDelays = (tl, step) => tl.steps.slice(0, step + 1).filter((s) => s.delay).map((s) => ({ ...s.delay, step: s.index, time: s.time }));
const delayMinutes = (list) => list.reduce((a, d) => a + d.minutes, 0);

// The one scripted exception (the traffic delay), once the shipment has reached it.
export function exceptionAt(tl, step) {
  const found = tl.steps.find((s) => s.delay?.exception && s.index <= step);
  if (!found) return null;
  const known = knownDelays(tl, step);
  const original = addMinutes(tl.baseDelivery, delayMinutes(known.filter((d) => d.step < found.index)));
  const eta = addMinutes(tl.baseDelivery, delayMinutes(known));
  const status = classifyEta(minutesBetween(eta, tl.deliveryEnd));
  return { step: found.index, minutes: found.delay.minutes, label: found.delay.label, original, eta, status, affected: status !== "ON TIME" };
}

// Does a broker update become necessary? Material delay, or any delay that threatens the appointment.
export function brokerUpdateRequired(known, deliveryStatus) {
  if (!known.length) return false;
  return known.some((d) => d.minutes >= trackingScenario.materialDelayMinutes) || deliveryStatus !== "ON TIME";
}

// Everything the UI needs about the shipment at one step. `resolved` = the exception has been handled.
export function snapshotAt(tl, step, { resolved = false, hosMinutes = 0 } = {}) {
  const s = tl.steps[step];
  const known = knownDelays(tl, step);
  const etaPickup = tl.steps.find((x) => x.status === "arrived-pickup").time;
  const etaDelivery = step >= tl.lastStep ? s.time : addMinutes(tl.baseDelivery, delayMinutes(known));
  const pickupPhase = step < tl.steps.findIndex((x) => x.status === "picked-up");
  const target = pickupPhase ? "pickup" : "delivery";
  const etaTarget = pickupPhase ? etaPickup : etaDelivery;
  const windowEnd = pickupPhase ? tl.pickupEnd : tl.deliveryEnd;
  const targetStatus = classifyEta(minutesBetween(etaTarget, windowEnd));
  const deliveryStatus = classifyEta(minutesBetween(etaDelivery, tl.deliveryEnd));
  const exception = exceptionAt(tl, step);
  const requiresBroker = brokerUpdateRequired(known, deliveryStatus);
  let health = "ON TRACK";
  if (targetStatus === "LATE" || deliveryStatus === "LATE") health = "DELAYED";
  else if (targetStatus === "AT RISK" || deliveryStatus === "AT RISK" || (exception && !resolved)) health = "AT RISK";
  return {
    step,
    index: s.index,
    statusId: s.status,
    status: trackingStatuses[s.status],
    time: s.time,
    location: s.location,
    mapPos: s.mapPos,
    leg: s.leg,
    frac: s.frac,
    remainingMiles: s.remainingMiles,
    target,
    etaPickup,
    etaDelivery,
    etaTarget,
    windowEnd,
    targetStatus,
    deliveryStatus,
    health,
    delays: known,
    delayTotal: delayMinutes(known),
    exception,
    requiresBroker,
    hosRemaining: Math.max(0, hosMinutes - s.drivingMinutes),
  };
}

// The snapshot for a truck that is part-way between two scripted steps (automatic movement). The
// status, ETAs, delays and health are the stepped ones (they only change at events); position, miles
// left, location label, simulation time and HOS are interpolated from the segment progress `p`
// (0..1). Between legs, or while loading, the truck stays where it is. Nothing new is calculated:
// the same fractions, miles and times the timeline already holds.
export function snapshotLive(tl, step, segment, p, opts = {}) {
  const base = snapshotAt(tl, step, opts);
  const a = tl.steps[segment.fromStep];
  const b = tl.steps[segment.toStep];
  const moves = a.leg === b.leg && a.frac !== b.frac;
  const frac = moves ? lerp(a.frac, b.frac, p) : a.frac;
  const leg = a.leg;
  const from = leg === "pickup" ? tl.driverLoc : tl.pickupLoc;
  const to = leg === "pickup" ? tl.pickupLoc : tl.destLoc;
  const legMiles = leg === "pickup" ? tl.deadhead : tl.loadedMiles;
  const remainingMiles = Math.round(legMiles * (1 - frac)) + (leg === "pickup" ? tl.loadedMiles : 0);
  const driving = lerp(a.drivingMinutes, b.drivingMinutes, p);
  return {
    ...base,
    leg,
    frac,
    remainingMiles,
    mapPos: { x: lerp(from.mapPos.x, to.mapPos.x, frac), y: lerp(from.mapPos.y, to.mapPos.y, frac) },
    location: positionLabel(from, to, frac, remainingMiles),
    time: new Date(a.time.getTime() + (b.time.getTime() - a.time.getTime()) * p),
    hosRemaining: Math.max(0, (opts.hosMinutes ?? 0) - Math.round(driving)),
    progress: p,
    moving: true,
  };
}

// Active alerts, derived from the simulation state (never random). Future events are never listed.
export function getAlerts(tl, snap, vars, { brokerUpdated = false } = {}) {
  const t = trackingAlertTemplates;
  const out = [];
  const add = (id, extra = {}) => out.push({ id, ...t[id], text: fillTemplate(t[id].text, { ...vars, ...extra }) });
  const step = snap.step;
  const atArrive = tl.steps.findIndex((x) => x.status === "arrived-pickup");
  if (step === atArrive - 1) add("pickup-approaching");
  if (step === atArrive || snap.statusId === "loading") add("driver-stopped");
  const pickupDelay = snap.delays.find((d) => !d.exception);
  if (pickupDelay) add("pickup-delay", { minutes: pickupDelay.minutes });
  if (snap.exception) {
    add("traffic-delay", { minutes: snap.exception.minutes });
    add("eta-slipping", { etaOriginal: formatSimClock(toSimString(snap.exception.original)) });
  }
  if (snap.deliveryStatus !== "ON TIME" && snap.delays.length) add("late-risk", { windowEnd: formatSimClock(toSimString(tl.deliveryEnd)) });
  if (snap.requiresBroker && snap.exception && !brokerUpdated) add("broker-update");
  return out;
}

// ETA answers offered to the student when a delay is reported: the right one plus the two classic
// mistakes (forgetting the delay, counting it twice), rotated deterministically by the load id.
export function etaOptions(tl, step, seed = "") {
  const ex = exceptionAt(tl, step);
  if (!ex) return [];
  const opts = [
    { id: "original", time: ex.original, correct: false },
    { id: "correct", time: ex.eta, correct: true },
    { id: "double", time: addMinutes(ex.eta, ex.minutes), correct: false },
  ];
  const rot = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % opts.length;
  return [...opts.slice(rot), ...opts.slice(0, rot)].map((o) => ({ ...o, value: toSimString(o.time) }));
}

// Elapsed driving left on the clock, for the driver status panel.
export const formatHos = (minutes) => formatDuration(minutes);
