export const onboardingSteps = [
  "welcome",
  "profile",
  "agent",
  "journey",
  "mechanics",
  "control-center",
  "complete",
];

export const agentMessage =
  "Hi! I'm your Training Agent. I'll guide you through dispatcher missions, explain tasks, provide hints, and review your decisions.";

export const agentCapabilities = [
  { label: "Step-by-step guidance", icon: "Route" },
  { label: "Real-world scenarios", icon: "Truck" },
  { label: "Hints", icon: "Lightbulb" },
  { label: "Performance feedback", icon: "ChartNoAxesColumn" },
];

export const welcomeFeatures = [
  { label: "Real Tools", icon: "Wrench" },
  { label: "Real Scenarios", icon: "Route" },
  { label: "AI Assistance", icon: "Bot" },
  { label: "Career Ready", icon: "Award" },
];

export const mechanics = [
  { id: "xp", icon: "Zap", title: "XP", subtitle: "Experience Points", text: "Earn experience by completing missions.", tone: "text-cyan-bright" },
  { id: "stars", icon: "Star", title: "Stars", subtitle: "Performance Score", text: "Higher accuracy and better decisions earn more stars.", tone: "text-gold-bright" },
  { id: "coins", icon: "Coins", title: "Coins", subtitle: "Game Rewards", text: "Game reward currency.", tone: "text-gold" },
  { id: "streak", icon: "Flame", title: "Streak", subtitle: "Consistency", text: "Maintain consistent training activity.", tone: "text-danger" },
  { id: "levels", icon: "Layers", title: "Levels", subtitle: "Progression", text: "New training missions unlock as you progress.", tone: "text-success" },
];

export const controlCenterMessage =
  "This is your Dispatcher Control Center. From here you will eventually manage trucks, drivers, loads, brokers and dispatch operations.";

export const avatarOptions = [
  { id: "male", label: "Male Avatar" },
  { id: "female", label: "Female Avatar" },
];
