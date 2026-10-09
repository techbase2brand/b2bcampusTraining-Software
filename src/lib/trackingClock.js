// The tracker's real-time clock. Everything that depends on "now" reads it from here, so tests can
// fix the time and the rest of the code never calls Date.now() directly.

let override = null;

export const getNow = () => (override == null ? Date.now() : override);

// Tests only: pin the clock (ms since epoch), or pass null to use real time again.
export const setNow = (ms) => {
  override = ms;
};
