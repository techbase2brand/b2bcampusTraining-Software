// Configurable reward values.

export const taskXp = {
  "open-trucks": 10,
  "find-dry-van": 20,
  "open-driver": 20,
  "check-hos": 25,
  "confirm-location": 25,
  // Mission 02: Finding Loads (110)
  "open-load-board": 10,
  "filter-equipment": 15,
  "set-pickup-area": 15,
  "check-weight": 20,
  "check-timing": 20,
  "shortlist-loads": 30,
  // Mission 03: Load Analysis & Matching (150)
  "review-shortlist": 10,
  "lowest-deadhead": 15,
  "total-miles": 15,
  "analyze-rpm": 15,
  "compare-fuel": 15,
  "compare-profit": 20,
  "check-feasibility": 20,
  "select-best": 40,
  // Mission 04: Broker Calling & Communication (125)
  "select-broker": 10,
  "review-load-details": 10,
  "confirm-availability": 15,
  "verify-requirements": 25,
  "ask-rate-terms": 15,
  "negotiate-rate": 25,
  "confirm-agreement": 25,
  // Mission 05: Driver Communication + Load Assignment (150)
  "review-load": 10,
  "select-driver": 20,
  "verify-hos": 15,
  "pickup-feasibility": 15,
  "contact-driver": 10,
  "communicate-details": 25,
  "send-dispatch": 15,
  "driver-confirmation": 15,
  "confirm-assignment": 25,
  // Mission 06: Live Tracking, Check Calls & Shipment Monitoring (170)
  "start-monitoring": 10,
  "confirm-en-route": 15,
  "pickup-arrival": 15,
  "pickup-complete": 20,
  "perform-check-call": 20,
  "review-eta": 15,
  "handle-delay": 30,
  "update-broker": 25,
  "confirm-delivery-arrival": 20,
};

export const missionCoins = 50; // Mission 01

// Coins per mission (Mission 01 keeps missionCoins above)
export const missionCoinRewards = { "mission-02": 75, "mission-03": 100, "mission-04": 125, "mission-05": 150, "mission-06": 175 };

// Stars: 3 = sharp and unassisted, 2 = solid, 1 = completed.
export function calcStars({ accuracy, hintsUsed }) {
  if (accuracy >= 90 && hintsUsed <= 1) return 3;
  if (accuracy >= 70) return 2;
  return 1;
}
