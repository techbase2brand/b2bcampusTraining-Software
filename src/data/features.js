// Feature flags for UI that is not finished or has no training behaviour yet. A flag set to false
// hides the UI from students without deleting the code or any saved values, so a feature can be
// switched back on once it does something real.

export const features = {
  notifications: false, // top-bar bell: no notification system exists yet
  globalSearch: false, // top-bar search field: not wired to anything yet
  aiAssistant: false, // AI Assistant module and the "AI Assistant" tab inside Load Analysis (fixed preview text)
  aiCall: false, // "AI Call" tab / "AI-assisted call" note: locked placeholder
  callExtras: false, // waveform, mute, keypad, speaker: purely cosmetic, no effect on the simulation
  devTrackingControls: process.env.NODE_ENV !== "production", // "Skip to next event" for testing; never shown in production builds
  coins: false, // coins have no use yet (the saved value is kept)
  streak: false, // streak has no behaviour yet (the saved value is kept)
};
