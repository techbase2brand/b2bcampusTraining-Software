// Mission 6 (Level 6, user-facing "Phase 7"): Live Tracking, Check Calls & Shipment Monitoring.
// Pure definition data. `rule` objects are read by src/lib/trackingActions.js and the scenario is
// played by src/lib/trackingEngine.js. The assigned load / driver / truck come from Phase 6 (saved
// IDs); nothing here names a load or a driver. Everything is deterministic: no random delays,
// locations, ETAs or broker answers.

export const mission06 = {
  id: "mission-06",
  levelId: 6,
  phaseId: "phase-7",
  title: "Live Tracking, Check Calls & Shipment Monitoring",
  intro: "Track the active load from pickup to delivery, perform check calls, monitor the ETA and handle a delay.",
  steps: ["Confirm Pickup Status", "Track Driver", "Perform Check Call", "Monitor ETA", "Handle Exception", "Update Broker", "Confirm Arrival"],

  // `needsStep` = the shipment must have reached this simulation step before the action is possible.
  tasks: [
    {
      id: "start-monitoring",
      title: "Start Shipment Monitoring",
      instruction: "Load {ref} is ready for pickup. Start the trip to begin monitoring the shipment.",
      hint: "Press Start Trip in the Training Controls.",
      step: 0,
      needsStep: 0,
      rule: { type: "trip-started" },
    },
    {
      id: "confirm-en-route",
      title: "Confirm Driver En Route",
      instruction: "Confirm the driver has departed for the pickup and note the ETA to the shipper.",
      hint: "Use Confirm Departed in Pickup Monitoring once the status shows EN ROUTE TO PICKUP.",
      step: 1,
      needsStep: 1,
      rule: { type: "flag", flag: "departed" },
    },
    {
      id: "pickup-arrival",
      title: "Confirm Pickup Arrival",
      instruction: "Advance the simulation until the driver reaches the shipper, then confirm the arrival.",
      hint: "Advance Simulation moves the shipment to its next event. Confirm Arrived when the status says ARRIVED AT PICKUP.",
      step: 1,
      needsStep: 3,
      rule: { type: "flag", flag: "arrived" },
    },
    {
      id: "pickup-complete",
      title: "Confirm Pickup Complete",
      instruction: "Watch the loading, confirm it, then confirm the pickup is complete.",
      hint: "Confirm Loading first, then advance until PICKED UP and confirm Pickup Complete.",
      step: 1,
      needsStep: 5,
      rule: { type: "flag", flag: "pickedUp" },
    },
    {
      id: "perform-check-call",
      title: "Perform Check Call",
      instruction: "The load is moving. Contact the driver by chat or call and ask for a status update.",
      hint: "Ask for the driver's location, ETA or whether they are on schedule.",
      step: 2,
      needsStep: 5,
      rule: { type: "check-call", minStep: 5 },
    },
    {
      id: "review-eta",
      title: "Review ETA",
      instruction: "Open the ETA panel, compare the ETA with the appointment window and acknowledge it.",
      hint: "Compare the current ETA with the appointment window, then press Acknowledge ETA.",
      step: 3,
      needsStep: 6,
      rule: { type: "flag", flag: "etaReviewed" },
    },
    {
      id: "handle-delay",
      title: "Handle Delay / Exception",
      instruction: "The driver reported a delay. Acknowledge the driver, work out the new ETA, decide if the appointment is affected and record it.",
      hint: "Acknowledge the driver, pick the updated ETA, judge the appointment, then record the event.",
      step: 4,
      needsStep: 8,
      rule: { type: "exception" },
    },
    {
      id: "update-broker",
      title: "Update Broker if Required",
      instruction: "A material delay must be communicated. Send the broker the delay and the updated ETA.",
      hint: "A meaningful delay should be communicated to the broker. Mention the delay and the new ETA.",
      step: 5,
      needsStep: 8,
      rule: { type: "broker-update" },
    },
    {
      id: "confirm-delivery-arrival",
      title: "Confirm Arrival at Delivery",
      instruction: "Advance until the driver reaches the receiver, then confirm the arrival. Stop there: delivery paperwork is the next phase.",
      hint: "When the status says ARRIVED AT DELIVERY, press Confirm Arrival.",
      step: 6,
      needsStep: 10,
      rule: { type: "arrival" },
    },
  ],

  agentMessages: {
    beforeStart: "Your driver is assigned. Begin monitoring the shipment and confirm movement toward pickup.",
    start: "Your driver is assigned. Start the trip and confirm movement toward the pickup.",
    pickup: "Track the driver's ETA and make sure the pickup appointment remains feasible.",
    transit: "Perform regular check calls without over-contacting the driver.",
    eta: "Compare the ETA with the appointment window before you decide anything.",
    delay: "Recalculate the ETA and decide whether the broker needs an update.",
    broker: "A meaningful delay should be communicated. Keep the update short: what happened and the new ETA.",
    arrival: "Almost there. Confirm the arrival, then stop: delivery paperwork comes next.",
    done: "Shipment monitoring complete. The load has arrived at delivery.",
  },

  feedback: {
    startFirst: "Start the mission first.",
    tripStarted: "Trip started. Confirm the driver is moving toward the pickup.",
    confirmEarly: "That has not happened yet. Advance the simulation first.",
    needLoading: "Confirm the loading before you confirm the pickup is complete.",
    etaReviewed: "ETA reviewed. Keep it next to the appointment window.",
    checkCall: "Check call logged.",
    checkCallRepeat: "You already checked at this point. Wait for the shipment to progress before calling again.",
    exceptionOpen: "Resolve the open delay first: acknowledge the driver, set the new ETA, judge the appointment, record it and update the broker.",
    ackDone: "Driver acknowledged.",
    etaCorrect: "Correct. That is the original ETA plus the delay.",
    etaWrong: "Not quite. Add the reported delay to the original ETA.",
    apptCorrect: "Correct. That matches the ETA against the appointment window.",
    apptWrong: "Compare the new ETA with the end of the appointment window.",
    needAck: "Acknowledge the driver first.",
    needEtaFirst: "Work out the new ETA and judge the appointment first.",
    recorded: "Delay recorded in the shipment log.",
    brokerMissing: "A useful broker update names the delay and the updated ETA.",
    brokerSent: "Broker updated. The delay and the new ETA are on record.",
    brokerCourtesy: "Not required for a delay this small, but the broker has it.",
    arrivalConfirmed: "Arrival confirmed. ARRIVED AT DELIVERY. Delivery paperwork is the next phase.",
    taskDone: "{title} complete.",
  },
};

export const trackingStatuses = {
  "ready-for-pickup": "READY FOR PICKUP",
  "en-route-pickup": "EN ROUTE TO PICKUP",
  "arrived-pickup": "ARRIVED AT PICKUP",
  loading: "LOADING",
  "picked-up": "PICKED UP",
  "in-transit": "IN TRANSIT",
  monitoring: "CHECK CALL / MONITORING",
  "arrived-delivery": "ARRIVED AT DELIVERY",
};

// Timeline rows shown to the student (monitoring is part of In Transit).
export const timelineRows = [
  { id: "assigned", label: "Assigned", status: null },
  { id: "driver-confirmed", label: "Driver Confirmed", status: null },
  { id: "ready-for-pickup", label: "Ready for Pickup", status: "ready-for-pickup" },
  { id: "en-route-pickup", label: "En Route to Pickup", status: "en-route-pickup" },
  { id: "arrived-pickup", label: "Arrived at Pickup", status: "arrived-pickup" },
  { id: "loading", label: "Loading", status: "loading" },
  { id: "picked-up", label: "Picked Up", status: "picked-up" },
  { id: "in-transit", label: "In Transit", status: "in-transit" },
  { id: "arrived-delivery", label: "Arrived at Delivery", status: "arrived-delivery" },
];

// The scripted trip. `leg` is where the truck is (pickup = driver -> shipper, loaded = shipper ->
// receiver) and `frac` how far along that leg. A step with `delay` reports that delay when reached;
// later step times include it. Step indexes are what the saved state stores.
export const trackingScenario = {
  departAfterMinutes: 15, // after the assignment time
  minLegMinutes: 10,
  loadingMinutes: 45,
  leaveShipperMinutes: 10,
  atRiskBufferMinutes: 60, // slack below this = AT RISK
  materialDelayMinutes: 30, // a delay this long (or any delay that threatens the appointment) needs a broker update
  maxLocationMatchMiles: 75, // nearest reference city used as the position label
  steps: [
    { id: "ready", status: "ready-for-pickup", leg: "pickup", frac: 0, activity: "Shipment ready for pickup. {driver} is assigned in {location}." },
    { id: "depart", status: "en-route-pickup", leg: "pickup", frac: 0, activity: "Trip started. {driver} departed {location} for the pickup." },
    { id: "approach", status: "en-route-pickup", leg: "pickup", frac: 0.5, activity: "Driver en route, near {location}. Pickup ETA {etaPickup}." },
    { id: "arrive-pickup", status: "arrived-pickup", leg: "pickup", frac: 1, activity: "{driver} arrived at the shipper in {location}." },
    { id: "loading", status: "loading", leg: "pickup", frac: 1, delay: "loading-delay", activity: "Loading started at the shipper." },
    { id: "picked-up", status: "picked-up", leg: "loaded", frac: 0, activity: "Pickup complete. Freight is on the truck." },
    { id: "transit", status: "in-transit", leg: "loaded", frac: 0.15, activity: "In transit near {location}. Delivery ETA {etaDelivery}." },
    { id: "monitor-1", status: "monitoring", leg: "loaded", frac: 0.4, activity: "Monitoring: driver near {location}. Delivery ETA {etaDelivery}." },
    { id: "traffic", status: "monitoring", leg: "loaded", frac: 0.62, delay: "traffic", activity: "Monitoring: driver near {location}." },
    { id: "monitor-2", status: "monitoring", leg: "loaded", frac: 0.85, activity: "Monitoring: driver near {location}. Delivery ETA {etaDelivery}." },
    { id: "arrive-delivery", status: "arrived-delivery", leg: "loaded", frac: 1, activity: "{driver} arrived at the receiver in {location}." },
  ],
  delays: {
    "loading-delay": { minutes: 15, label: "Shipper loading delay", driverLine: "The shipper says loading is running about {minutes} minutes long." },
    traffic: { minutes: 45, exception: true, label: "Heavy traffic", driverLine: "There's heavy traffic and I'm running about {minutes} minutes behind." },
  },
};

// Check-call topics (what the dispatcher asks). `ack` and `updates` are not check calls.
export const checkCallTopics = [
  { id: "location", label: "Current location" },
  { id: "schedule", label: "On schedule?" },
  { id: "eta", label: "ETA" },
  { id: "traffic", label: "Traffic / weather" },
  { id: "pickup", label: "Pickup status" },
  { id: "shipper", label: "Shipper delay" },
  { id: "delivery", label: "Delivery on time?" },
];

export const trackingIntentPatterns = {
  location: ["where are you", "location", "where is the truck", "where's the truck", "current position", "which city", "you currently"],
  schedule: ["on schedule", "on time", "on track", "behind", "ahead of", "running late", "schedule"],
  eta: ["\\beta\\b", "arrive", "arrival", "how long", "what time", "when will you"],
  traffic: ["traffic", "weather", "road", "construction", "accident", "delay on the road"],
  pickup: ["pick.?up", "loaded", "loading", "picked up", "at the shipper", "at the dock"],
  shipper: ["shipper", "dock", "detention", "wait(ing)? (at|for)", "delay at"],
  delivery: ["deliver", "make (the )?(delivery|appointment)", "receiver", "appointment"],
  ack: ["\\bthanks\\b", "thank you", "understood", "copy that", "got it", "noted", "appreciate", "\\bok(ay)?\\b", "thanks for (letting|the update)"],
  updates: ["let me know", "keep me (posted|updated)", "update me", "keep me informed"],
};

export const trackingSuggested = [
  { id: "location", label: "Current location?", text: "Hi {first}, what's your current location?" },
  { id: "schedule", label: "On schedule?", text: "Are you on schedule?" },
  { id: "eta", label: "ETA?", text: "What's your ETA to {target}?" },
  { id: "traffic", label: "Traffic or weather?", text: "Any traffic or weather issues?" },
  { id: "pickup", label: "Pickup done?", text: "Has pickup been completed?" },
  { id: "shipper", label: "Shipper delay?", text: "Any delay at the shipper?" },
  { id: "delivery", label: "Make delivery on time?", text: "Do you expect to make delivery on time?" },
  { id: "ack", label: "Acknowledge delay", text: "Thanks for the update, {first}. Understood." },
  { id: "updates", label: "Keep me posted", text: "Please update me if the delay gets worse." },
];

// Driver answers. Conditions are resolved in src/lib/trackingComms.js from the simulation state.
export const trackingReplies = {
  greeting: "Hey, {first} here. Go ahead.",
  location: "I'm near {location}, about {remaining} miles from {destination}.",
  schedule: { ontime: "Yes, I'm on schedule.", risk: "I'm a little tight on time but still moving.", late: "No, I'm running late." },
  eta: "My ETA to the {target} is {eta}.",
  traffic: { none: "No traffic or weather problems so far.", delay: "Heavy traffic right now, I'm about {minutes} minutes behind." },
  pickup: { before: "Not at the shipper yet.", arrived: "I'm at the shipper, waiting to load.", loading: "They're loading me now.", done: "Pickup is complete, I'm loaded and rolling." },
  shipper: { before: "I haven't reached the shipper yet.", none: "No delay at the shipper.", delay: "The shipper had loading about {minutes} minutes long." },
  delivery: { yes: "Yes, I expect to make the delivery on time.", risk: "It will be close. I'll keep pushing.", no: "No, I'll miss the appointment at this pace." },
  ack: "Thanks, I'll keep driving.",
  updates: "Will do, I'll keep you posted.",
  fallback: "Copy that.",
  noDriver: "Start the trip first.",
};

export const trackingAlertTemplates = {
  "pickup-approaching": { tone: "info", title: "Pickup approaching", text: "{driver} is about to reach the shipper. Pickup ETA {etaPickup}." },
  "driver-stopped": { tone: "info", title: "Driver stopped", text: "{driver} is stopped at the shipper in {location}." },
  "pickup-delay": { tone: "warn", title: "Pickup delay", text: "Loading is running about {minutes} minutes long at the shipper." },
  "traffic-delay": { tone: "danger", title: "Traffic delay", text: "{driver} reports heavy traffic: about {minutes} minutes behind." },
  "eta-slipping": { tone: "warn", title: "ETA slipping", text: "Delivery ETA moved from {etaOriginal} to {etaDelivery}." },
  "late-risk": { tone: "danger", title: "Late risk", text: "At this pace the delivery misses the appointment window (ends {windowEnd})." },
  "broker-update": { tone: "warn", title: "Broker update required", text: "This delay is material. Tell the broker and give the updated ETA." },
};

// Broker update: must name the delay and the updated ETA. The broker's answer is deterministic.
export const brokerUpdateScript = {
  patterns: {
    delay: ["delay", "late", "behind", "running", "traffic", "slip", "pushed"],
    eta: ["\\beta\\b", "arriv", "\\d{1,2}:\\d{2}", "\\d{1,2}\\s?(am|pm)", "updated"],
  },
  suggested: "Update on {ref}: {driver} is delayed approximately {minutes} minutes due to traffic. Updated ETA is {etaDelivery}.",
  reply: "Thanks for the heads up on {ref}. I've noted the new ETA of {etaDelivery}.",
  courtesyReply: "Thanks, noted.",
};

export const exceptionScript = {
  etaTitle: "Updated delivery ETA",
  apptTitle: "Is the appointment affected?",
  apptOptions: [
    { id: "safe", label: "No, still inside the window" },
    { id: "affected", label: "Yes, at risk or late" },
  ],
  ackText: "Thanks for the update, {first}. Understood. Please keep me posted if it gets worse.",
  recordText: "Delay recorded: {label}, about {minutes} minutes. New delivery ETA {etaDelivery}. Appointment {appointment}.",
};

export const phase7Page = {
  eyebrow: "Phase 7",
  title: "Live Tracking & Shipment Monitoring",
  subtitle: "Track the active load, perform check calls, monitor ETA and respond to delays or exceptions.",
  shipmentsTitle: "Active Shipments",
  panelTabs: [
    { id: "ship", label: "Shipments" },
    { id: "map", label: "Map" },
    { id: "comms", label: "Comms" },
    { id: "details", label: "Details" },
    { id: "log", label: "Log" },
  ],
  secondaryTabs: [
    { id: "ship", label: "Shipments" },
    { id: "comms", label: "Comms & Alerts" },
    { id: "details", label: "Load & Driver" },
    { id: "log", label: "Logs & Tasks" },
  ],
  completion: {
    title: "SHIPMENT MONITORING COMPLETE",
    subtitle: "The load has arrived at delivery.",
    unlocked: "Next: Delivery, Documents & Load Closeout.",
    cta: "Return to Level Map",
    secondary: "Back to Tracking",
  },
};
