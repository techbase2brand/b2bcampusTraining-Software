// Temporary simulation data. Replace with API responses later.
import { defaultLoadFilters } from "./loadFilters";

export const mockUser = {
  id: "student-001",
  name: "Aaryan",
  role: "Dispatcher Trainee",
  course: "Truck Dispatch Training",
};

export const initialMissionProgress = {
  missionId: null,
  started: false,
  completed: false,
  currentTask: 0,
  completedTasks: [],
  attempts: 0,
  hintsUsed: 0,
  xpEarned: 0,
  starsEarned: 0,
};

export const initialGameState = {
  isAuthenticated: false,
  profile: mockUser,
  avatarSelection: null, // "male" | "female" | null
  onboardingCompleted: false,
  currentLevel: 1,
  completedLevels: [],
  xp: 0,
  nextLevelXp: 500,
  stars: 0,
  coins: 0,
  streak: 0,
  missionProgress: initialMissionProgress, // Mission 01 (unchanged)

  // Phase 3 / 4. Runs for later missions are keyed by missionId, same shape as missionProgress.
  missionRuns: {
    "mission-02": { ...initialMissionProgress, missionId: "mission-02" },
    "mission-03": { ...initialMissionProgress, missionId: "mission-03" },
    "mission-04": { ...initialMissionProgress, missionId: "mission-04" },
    "mission-05": { ...initialMissionProgress, missionId: "mission-05" },
    "mission-06": { ...initialMissionProgress, missionId: "mission-06" },
  },
  // Phase 3 board state (IDs only; loads are resolved from src/data/loads.js)
  loadFilters: defaultLoadFilters,
  reviewedLoadIds: [],
  rejectedLoadIds: [],
  shortlistedLoadIds: [],
  selectedLoadId: null,
  loadChecks: {}, // { [loadId]: [checkCode, ...] } checks the student has revealed
  // Phase 4 output
  selectedBestLoadId: null,
  decisionReasonIds: [],
  analysisViewedLoadIds: [],
  answeredTaskIds: [],

  // Mission 4 (Broker Communication). IDs and primitives only; the load and broker are resolved from
  // data. commsLoadId records which selected load this state belongs to.
  commsLoadId: null,
  selectedBrokerId: null,
  detailsReviewed: false,
  coveredTopics: [],
  commsMessages: [], // [{ from: "student" | "broker", channel: "chat" | "call", text }]
  negotiation: { attempts: 0, extremeCount: 0, counter: null, requests: [], reasonsUsed: [], status: "none", agreedRate: null },
  callNotes: [],
  commsStats: { sent: 0, professional: 0 }, // messages sent / professionally worded
  communicationMode: null, // "chat" | "call" | "both"
  brokerConfirmed: false,
  negotiatedLoadId: null,
  agreedRate: null,
  savedBrokerIds: [],
  recentBrokerIds: [],

  // Mission 5 (Driver Communication + Load Assignment). IDs and primitives only; the load, driver and
  // truck are resolved from data. dispatchLoadId records which negotiated load this state belongs to.
  dispatchLoadId: null,
  loadReviewed: false,
  viewedDriverIds: [],
  selectedDriverId: null,
  driverChecks: {}, // { [driverId]: [checkCode, ...] } checks the student has revealed
  driverTopics: [],
  driverMessages: [], // [{ from: "dispatcher" | "driver" | "system", channel: "chat" | "call", text }]
  driverCallNotes: [],
  driverCommMode: null, // "chat" | "call" | "both"
  dispatchReviewed: false,
  dispatchSent: false,
  driverResponse: "none", // none | needs-clarification | accepted | declined
  driverAsk: null, // topic the driver is waiting for
  driverConfirmed: false,
  assignedLoadId: null,
  assignedDriverId: null,
  assignedTruckId: null,
  assignmentTimestamp: null, // simulation-clock string
  loadAssignmentStatus: "negotiated", // negotiated | ready-for-assignment | assigned | driver-confirmed | ready-for-pickup

  // Mission 6 (Live Tracking & Shipment Monitoring). IDs, primitives and event records only; the load,
  // driver, truck and broker are resolved from the Phase 6 assignment. trackingStep is the position in
  // the scripted trip (see data/phase7Missions.js); everything else is derived from it.
  trackingLoadId: null,
  trackingStep: 0,
  trackingFlags: { departed: false, arrived: false, loading: false, pickedUp: false, etaReviewed: false, ack: false, etaSolved: false, apptSolved: false, recorded: false, etaWrong: 0, apptWrong: 0 },
  currentShipmentStatus: "ready-for-pickup",
  lastKnownLocation: null,
  checkCallLog: [], // [{ id, step, timestamp, location, eta, status, issue, notes, channel }]
  activityLog: [], // [{ id, type, timestamp, message, loadId, driverId }]
  delayEvents: [], // [{ id, step, minutes, material, timestamp, message }]
  brokerUpdates: [], // [{ id, step, timestamp, text, required, eta }]
  trackingMessages: [], // [{ from: "dispatcher" | "driver" | "broker" | "system", channel: "chat" | "call", text }]
  trackingNotes: [],
  trackingCommMode: null,
  currentETA: null, // simulation-clock string
  arrivalConfirmed: false,
  phase7Completed: false,
};
