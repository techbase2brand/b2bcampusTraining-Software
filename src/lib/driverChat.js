// Dispatcher <-> driver chat engine: free text -> topics, deterministic driver replies.
// Everything comes from the negotiated load and the selected driver; keyword lists and reply
// templates live in src/data/dispatchComms.js.

import { driverTopics, requiredLoadTopics, driverIntentPatterns, driverReplies, driverClarifications, driverResponses, driverSuggestedMessages } from "@/data/dispatchComms";
import { getLoad, getBroker, formatLocation } from "./loadSelectors";
import { getRosterEntry } from "./dispatchRoster";
import { evaluateDriver } from "./driverRules";
import { fillTemplate, formatSimDay, formatSimClock, formatCurrency, formatDuration } from "./text";

const compile = (list) => new RegExp(list.join("|"), "i");
const TOPIC_RES = Object.fromEntries(Object.entries(driverIntentPatterns).map(([k, v]) => [k, compile(v)]));

// The negotiated load carried forward from Mission 4 (and its agreed rate).
export function getNegotiatedLoad(state) {
  const id = state.negotiatedLoadId ?? null; // only a FINALIZED load reaches dispatch
  const load = id ? getLoad(id) : null;
  if (!load) return null;
  const agreedRate = state.agreedRate ?? load.rate;
  return { load, broker: getBroker(load.brokerId), agreedRate, postedRate: load.rate };
}

// Template variables for the load, and (when a driver is selected) the driver.
export function buildVars(neg, entry) {
  const { load, broker, agreedRate } = neg;
  const base = {
    ref: load.referenceNumber,
    origin: formatLocation(load.originLocationId),
    destination: formatLocation(load.destinationLocationId),
    equipment: load.equipmentType,
    commodity: load.commodity,
    weight: load.weight.toLocaleString("en-US"),
    pickupDay: formatSimDay(load.pickupWindow.start),
    pickupTime: formatSimClock(load.pickupWindow.start),
    pickupEnd: formatSimClock(load.pickupWindow.end),
    deliveryDay: formatSimDay(load.deliveryWindow.start),
    deliveryTime: formatSimClock(load.deliveryWindow.start),
    deliveryEnd: formatSimClock(load.deliveryWindow.end),
    rate: formatCurrency(agreedRate),
    appointment: load.appointmentType,
    requirements: load.specialRequirements.length ? `${load.specialRequirements.join(", ")}.` : driverReplies.noRequirements,
    broker: broker.name,
  };
  if (!entry) return base;
  return {
    ...base,
    first: entry.driver.name.split(" ")[0],
    driver: entry.driver.name,
    hos: formatDuration(entry.driver.hosMinutes),
    driverLocation: entry.driver.location,
  };
}

export const requiredTopicsFor = (load) => (load.specialRequirements.length ? [...requiredLoadTopics, "requirements"] : requiredLoadTopics);

export const detectDriverTopics = (text) => driverTopics.map((t) => t.id).filter((id) => TOPIC_RES[id].test(text));

// The driver's answer lines for the topics the dispatcher touched.
export function driverReplyLines(topics, vars, load) {
  const lines = topics.map((t) => {
    const key = t === "requirements" && !load.specialRequirements.length ? "noRequirements" : t;
    return driverReplies[key] ? fillTemplate(driverReplies[key], vars) : null;
  });
  return lines.filter(Boolean);
}

export const driverGreeting = (vars) => fillTemplate(driverReplies.greeting, vars);
export const driverFallback = () => driverReplies.fallback;
export const clarificationFor = (topic, vars) => fillTemplate(driverClarifications[topic] ?? driverReplies.fallback, vars);

export function getDriverSuggestions(vars, load) {
  return driverSuggestedMessages
    .filter((s) => s.id !== "requirements" || load.specialRequirements.length)
    .map((s) => ({ ...s, text: fillTemplate(s.text, vars) }));
}

// How the driver reacts to a sent dispatch, given the topics covered so far.
// accepted | needs-clarification (with the first missing topic) | declined (driver cannot take it)
export function resolveDriverReaction({ load, entry, covered }) {
  const verdict = evaluateDriver(load, entry);
  if (!verdict.suitable) return { response: "declined", ask: null, reason: verdict.firstFailure?.message };
  const missing = requiredTopicsFor(load).find((t) => !covered.includes(t));
  return missing ? { response: "needs-clarification", ask: missing } : { response: "accepted", ask: null };
}

export const acceptedLine = (late) => (late ? driverResponses.acceptedLate : driverResponses.accepted);
export const declinedLine = (reason) => fillTemplate(driverResponses.declined, { reason });
export const getEntry = getRosterEntry;
