// Fictional brokers (API-style). Loads reference these by brokerId; locationId -> locations.js.
// `negotiation` is the broker's deterministic bargaining profile (see src/lib/brokerNegotiation.js):
//   firstOfferPct   first counteroffer above the posted rate
//   baseCeilingPct  highest rate (above posted) the broker approves with no justification
// `contactName` is the person the student speaks to. `status` is cosmetic: online | away | offline.

export const brokers = [
  {
    id: "broker-001", name: "Summit Freight Brokers", contactName: "John", locationId: "loc-chicago-il", status: "online",
    rating: 4.8, reviewCount: 120, mcNumber: "MC-410021", paymentTerms: "Net 30", avgResponse: "Under 10 min",
    detentionTerms: "2 hours free, then $50 per hour", negotiation: { firstOfferPct: 0.02, baseCeilingPct: 0.04, style: "flexible" },
  },
  {
    id: "broker-002", name: "Lone Star Logistics", contactName: "Maria", locationId: "loc-dallas-tx", status: "online",
    rating: 4.5, reviewCount: 86, mcNumber: "MC-388764", paymentTerms: "Net 30", avgResponse: "Under 20 min",
    detentionTerms: "2 hours free, then $45 per hour", negotiation: { firstOfferPct: 0.015, baseCeilingPct: 0.035, style: "neutral" },
  },
  {
    id: "broker-003", name: "Prairie Line Transport", contactName: "Dave", locationId: "loc-kansas-city-mo", status: "away",
    rating: 4.2, reviewCount: 64, mcNumber: "MC-501392", paymentTerms: "Net 45", avgResponse: "Under 30 min",
    detentionTerms: "3 hours free, then $40 per hour", negotiation: { firstOfferPct: 0.01, baseCeilingPct: 0.03, style: "firm" },
  },
  {
    id: "broker-004", name: "Harbor Point Carriers", contactName: "Priya", locationId: "loc-houston-tx", status: "online",
    rating: 4.6, reviewCount: 142, mcNumber: "MC-290871", paymentTerms: "Quick Pay available", avgResponse: "Under 15 min",
    detentionTerms: "2 hours free, then $55 per hour", negotiation: { firstOfferPct: 0.02, baseCeilingPct: 0.04, style: "flexible" },
  },
  {
    id: "broker-005", name: "Redline Freight Group", contactName: "Marcus", locationId: "loc-memphis-tn", status: "offline",
    rating: 3.9, reviewCount: 41, mcNumber: "MC-612450", paymentTerms: "Net 30", avgResponse: "Under 45 min",
    detentionTerms: "2 hours free, then $35 per hour", negotiation: { firstOfferPct: 0.01, baseCeilingPct: 0.03, style: "firm" },
  },
  {
    id: "broker-006", name: "Blue Ridge Freight", contactName: "Ellen", locationId: "loc-atlanta-ga", status: "online",
    rating: 4.3, reviewCount: 58, mcNumber: "MC-455102", paymentTerms: "Net 30", avgResponse: "Under 20 min",
    detentionTerms: "2 hours free, then $50 per hour", negotiation: { firstOfferPct: 0.015, baseCeilingPct: 0.035, style: "neutral" },
  },
  {
    id: "broker-007", name: "Gateway Cargo Partners", contactName: "Tom", locationId: "loc-columbus-oh", status: "away",
    rating: 4.0, reviewCount: 28, mcNumber: "MC-701883", paymentTerms: "Net 30", avgResponse: "Under 40 min",
    detentionTerms: "2 hours free, then $40 per hour", negotiation: { firstOfferPct: 0.01, baseCeilingPct: 0.03, style: "firm" },
  },
];
