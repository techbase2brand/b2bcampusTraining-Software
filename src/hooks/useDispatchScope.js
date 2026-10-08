"use client";

import { useCallback } from "react";
import { useGameProgress } from "./useGameProgress";
import { getDispatchBySlug, projectDispatchState } from "@/lib/dispatchRecords";

// Scopes a mission hook to ONE dispatch (the slug in the URL). `state` is the flat, engine-shaped
// view of that dispatch, and `update(patch)` writes the engine's patch back to that dispatch by slug
// (rewards go to the global state through the ledger). The mission hooks use it exactly like
// useGameProgress(), so the engines themselves are unchanged.
export function useDispatchScope(slug) {
  const { state: global, updateDispatch } = useGameProgress();
  const record = global ? getDispatchBySlug(global, slug) : null;
  const state = global && record ? projectDispatchState(global, record) : global;
  const update = useCallback((patch) => updateDispatch(slug, patch), [slug, updateDispatch]);
  return { state, record, global, update, readOnly: Boolean(record?.completion?.isCompleted) };
}
