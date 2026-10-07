// Mission 4 communication data (API-style): topics, intent keywords, broker reply templates,
// suggested questions, coaching, negotiation rules and the call script. No logic here.
// Placeholders such as {ref}, {rate}, {pickupDay} are filled in src/lib/brokerChat.js from the
// student's SELECTED load, so nothing below is tied to a specific load.

// Topics the student can verify with the broker. `required` topics are tracked for the tasks.
export const commsTopics = [
  { id: "availability", label: "Availability" },
  { id: "commodity", label: "Commodity" },
  { id: "weight", label: "Weight" },
  { id: "equipment", label: "Equipment" },
  { id: "pickup", label: "Pickup date / time" },
  { id: "delivery", label: "Delivery date / time" },
  { id: "rate", label: "Posted rate" },
  { id: "appointment", label: "Appointment type" },
  { id: "detention", label: "Detention / layover" },
  { id: "requirements", label: "Special requirements" },
];

// Free text is mapped to topics with these keyword patterns (case-insensitive regex sources).
export const intentPatterns = {
  availability: ["available", "availability", "still open", "still there", "still on", "up for grabs", "covered"],
  commodity: ["commodity", "what are we hauling", "what is the freight", "what's the freight", "what is it", "cargo", "what's on the load", "what are we moving"],
  weight: ["weight", "\\blbs?\\b", "pounds", "how heavy"],
  equipment: ["equipment", "trailer", "dry van", "reefer", "flatbed", "van or"],
  pickup: ["pick.?up", "loading", "origin", "ready time", "load time"],
  delivery: ["deliver", "drop", "unload", "destination", "\\bdue\\b"],
  rate: ["\\brate\\b", "how much", "\\bpay\\b", "\\bprice\\b", "firm"],
  appointment: ["appointment", "fcfs", "first come", "\\bappt\\b", "scheduled"],
  detention: ["detention", "layover", "wait time", "waiting time", "dwell", "free time", "free hours"],
  requirements: ["special", "requirement", "tarp", "lumper", "driver assist", "no.?touch", "\\bteam\\b", "restriction", "anything else i should know"],
};

// Non-topic intents.
export const actionPatterns = {
  negotiate: ["increase", "improve", "flexib", "better rate", "come up", "(can|could|would) you (do|go|pay|meet|come|take)", "any room", "bump", "(a )?(bit|little) more", "higher", "meet me", "counter"],
  accept: ["\\bdeal\\b", "\\baccept", "we'?ll take it", "sounds good", "\\bagree", "works for me", "i'?ll take", "let'?s do it", "go with that"],
  greeting: ["\\bhi\\b", "\\bhello\\b", "good (morning|afternoon|evening)", "\\bhey\\b"],
};

export const professionalism = {
  polite: ["please", "thanks", "thank you", "appreciate", "could you", "would you", "kindly"],
  rude: ["whatever", "hurry", "stupid", "ridiculous", "give me the rate", "shut", "idiot", "useless"],
  minWords: 4,
  loadReferencePattern: "ld-\\d+",
};

// Quick buttons shown under the chat. `text` is what gets sent. `topic` is the topic it covers.
export const suggestedQuestions = [
  { id: "availability", label: "Is this load still available?", text: "Hi, I'm calling about load {ref} from {origin} to {destination}. Is it still available?" },
  { id: "commodity", label: "Can you confirm the commodity?", text: "Could you confirm the commodity for {ref}, please?" },
  { id: "weight", label: "What is the weight?", text: "What is the total weight on {ref}?" },
  { id: "equipment", label: "Confirm the equipment type", text: "Can you confirm the equipment type for {ref}?" },
  { id: "pickup", label: "Pickup date and time?", text: "What is the pickup date and time for {ref}?" },
  { id: "delivery", label: "Delivery date and time?", text: "What is the delivery date and time for {ref}?" },
  { id: "rate", label: "Is this a firm rate?", text: "Is the posted rate on {ref} a firm rate?" },
  { id: "appointment", label: "Is there an appointment?", text: "Is there a pickup appointment, or is it first come first served?" },
  { id: "detention", label: "What are the detention terms?", text: "What are the detention terms on {ref}?" },
  { id: "requirements", label: "Any special requirements?", text: "Are there any special requirements on {ref}?" },
];

// Broker replies per topic.
export const replyTemplates = {
  greeting: "Hi, this is {contact} from {broker}. How can I help you?",
  greetingAway: "Hi, {contact} from {broker}. Sorry for the delay, I was on another line. How can I help you?",
  availability: "Yes, {ref} is still available. {origin} to {destination}, {equipment}.",
  commodity: "The commodity is {commodity}.",
  weight: "It is about {weight} lbs.",
  equipment: "It needs a {equipment}.",
  pickup: "Pickup is {pickupDay}, {pickupTime} to {pickupEnd} in {origin}.",
  delivery: "Delivery is {deliveryDay}, {deliveryTime} to {deliveryEnd} in {destination}.",
  rate: "The posted rate is {rate} all in.",
  rateFlexible: "The posted rate is {rate}. There is a little room if you have a good reason, so what are you looking for?",
  appointment: "It is {appointment}.",
  detention: "Detention: {detention}.",
  requirements: "{requirements}",
  noRequirements: "No special requirements on this one.",
  fallback: "Sorry, could you be more specific? You can ask about availability, rate, pickup, delivery, commodity, weight, equipment, appointment, detention or special requirements.",
  unknownLoad: "I don't see {ref} in our system. Check which broker posted the load.",
};

// Gentle coaching for the student's wording (shown to the student, never blocks a message).
export const coachTips = {
  noReference: "Mention the load reference ({ref}) so the broker knows exactly which load you mean.",
  tooShort: "Try a complete sentence. A one-word question like \"rate?\" can sound abrupt to a broker.",
  rude: "Keep it professional. Brokers work with carriers who are polite and clear.",
  noGreeting: "Open with a short introduction, for example your name and company.",
  good: "Clear and professional. Specific questions like this get fast answers.",
};

// ---- Negotiation (see src/lib/brokerNegotiation.js) -----------------------------------------
export const negotiationRules = {
  roundTo: 25, // all broker figures are rounded to this many dollars
  extremeAbovePct: 0.2, // asks above posted * (1 + this) are refused outright
  reasonBonusPct: 0.025, // extra ceiling per valid reason
  maxReasons: 2, // reasons counted toward the ceiling
  acceptGap: 50, // if the student is within this of the broker's offer, the broker closes the deal
  suggestionPct: 0.06, // size of the "Can you do $X?" suggestion
  marketRangePct: { low: -0.04, high: 0.08 }, // "training range" shown in Rate Insights
  // A reason is VALID only when the load facts support it.
  validity: { deadheadMinMiles: 25, longHaulMinMiles: 900, tightPickupHours: 12 },
  reasons: [
    { id: "deadhead", label: "Deadhead", patterns: ["deadhead", "empty miles", "unpaid miles", "miles to (get to )?(the )?pickup"] },
    { id: "pickup-window", label: "Tight pickup window", patterns: ["pickup window", "tight pickup", "short notice", "same.?day", "tight timing", "tight window"] },
    { id: "loaded-miles", label: "Long loaded miles", patterns: ["long haul", "long loaded", "loaded miles", "long distance"] },
    { id: "appointment", label: "Appointment requirements", patterns: ["appointment"] },
    { id: "positioning", label: "Driver positioning", patterns: ["position", "repositioning", "out of position"] },
    { id: "market", label: "Market rate", patterns: ["market", "lane rate", "going rate", "other loads", "similar loads"] },
  ],
};

// The call script. Ticks are seconds driven by the UI; the engine is deterministic.
export const callScript = {
  dialTicks: 2,
  statusLabels: { idle: "Ready", dialing: "Calling...", connected: "Connected", ended: "Call ended" },
  modes: [
    { id: "manual", label: "Manual Call", available: true },
    { id: "ai", label: "AI-Assisted Call", available: false, note: "Coming later" },
  ],
  endedLine: "Call ended.",
};

// Negotiation helper copy. {amount} is computed from the rules above, never a fixed price.
export const helperSuggestions = [
  { id: "deadhead", label: "Rate with deadhead", text: "Hi {contact}, is there any flexibility on the rate for {ref}? I have {deadhead} miles of deadhead to reach the pickup.", requires: "deadhead" },
  { id: "amount", label: "Ask for a specific rate", text: "Can you do {amount} on {ref}, considering the pickup timing?" },
  { id: "market", label: "Market rate", text: "Can you improve the rate on {ref}? Similar loads on this lane are paying more." },
  { id: "detention", label: "Detention terms", text: "What detention terms and appointment requirements apply to {ref}?" },
];

// Broker negotiation replies. {amount} = the student's request, {counter} = the broker's offer,
// {rate} = the figure agreed, {reason} = a reason the student gave.
export const negotiationReplies = {
  askAmount: "What number do you have in mind? Tell me what is driving the request.",
  extreme: "I can't go anywhere near {amount}. The posted rate is {rate}, and I only have room within reason.",
  counter: "I can't do {amount}, but I can do {counter}.",
  counterReason: "I understand about the {reason}. I can't do {amount}, but I could do {counter}.",
  counterNoReason: "I can't do {amount} as it stands. Give me a reason and I'll see what I can do. For now I can offer {counter}.",
  finalOffer: "{counter} is the most I can approve on this one.",
  agreed: "Deal. I can do {rate} on {ref}.",
  agreedPosted: "No problem, we'll keep it at {rate} on {ref}.",
  invalidReason: "I don't see how the {reason} applies on this load.",
  acceptNoOffer: "We are at the posted rate of {rate}. Tell me if you'd like to ask for more.",
};
