// Mission 4 (Level 4): Broker Calling & Communication. Pure definition data.
// `rule` objects are descriptors read by src/lib/commsActions.js. The loaded selectedBestLoadId
// drives everything; nothing here names a load.

export const mission04 = {
  id: "mission-04",
  levelId: 4,
  phaseId: "phase-5",
  title: "Broker Calling & Communication",
  intro:
    "Verify the load, contact the broker and negotiate the rate.",
  steps: ["Select Broker", "Review Load Details", "Communicate", "Negotiate Rate", "Confirm Agreement"],

  tasks: [
    {
      id: "select-broker",
      title: "Select Correct Broker",
      instruction: "Find the broker that posted your selected load ({ref}) and select it from the list.",
      hint: "Check the selected load's broker name in Load Details, then find that broker.",
      highlight: "broker-list",
      step: 0,
      rule: { type: "select-broker" },
    },
    {
      id: "review-load-details",
      title: "Review Load Details",
      instruction: "Read the selected load's details, then confirm you have reviewed them.",
      hint: "Check pickup, delivery, equipment and weight in Load Details, then press Mark Details Reviewed.",
      highlight: "details-review",
      step: 1,
      rule: { type: "review-details" },
    },
    {
      id: "confirm-availability",
      title: "Confirm Load Availability",
      instruction: "Ask the broker whether {ref} is still available.",
      hint: "Ask whether the load is still available, and mention the load reference.",
      highlight: "chat",
      step: 2,
      rule: { type: "topics", topics: ["availability"] },
    },
    {
      id: "verify-requirements",
      title: "Verify Load Requirements",
      instruction: "Verify the commodity, weight, equipment, pickup, delivery, appointment and any special requirements.",
      hint: "Before negotiating, confirm pickup and delivery appointments, then the commodity, weight, equipment and special requirements.",
      highlight: "chat",
      step: 2,
      rule: { type: "topics", topics: ["commodity", "weight", "equipment", "pickup", "delivery", "appointment", "requirements"] },
    },
    {
      id: "ask-rate-terms",
      title: "Ask About Rate / Terms",
      instruction: "Ask about the posted rate and the detention terms before you negotiate.",
      hint: "Ask whether the rate is firm, and what the detention terms are.",
      highlight: "chat",
      step: 2,
      rule: { type: "topics", topics: ["rate", "detention"] },
    },
    {
      id: "negotiate-rate",
      title: "Negotiate Rate",
      instruction: "Ask the broker for a better rate and give an operational reason.",
      hint: "Use your deadhead as a negotiation reason, and ask for a specific, reasonable figure.",
      highlight: "helper",
      step: 3,
      rule: { type: "negotiation-attempt" },
    },
    {
      id: "confirm-agreement",
      title: "Confirm Final Agreement",
      instruction: "When the broker agrees on a rate, confirm the final rate and terms.",
      hint: "Accept the broker's offer, check the terms, then press Confirm Agreement.",
      highlight: "confirm",
      step: 4,
      rule: { type: "agreement-confirmed" },
    },
  ],

  // Training Agent lines by mission step (data-driven).
  agentMessages: {
    beforeStart: "Your selected load is ready for broker communication. Start the mission, identify the broker associated with the load, then contact them.",
    start: "First, identify the broker associated with your selected load.",
    details: "Review the load details so you know exactly what you are discussing.",
    communicate: "Confirm availability, commodity, weight, pickup and delivery before discussing price.",
    negotiate: "Use operational reasons such as deadhead or timing to support your rate request.",
    agreement: "Confirm the final rate and important terms before ending the conversation.",
    done: "Agreement confirmed. Your negotiated rate carries forward to the next mission.",
  },

  feedback: {
    wrongBroker: "{broker} is not associated with your selected load. Check the load details and broker information.",
    correctBroker: "Correct. {broker} posted {ref}. Open the chat or call to contact them.",
    detailsReviewed: "Good. You know the load. Now confirm it is still available with the broker.",
    startFirst: "Start the mission first. Then identify the broker associated with your selected load.",
    needBroker: "Select the broker for your load first.",
    needNegotiate: "Try negotiating before you confirm. Ask for a better rate and explain why.",
    notAgreed: "The broker has not agreed on a rate yet.",
    finalized: "Deal locked in. It carries forward to Driver Assignment.",
    agreementConfirmed: "Agreement confirmed. The rate is agreed, but the load is not booked yet.",
    taskDone: "{title} complete.",
    extremeAsk: "That request is far above the posted rate. Brokers respect reasonable, justified requests, so ask for a realistic figure and say why.",
  },

  // Load status shown on the details panel, derived from progress.
  statuses: { available: "AVAILABLE", review: "UNDER REVIEW", negotiation: "UNDER NEGOTIATION", agreed: "RATE AGREED" },
};

export const phase5Page = {
  eyebrow: "Mission 4",
  title: "Broker Calling & Communication",
  subtitle: "Contact the broker, verify load details, communicate professionally and negotiate the best possible rate.",
  brokersTitle: "Brokers",
  tabs: [
    { id: "all", label: "All Brokers" },
    { id: "recent", label: "Recent" },
    { id: "saved", label: "Saved" },
  ],
  // Below lg: one panel at a time (Chat / Call share one workspace)
  panelTabs: [
    { id: "brokers", label: "Brokers" },
    { id: "chat", label: "Chat / Call" },
    { id: "load", label: "Load & Rate" },
  ],
  workflow: [
    { id: "select", title: "Select a Broker" },
    { id: "communicate", title: "Communicate" },
    { id: "negotiate", title: "Negotiate Rate" },
    { id: "confirm", title: "Confirm Agreement" },
    { id: "complete", title: "Complete Task" },
  ],
  completion: {
    title: "BROKER COMMUNICATION COMPLETE",
    subtitle: "You verified the load, negotiated and confirmed the agreement with the broker.",
    unlocked: "Rate agreed. Booking comes in the next mission.",
    cta: "Return to Level Map",
    secondary: "Back to Brokers",
  },
};
