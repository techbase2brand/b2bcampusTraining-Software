// One-time migration from the single-dispatch save format (schema 1) to the multi-dispatch format
// (schema 2). It is idempotent: it only runs for saves without schemaVersion 2, never creates a
// second dispatch when records already exist, and leaves the legacy fields in place (the dispatch
// projection simply overrides them), so nothing a student earned is lost.

import { OPS_KEYS, BUILDER_RESET, DISPATCH_MISSIONS, createDispatchSlug, freshOps, deriveStage, STAGES, nowIso } from "./dispatchRecords";
import { initialMissionProgress } from "@/data/users";

export const SCHEMA_VERSION = 2;

const clone = (v) => JSON.parse(JSON.stringify(v));

// Did the old single-dispatch flow leave operational progress that should become a dispatch?
export function hasLegacyOperationalState(state) {
  const runs = state.missionRuns ?? {};
  return Boolean(
    state.selectedBestLoadId || state.negotiatedLoadId || state.assignedLoadId || state.commsLoadId || state.dispatchLoadId || state.trackingLoadId || runs["mission-03"]?.started,
  );
}

// Everything the student has already been rewarded for (one-time XP / mission rewards).
export function seedLedger(state) {
  const tasks = [];
  const missions = [];
  for (const [id, run] of Object.entries(state.missionRuns ?? {})) {
    for (const t of run?.completedTasks ?? []) tasks.push(`${id}:${t}`);
    if (run?.completed) missions.push(id);
  }
  return { tasks, missions };
}

// `state` is the saved state merged over the defaults; `savedVersion` is the version found on disk.
export function migrateState(state, savedVersion, now = nowIso()) {
  if ((savedVersion ?? 1) >= SCHEMA_VERSION) return state;
  const next = { ...state, schemaVersion: SCHEMA_VERSION, trainingLedger: seedLedger(state) };
  if ((state.dispatches ?? []).length > 0 || !hasLegacyOperationalState(state)) return next;

  const ops = { ...freshOps() };
  for (const key of OPS_KEYS) if (key in state) ops[key] = clone(state[key]);
  const runs = Object.fromEntries(DISPATCH_MISSIONS.map((id) => [id, { ...initialMissionProgress, missionId: id, ...clone(state.missionRuns?.[id] ?? {}) }]));
  const finished = Boolean(runs["mission-06"].completed);
  let record = {
    id: globalThis.crypto?.randomUUID?.() ?? "dsp-legacy-0001",
    slug: createDispatchSlug(1),
    sequenceNumber: 1,
    createdAt: now,
    updatedAt: now,
    completedAt: finished ? now : null,
    workflowStage: STAGES.ANALYSIS,
    operationalStatus: "draft",
    ops,
    missionRuns: runs,
    completion: { isCompleted: finished },
    migratedFromLegacy: true,
  };
  record = { ...record, ...deriveStage(next, record) };
  // The old shortlist now lives in the dispatch, so the Load Board starts fresh.
  return { ...next, dispatches: [record], dispatchSeq: 1, activeDispatchSlug: record.slug, ...clone(BUILDER_RESET) };
}
