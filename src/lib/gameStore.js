// The ONLY module that touches localStorage. Components use useGameProgress().
// Shaped as an external store (subscribe/getSnapshot) so it can later be swapped
// for API-backed persistence without changing consumers.

import { initialGameState } from "@/data/users";

const STORAGE_KEY = "b2b-dispatch-game-v1";
const listeners = new Set();
let cache; // undefined until first client read

function read() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...initialGameState, ...JSON.parse(raw) } : initialGameState;
  } catch {
    return initialGameState;
  }
}

function write(state) {
  cache = state;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable (private mode / quota): keep in-memory state only.
  }
  listeners.forEach((listener) => listener());
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot() {
  if (cache === undefined) cache = read();
  return cache;
}

// null on the server => consumers can tell "not hydrated yet".
export function getServerSnapshot() {
  return null;
}

export function updateGameState(patch) {
  write({ ...getSnapshot(), ...patch });
}

export function resetGameState() {
  write(initialGameState);
}
