// Phase 6 driver communication data (API-style): topics, intent keywords, driver replies,
// suitability messages, suggested messages and statuses. No logic here. Placeholders such as
// {origin}, {pickupTime}, {hos} are filled in src/lib/driverChat.js and src/lib/driverRules.js
// from the actual negotiated load and the selected driver, so nothing is tied to a specific load.

export const driverTopics = [
  { id: "availability", label: "Availability" },
  { id: "hos", label: "Driving hours (HOS)" },
  { id: "location", label: "Driver location" },
  { id: "pickup", label: "Pickup location / time" },
  { id: "delivery", label: "Delivery location / time" },
  { id: "commodity", label: "Commodity" },
  { id: "weight", label: "Weight" },
  { id: "equipment", label: "Equipment" },
  { id: "appointment", label: "Appointment instructions" },
  { id: "requirements", label: "Special requirements" },
  { id: "rate", label: "Rate" },
];

// Topics the dispatcher must communicate before dispatching. "requirements" is added only when the
// load has special requirements.
export const requiredLoadTopics = ["availability", "pickup", "delivery", "commodity", "weight", "equipment", "appointment"];

// Dispatcher text -> topics. Questions and statements both count ("Pickup is at 11" / "when is pickup").
export const driverIntentPatterns = {
  availability: ["available", "availability", "are you free", "can you take", "can you cover", "open for"],
  hos: ["\\bhos\\b", "hours of service", "driving hours", "hours (do you )?have", "hours left", "drive time", "time left", "how many hours"],
  location: ["where are you", "your location", "current location", "where is the truck", "where's the truck", "you currently"],
  pickup: ["pick.?up", "loading", "origin", "ready time", "load time", "shipper"],
  delivery: ["deliver", "drop", "unload", "destination", "receiver", "consignee", "\\bdue\\b"],
  commodity: ["commodity", "freight", "cargo", "what you are hauling", "what you're hauling", "hauling"],
  weight: ["weight", "\\blbs?\\b", "pounds"],
  equipment: ["equipment", "trailer", "dry van", "reefer", "flatbed", "van"],
  appointment: ["appointment", "fcfs", "first come", "\\bappt\\b", "check in", "check-in", "instructions", "window"],
  requirements: ["special", "requirement", "tarp", "lumper", "driver assist", "no.?touch", "restriction"],
  rate: ["\\brate\\b", "\\bpay\\b", "how much", "per mile", "agreed"],
};

export const driverAcceptPatterns = ["\\bthanks\\b", "thank you", "appreciate"];

// Driver replies per topic. {first} is the driver's first name.
export const driverReplies = {
  greeting: "Hey, {first} here. Go ahead.",
  availability: "Yes, I'm available and ready to roll.",
  hos: "I have {hos} of drive time left.",
  location: "I'm in {driverLocation} right now.",
  pickup: "Got it. Pickup in {origin}, {pickupDay}, {pickupTime} to {pickupEnd}.",
  delivery: "Copy. Delivery in {destination}, {deliveryDay}, {deliveryTime} to {deliveryEnd}.",
  commodity: "Understood, it's {commodity}.",
  weight: "Copy, about {weight} lbs.",
  equipment: "I'll be pulling the {equipment}, that works.",
  appointment: "{appointment}, understood.",
  requirements: "Noted: {requirements}",
  noRequirements: "No special requirements, got it.",
  rate: "Understood, the agreed rate is {rate}.",
  fallback: "Sorry, I didn't catch that. Can you tell me about the pickup, delivery, commodity, weight or appointment?",
};

// What the driver asks for when the dispatch is missing information. Keyed by the missing topic.
export const driverClarifications = {
  availability: "Before I accept, am I still free to take this one? Please confirm the load is available to me.",
  pickup: "What is the pickup location and the pickup time?",
  delivery: "What is the delivery location and the delivery appointment?",
  commodity: "What am I hauling? Can you confirm the commodity?",
  weight: "Can you confirm the weight?",
  equipment: "Can you confirm the equipment, am I taking a {equipment}?",
  appointment: "Is the pickup by appointment or first come first served, and what are the check-in instructions?",
  requirements: "Are there any special requirements I should know about?",
};

export const driverResponses = {
  accepted: "Dispatch received. I have everything I need, I'm accepting this load.",
  acceptedLate: "Thanks, I have the rest now. I'm accepting the load.",
  declined: "I can't take this one. {reason}",
};

// Why the driver cannot take the load. {name}/{status}/... filled from the selected driver and load.
export const suitabilityMessages = {
  equipment: {
    pass: "{truckEquipment} matches the load's {loadEquipment}, and {loadWeight} lbs is within the truck's {truckMax} lb limit.",
    failEquipment: "This driver's truck is a {truckEquipment}, but this load requires {loadEquipment}.",
    failWeight: "The load weighs {loadWeight} lbs, which is over this truck's {truckMax} lb limit.",
  },
  availability: {
    pass: "{driver} is {status} and can take a load.",
    fail: "{driver} is currently {status} and is not available for this load.",
  },
  hos: {
    pass: "{driveTime} of driving to the pickup, within {driver}'s {remainingHos} of remaining HOS.",
    fail: "{driver} does not have enough available HOS to reach the pickup: about {driveTime} of driving is needed and only {remainingHos} is left.",
  },
  pickup: {
    pass: "{driver} arrives about {arrival} from {driverLocation} ({distance} miles); the pickup window closes {windowEnd}.",
    fail: "{driver} is too far from the pickup for the {windowEnd} appointment: arriving about {arrival} from {driverLocation} ({distance} miles).",
  },
};

export const suitabilityChecks = [
  { code: "equipment", label: "Equipment & Capacity" },
  { code: "availability", label: "Truck / Driver Availability" },
  { code: "hos", label: "Remaining HOS" },
  { code: "pickup", label: "Pickup Feasibility" },
];

export const driverSuggestedMessages = [
  { id: "availability", label: "Are you available for this load?", text: "Hi {first}, I have a load picking up in {origin} going to {destination}. Are you available?" },
  { id: "hos", label: "How many driving hours do you have left?", text: "How many driving hours do you have left today?" },
  { id: "location", label: "Where are you right now?", text: "Where are you currently located?" },
  { id: "pickup", label: "Pickup details", text: "Pickup is in {origin}, {pickupDay} between {pickupTime} and {pickupEnd}. Can you make the pickup appointment?" },
  { id: "delivery", label: "Delivery details", text: "Delivery is in {destination}, {deliveryDay} between {deliveryTime} and {deliveryEnd}. Please confirm the delivery appointment." },
  { id: "commodity", label: "Commodity", text: "The commodity is {commodity}." },
  { id: "weight", label: "Weight", text: "The load weighs {weight} lbs." },
  { id: "equipment", label: "Equipment", text: "It needs a {equipment}. Are you set with the right trailer?" },
  { id: "appointment", label: "Appointment instructions", text: "The pickup is {appointment}. Check in with the shipper when you arrive." },
  { id: "requirements", label: "Special requirements", text: "Special requirements: {requirements}" },
  { id: "rate", label: "Agreed rate", text: "The agreed rate with the broker is {rate}." },
];

// Load assignment statuses, in order.
export const assignmentStatuses = {
  negotiated: "NEGOTIATED",
  "ready-for-assignment": "READY FOR ASSIGNMENT",
  assigned: "ASSIGNED",
  "driver-confirmed": "DRIVER CONFIRMED",
  "ready-for-pickup": "READY FOR PICKUP",
};

// Dispatch sheet layout (labels only; values are built from the load, broker, driver and agreed rate).
export const dispatchSheetFields = [
  { id: "load", label: "Load ID" },
  { id: "broker", label: "Broker" },
  { id: "rate", label: "Agreed Rate" },
  { id: "pickup", label: "Pickup" },
  { id: "pickupTime", label: "Pickup Date / Time" },
  { id: "delivery", label: "Delivery" },
  { id: "deliveryTime", label: "Delivery Date / Time" },
  { id: "commodity", label: "Commodity" },
  { id: "weight", label: "Weight" },
  { id: "equipment", label: "Equipment" },
  { id: "miles", label: "Miles" },
  { id: "instructions", label: "Special Instructions" },
  { id: "driver", label: "Driver" },
  { id: "truck", label: "Truck" },
];

// Roster filters
export const rosterFilterOptions = {
  availability: ["Available", "Driving", "On Break", "Off Duty", "Unavailable"],
  hos: [
    { id: "any", label: "Any HOS", minMinutes: 0 },
    { id: "4h", label: "4h+ HOS", minMinutes: 240 },
    { id: "8h", label: "8h+ HOS", minMinutes: 480 },
  ],
};
