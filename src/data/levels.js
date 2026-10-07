// Level Map definitions. `pos` is the node position (%) on the desktop map.
// phaseId links a level to trainingPhases (phases.js). `route` is where Start Mission goes.
// `label` lines are shown stacked under the node.

export const levels = [
  { id: 1, phaseId: "phase-2", title: "Dispatcher Desk Setup", label: ["Dispatcher", "Desk Setup"], missionId: "mission-01", route: "/dispatcher", pos: { x: 7, y: 64 } },
  { id: 2, phaseId: "phase-3", title: "Finding Loads", label: ["Finding Loads", "& Load Board"], missionId: "mission-02", route: "/dispatcher/load-board", pos: { x: 21, y: 36 } },
  { id: 3, phaseId: "phase-4", title: "Load Analysis", label: ["Load Analysis", "& Matching"], missionId: "mission-03", route: "/dispatcher/load-analysis", pos: { x: 36, y: 66 } },
  { id: 4, phaseId: "phase-5", title: "Broker Calling & Communication", label: ["Broker Calling &", "Communication"], missionId: "mission-04", route: "/dispatcher/brokers", pos: { x: 50, y: 34 } },
  { id: 5, phaseId: "phase-6", title: "Driver Communication + Load Assignment", label: ["Driver Comms", "& Assignment"], missionId: "mission-05", route: "/dispatcher/dispatch", pos: { x: 64, y: 64 } },
  { id: 6, phaseId: "phase-7", title: "Live Tracking, Check Calls & Shipment Monitoring", label: ["Live Tracking", "& Check Calls"], missionId: "mission-06", route: "/dispatcher/tracking", pos: { x: 79, y: 36 } },
  { id: 7, phaseId: "phase-8", title: "Delivery, Documents & Load Closeout", label: ["Delivery &", "Documents"], missionId: null, route: null, pos: { x: 93, y: 64 } },
];

export const TOTAL_LEVELS = levels.length;
