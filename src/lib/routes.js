// Where a signed-in student should land.
export function homeFor(state) {
  return state.onboardingCompleted ? "/home" : "/onboarding";
}
