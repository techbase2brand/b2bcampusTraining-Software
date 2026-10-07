// Deterministic broker negotiation. Same load + same student messages => same offers, always.
// Rules and reply copy live in src/data (brokerComms.js, brokers.js); nothing here is a fixed price.
//
// The broker approves up to a CEILING above the posted rate. Without a justification the ceiling is
// small; each VALID reason (one the load facts support) raises it a little. The broker opens with a
// first counteroffer and moves toward the student's request without ever passing the ceiling.

import { negotiationRules as rules, negotiationReplies } from "@/data/brokerComms";
import { simulationConfig } from "@/data/simulationConfig";
import { fillTemplate, parseSimTime, formatCurrency } from "./text";

const roundTo = (value) => Math.round(value / rules.roundTo) * rules.roundTo;
const compile = (list) => new RegExp(list.join("|"), "i");
const REASON_RES = Object.fromEntries(rules.reasons.map((r) => [r.id, compile(r.patterns)]));

export const initialNegotiation = { attempts: 0, extremeCount: 0, counter: null, requests: [], reasonsUsed: [], status: "none", agreedRate: null };

// Is a reason the student gave actually true for this load?
function isReasonValid(id, load, analysis) {
  const v = rules.validity;
  switch (id) {
    case "deadhead":
    case "positioning":
      return analysis.deadheadMiles >= v.deadheadMinMiles;
    case "loaded-miles":
      return load.loadedMiles >= v.longHaulMinMiles;
    case "pickup-window": {
      const hours = (parseSimTime(load.pickupWindow.end) - parseSimTime(simulationConfig.clock.now)) / 3600000;
      return hours <= v.tightPickupHours;
    }
    case "appointment":
      return load.appointmentType === "Appointment";
    case "market":
      return true;
    default:
      return false;
  }
}

export function evaluateReasons(text, load, analysis) {
  return rules.reasons.filter((r) => REASON_RES[r.id].test(text)).map((r) => ({ id: r.id, label: r.label, valid: isReasonValid(r.id, load, analysis) }));
}

export const ceilingFor = (posted, broker, validReasonCount) =>
  Math.max(posted, roundTo(posted * (1 + broker.negotiation.baseCeilingPct + Math.min(validReasonCount, rules.maxReasons) * rules.reasonBonusPct)));

export const firstOfferFor = (posted, broker) =>
  Math.min(ceilingFor(posted, broker, 0), Math.max(posted + rules.roundTo, roundTo(posted * (1 + broker.negotiation.firstOfferPct))));

// Rate Insights context: never the exact answer, only a training range around the posted rate.
export function getMarketRange(posted) {
  return { low: roundTo(posted * (1 + rules.marketRangePct.low)), high: roundTo(posted * (1 + rules.marketRangePct.high)) };
}

export const suggestedAsk = (posted) => roundTo(posted * (1 + rules.suggestionPct));

const money = formatCurrency;

// The student is asking for a different rate. `amount` may be null ("can you increase the rate?").
// Returns { negotiation, replies, attempted, extreme, agreed }.
export function respondToRequest({ amount, text, negotiation, load, analysis, broker }) {
  const posted = load.rate;
  const n = { ...negotiation, requests: [...negotiation.requests], reasonsUsed: [...negotiation.reasonsUsed] };
  const vars = { ref: load.referenceNumber, rate: money(posted) };
  const replies = [];

  const reasons = evaluateReasons(text, load, analysis);
  for (const r of reasons) {
    if (!r.valid) replies.push(fillTemplate(negotiationReplies.invalidReason, { reason: r.label.toLowerCase() }));
    else if (!n.reasonsUsed.includes(r.id)) n.reasonsUsed.push(r.id);
  }
  const validReason = reasons.find((r) => r.valid);

  n.attempts += 1;

  if (amount == null) {
    replies.push(negotiationReplies.askAmount);
    return { negotiation: n, replies, attempted: true, extreme: false, agreed: false };
  }
  n.requests.push(amount);

  // Far above the shipper's rate: refuse, no movement. Counts as an incorrect attempt.
  if (amount > posted * (1 + rules.extremeAbovePct)) {
    n.extremeCount += 1;
    replies.push(fillTemplate(negotiationReplies.extreme, { ...vars, amount: money(amount) }));
    return { negotiation: n, replies, attempted: true, extreme: true, agreed: false };
  }

  const agree = (rate) => {
    n.status = "agreed";
    n.agreedRate = rate;
    n.counter = rate;
    replies.push(fillTemplate(rate === posted ? negotiationReplies.agreedPosted : negotiationReplies.agreed, { ...vars, rate: money(rate) }));
    return { negotiation: n, replies, attempted: true, extreme: false, agreed: true };
  };

  if (amount <= posted) return agree(posted);

  const ceiling = ceilingFor(posted, broker, n.reasonsUsed.length);
  const first = firstOfferFor(posted, broker);
  const counter = n.counter;

  if (counter != null && amount <= counter) return agree(amount);
  if (counter == null && amount <= first) return agree(amount);
  if (counter != null && amount <= ceiling && amount - counter <= rules.acceptGap) return agree(amount);

  let next;
  if (counter == null) next = Math.min(first, ceiling);
  else next = Math.min(ceiling, Math.max(counter + rules.roundTo, roundTo((counter + Math.min(amount, ceiling)) / 2)));
  if (amount <= ceiling && next >= amount) return agree(amount);

  n.status = "countering";
  n.counter = next;
  const cv = { ...vars, amount: money(amount), counter: money(next), reason: validReason?.label.toLowerCase() };
  if (amount > ceiling && next === ceiling && counter === ceiling) replies.push(fillTemplate(negotiationReplies.finalOffer, cv));
  else if (validReason) replies.push(fillTemplate(negotiationReplies.counterReason, cv));
  else if (n.reasonsUsed.length === 0) replies.push(fillTemplate(negotiationReplies.counterNoReason, cv));
  else replies.push(fillTemplate(negotiationReplies.counter, cv));
  return { negotiation: n, replies, attempted: true, extreme: false, agreed: false };
}

// The student accepts the broker's current offer ("deal", "works for me").
export function acceptOffer({ negotiation, load }) {
  const n = { ...negotiation };
  const vars = { ref: load.referenceNumber };
  if (n.counter == null) {
    return { negotiation: n, replies: [fillTemplate(negotiationReplies.acceptNoOffer, { rate: money(load.rate) })], agreed: false };
  }
  n.status = "agreed";
  n.agreedRate = n.counter;
  return { negotiation: n, replies: [fillTemplate(negotiationReplies.agreed, { ...vars, rate: money(n.counter) })], agreed: true };
}
