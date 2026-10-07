// Mission 01 definition. `highlight` ids are matched by TaskHighlight / sidebar.
// `question: true` means the task is answered with choices in the mission panel.

export const TARGET_EQUIPMENT = "Dry Van";

export const mission01 = {
  id: "mission-01",
  levelId: 1,
  title: "Dispatcher Desk Setup",
  intro:
    "Welcome to your Dispatcher Control Center. Before handling freight, you need to understand your trucks, drivers and workspace.",
  objectives: [
    "Explore Trucks",
    "Identify Equipment",
    "Review Driver",
    "Check HOS",
    "Confirm Location",
  ],
  tasks: [
    {
      id: "open-trucks",
      title: "Open Trucks",
      instruction: "Open the Trucks section from the sidebar to see your fleet.",
      hint: "Click \"Trucks\" in the left sidebar.",
      highlight: "nav-trucks",
    },
    {
      id: "find-dry-van",
      title: "Find the Dry Van Truck",
      instruction:
        "Find the truck that uses Dry Van equipment. Open a truck, check its Equipment Type, then confirm it.",
      hint: "Check the Equipment Type field on each truck profile.",
      highlight: "truck-confirm",
    },
    {
      id: "open-driver",
      title: "Open Assigned Driver",
      instruction: "Open the driver assigned to the Dry Van truck.",
      hint: "Open the driver assigned to this truck. Use the Assigned Driver link.",
      highlight: "assigned-driver",
    },
    {
      id: "check-hos",
      title: "Check Remaining HOS",
      instruction:
        "How much Hours of Service (HOS) does this driver have remaining? Answer in the mission panel.",
      hint: "Remaining HOS is displayed in the Driver Status section.",
      highlight: "hos",
      question: true,
    },
    {
      id: "confirm-location",
      title: "Confirm Current Location",
      instruction: "Where is this driver located right now? Answer in the mission panel.",
      hint: "Current location is shown in the Driver Status section.",
      highlight: "location",
      question: true,
    },
  ],
};

import { mission02 } from "./phase3Missions";
import { mission03 } from "./phase4Missions";
import { mission04 } from "./phase5Missions";
import { mission05 } from "./phase6Missions";
import { mission06 } from "./phase7Missions";

// Every mission by id (Level Map intros, progression).
export const missions = { [mission01.id]: mission01, [mission02.id]: mission02, [mission03.id]: mission03, [mission04.id]: mission04, [mission05.id]: mission05, [mission06.id]: mission06 };
