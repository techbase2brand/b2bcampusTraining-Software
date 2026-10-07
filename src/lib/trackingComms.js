// Check-call and broker-update language for Phase 7: free text -> topics, deterministic driver and
// broker answers resolved from the simulation snapshot. Patterns and templates live in
// src/data/phase7Missions.js.

import { checkCallTopics, trackingIntentPatterns, trackingReplies, trackingSuggested, brokerUpdateScript } from "@/data/phase7Missions";
import { formatLocation } from "./loadSelectors";
import { toSimString } from "./trackingEngine";
import { fillTemplate, formatSimDay, formatSimClock, formatDuration } from "./text";

const compile = (list) => new RegExp(list.join("|"), "i");
const TOPIC_RES = Object.fromEntries(Object.entries(trackingIntentPatterns).map(([k, v]) => [k, compile(v)]));
const BROKER_RES = Object.fromEntries(Object.entries(brokerUpdateScript.patterns).map(([k, v]) => [k, compile(v)]));
const CHECK_IDS = new Set(checkCallTopics.map((t) => t.id));

// "Oct 12, 2:15 PM" from a Date on the simulation clock.
export const fmtDateTime = (date) => {
  const s = toSimString(date);
  return `${formatSimDay(s)}, ${formatSimClock(s)}`;
};

export const detectTrackingTopics = (text) => Object.keys(TOPIC_RES).filter((id) => TOPIC_RES[id].test(text));
export const checkTopicsOf = (topics) => topics.filter((t) => CHECK_IDS.has(t));
export const topicLabel = (id) => checkCallTopics.find((t) => t.id === id)?.label ?? id;

// Template variables from the load, driver, broker and the simulation snapshot.
export function buildTrackingVars({ load, entry, broker, snap }) {
  const ex = snap.exception;
  return {
    ref: load.referenceNumber,
    driver: entry.driver.name,
    first: entry.driver.name.split(" ")[0],
    truck: entry.truck.id,
    broker: broker.name,
    origin: formatLocation(load.originLocationId),
    destination: formatLocation(load.destinationLocationId),
    location: snap.location,
    remaining: snap.remainingMiles,
    target: snap.target === "pickup" ? "pickup" : "delivery",
    eta: fmtDateTime(snap.etaTarget),
    etaPickup: fmtDateTime(snap.etaPickup),
    etaDelivery: fmtDateTime(snap.etaDelivery),
    minutes: ex ? ex.minutes : snap.delayTotal,
    hos: formatDuration(snap.hosRemaining),
  };
}

const band = { "ON TIME": 0, "AT RISK": 1, LATE: 2 };

// One answer line per check topic, according to where the shipment is right now.
export function driverReplyFor(topic, vars, snap, tl) {
  const r = trackingReplies;
  const arriveIdx = tl.steps.findIndex((s) => s.status === "arrived-pickup");
  switch (topic) {
    case "location":
      return fillTemplate(r.location, vars);
    case "schedule":
      return r.schedule[["ontime", "risk", "late"][band[snap.targetStatus]]];
    case "eta":
      return fillTemplate(r.eta, vars);
    case "traffic":
      return snap.exception ? fillTemplate(r.traffic.delay, { ...vars, minutes: snap.exception.minutes }) : r.traffic.none;
    case "pickup": {
      const key = { "ready-for-pickup": "before", "en-route-pickup": "before", "arrived-pickup": "arrived", loading: "loading" }[snap.statusId] ?? "done";
      return r.pickup[key];
    }
    case "shipper": {
      if (snap.step < arriveIdx) return r.shipper.before;
      const d = snap.delays.find((x) => !x.exception);
      return d ? fillTemplate(r.shipper.delay, { ...vars, minutes: d.minutes }) : r.shipper.none;
    }
    case "delivery":
      return r.delivery[["yes", "risk", "no"][band[snap.deliveryStatus]]];
    case "ack":
      return r.ack;
    case "updates":
      return r.updates;
    default:
      return null;
  }
}

export function driverReplyLines(topics, vars, snap, tl) {
  const lines = topics.map((t) => driverReplyFor(t, vars, snap, tl)).filter(Boolean);
  return lines.length ? lines : [trackingReplies.fallback];
}

export const driverGreeting = (vars) => fillTemplate(trackingReplies.greeting, vars);

export const getTrackingSuggestions = (vars) => trackingSuggested.map((s) => ({ ...s, text: fillTemplate(s.text, vars) }));

// A broker update is useful when it names the delay AND the updated ETA.
export function detectBrokerUpdate(text) {
  const delay = BROKER_RES.delay.test(text);
  const eta = BROKER_RES.eta.test(text);
  return { delay, eta, valid: delay && eta };
}

export const brokerUpdateDraft = (vars) => fillTemplate(brokerUpdateScript.suggested, vars);
export const brokerReply = (vars, courtesy) => fillTemplate(courtesy ? brokerUpdateScript.courtesyReply : brokerUpdateScript.reply, vars);
