"use client";

import { useSyncExternalStore } from "react";
import {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  updateGameState,
  updateDispatch,
  createDispatch,
  resetGameState,
} from "@/lib/gameStore";

// Returns { state, ready, update, reset }.
// `ready` is false during SSR/hydration; guard redirects and persisted UI on it.
export function useGameProgress() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    state,
    ready: state !== null,
    update: updateGameState,
    updateDispatch,
    createDispatch,
    reset: resetGameState,
  };
}
