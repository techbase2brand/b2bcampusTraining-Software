// Resetting wipes ALL training progress, so it needs a deliberate confirmation: the student must
// type the word below. The reset itself is unchanged (gameStore.resetGameState).
export const RESET_WORD = "RESET";
export const isResetConfirmed = (typed) => String(typed ?? "").trim() === RESET_WORD;
