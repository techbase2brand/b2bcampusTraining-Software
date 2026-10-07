// Broker chat engine: free text -> training intents, deterministic broker replies, coaching.
// Everything is derived from the student's SELECTED load; no load is named here. Keyword lists and
// reply templates live in src/data/brokerComms.js.

import {
  commsTopics,
  intentPatterns,
  actionPatterns,
  professionalism,
  replyTemplates,
  coachTips,
  suggestedQuestions,
} from "@/data/brokerComms";
import { getLoad, getBroker, formatLocation } from "./loadSelectors";
import { analyzeLoad } from "./loadCalculations";
import { getTruckContext } from "./loadRules";
import { fillTemplate, formatSimDay, formatSimClock, formatCurrency } from "./text";

const compile = (list) => new RegExp(list.join("|"), "i");
const TOPIC_RES = Object.fromEntries(Object.entries(intentPatterns).map(([k, v]) => [k, compile(v)]));
const ACTION_RES = Object.fromEntries(Object.entries(actionPatterns).map(([k, v]) => [k, compile(v)]));
const POLITE_RE = compile(professionalism.polite);
const RUDE_RE = compile(professionalism.rude);
const REF_RE = new RegExp(professionalism.loadReferencePattern, "i");

// The selected load, its broker, the Phase 4 analysis and the template variables.
export function getCommsContext(state, ctx = getTruckContext()) {
  const load = state.selectedBestLoadId ? getLoad(state.selectedBestLoadId) : null;
  if (!load) return null;
  const broker = getBroker(load.brokerId);
  const analysis = analyzeLoad(load, ctx);
  const vars = {
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
    rate: formatCurrency(load.rate),
    appointment: load.appointmentType,
    requirements: load.specialRequirements.length ? `Requirements: ${load.specialRequirements.join(", ")}.` : replyTemplates.noRequirements,
    detention: broker.detentionTerms,
    contact: broker.contactName,
    broker: broker.name,
    deadhead: analysis.deadheadMiles,
  };
  return { load, broker, analysis, vars };
}

// Topics (availability, rate, pickup...) the message touches, in display order.
export function detectTopics(text) {
  return commsTopics.map((t) => t.id).filter((id) => TOPIC_RES[id].test(text));
}

export const isAccept = (text) => ACTION_RES.accept.test(text);
export const isNegotiateAsk = (text) => ACTION_RES.negotiate.test(text);
export const isGreeting = (text) => ACTION_RES.greeting.test(text);

// Dollar amounts in a message. Load references (the LD-number) are removed first. A figure needs a "$" or
// "dollars"; a bare number is accepted only when the message is clearly negotiating ("can you do 2750").
// Only values near the posted rate count, so weights and miles are ignored.
export function parseAmounts(text, posted) {
  const clean = text.replace(new RegExp(professionalism.loadReferencePattern, "gi"), " ");
  const negotiating = ACTION_RES.negotiate.test(clean);
  const found = [];
  for (const m of clean.matchAll(/(\$\s*)?(\d{1,3}(?:,\d{3})+|\d{3,6})(?:\.\d+)?(\s*(?:dollars|usd|bucks))?/gi)) {
    const marked = Boolean(m[1] || m[3]);
    const value = Number(m[2].replace(/,/g, ""));
    if ((marked || negotiating) && value >= posted * 0.5 && value <= posted * 3) found.push(value);
  }
  return found;
}

// Wording quality. `professional` feeds the Communication Accuracy metric.
export function evaluateMessage(text, vars, { first = false } = {}) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const rude = RUDE_RE.test(text);
  const tooShort = words < professionalism.minWords;
  const hasRef = REF_RE.test(text);
  const polite = POLITE_RE.test(text);
  const greeting = isGreeting(text);
  const professional = !rude && !tooShort && (hasRef || polite || greeting);

  let tip = { tone: "success", text: coachTips.good };
  if (rude) tip = { tone: "error", text: coachTips.rude };
  else if (tooShort) tip = { tone: "hint", text: coachTips.tooShort };
  else if (!hasRef && detectTopics(text).length) tip = { tone: "hint", text: fillTemplate(coachTips.noReference, vars) };
  else if (first && !greeting) tip = { tone: "hint", text: coachTips.noGreeting };
  return { professional, tip };
}

// Broker answer lines for the verification topics. Rate is answered separately by the negotiation
// engine when the student is negotiating.
export function topicReplies(topics, vars, { flexible = false, hasRequirements = true } = {}) {
  const lines = [];
  for (const topic of topics) {
    let key = topic;
    if (topic === "rate" && flexible) key = "rateFlexible";
    if (topic === "requirements" && !hasRequirements) key = "noRequirements";
    const template = replyTemplates[key];
    if (template) lines.push(fillTemplate(template, vars));
  }
  return lines;
}

export const greetingFor = (broker, vars) => fillTemplate(broker.status === "away" ? replyTemplates.greetingAway : replyTemplates.greeting, vars);
export const unknownLoadReply = (vars) => fillTemplate(replyTemplates.unknownLoad, vars);
export const fallbackReply = () => replyTemplates.fallback;

// Suggested-question buttons filled with the selected load.
export function getSuggestedQuestions(vars) {
  return suggestedQuestions.map((q) => ({ ...q, text: fillTemplate(q.text, vars) }));
}
