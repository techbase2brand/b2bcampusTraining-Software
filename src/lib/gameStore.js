// The ONLY module that touches localStorage. Components use useGameProgress().
// Shaped as an external store (subscribe/getSnapshot) so it can later be swapped
// for API-backed persistence without changing consumers.

import { initialGameState } from "@/data/users";
import { applyScopedPatch, createDispatchFromShortlist, nowIso } from "./dispatchRecords";
import { migrateState } from "./dispatchMigration";

const STORAGE_KEY = "b2b-dispatch-game-v1";
const listeners = new Set();
let cache; // undefined until first client read

function read() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialGameState;
    const saved = JSON.parse(raw);
    const merged = { ...initialGameState, ...saved };
    // Older saves (no schemaVersion 2) become a multi-dispatch save once, then are persisted.
    if ((saved.schemaVersion ?? 1) >= initialGameState.schemaVersion) return merged;
    const migrated = migrateState(merged, saved.schemaVersion);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
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

// Apply an engine patch to ONE dispatch (by slug). Returns false when the dispatch is unknown or
// already completed (completed dispatches are read-only).
export function updateDispatch(slug, patch) {
  const out = applyScopedPatch(getSnapshot(), slug, patch, nowIso());
  if (!out) return false;
  write({ ...getSnapshot(), ...out });
  return true;
}

// Create a dispatch from the Load Board shortlist and reset the builder in the same write, only
// after the record was built successfully. Returns { ok, slug } or { ok: false, message }.
export function createDispatch(shortlistIds) {
  const res = createDispatchFromShortlist(getSnapshot(), shortlistIds, nowIso());
  if (!res.ok) return res;
  write({ ...getSnapshot(), ...res.patch });
  return { ok: true, slug: res.slug };
}

export function resetGameState() {
  write(initialGameState);
}
