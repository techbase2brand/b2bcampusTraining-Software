// Time compression for the automatic tracker. The trip's own duration (computed once by
// lib/trackingEngine.js from distance, speed, HOS and delays) is NOT recalculated here: it is only
// converted to the real time a student waits.
//
//   realMinutes = simulationMinutes / simulationMinutesPerRealMinute      (default 12x)
//   60 simulation min = 5 real min,  120 = 10,  180 = 15
//
// A movement segment stores when it started (real ms). Progress is always derived from that stamp, so
// it survives refreshes, sleeping tabs and a closed browser.

import { simulationConfig } from "@/data/simulationConfig";

const scale = () => simulationConfig.trackingTimeScale;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

export function simMinutesToRealMs(simMinutes) {
  const { simulationMinutesPerRealMinute: k, maxRealMinutesPerSegment: cap } = scale();
  const ms = (simMinutes / k) * 60000;
  return cap == null ? ms : Math.min(ms, cap * 60000);
}

export const realMsToSimMinutes = (ms) => (ms / 60000) * scale().simulationMinutesPerRealMinute;

export const simMinutesBetween = (tl, fromStep, toStep) => Math.max(0, Math.round((tl.steps[toStep].time.getTime() - tl.steps[fromStep].time.getTime()) / 60000));

// A movement segment from one scripted step to the next. Static load data is never copied: only the
// numbers that describe this movement.
export function segmentFor(tl, fromStep, toStep, startedAt) {
  const durationSimMinutes = simMinutesBetween(tl, fromStep, toStep);
  return {
    fromStep,
    toStep,
    startedAt,
    startStatus: tl.steps[fromStep].status,
    durationSimMinutes,
    durationRealMs: Math.max(1000, Math.round(simMinutesToRealMs(durationSimMinutes))),
    startMiles: tl.steps[fromStep].remainingMiles,
    endMiles: tl.steps[toStep].remainingMiles,
  };
}

// 0..1 and never beyond: a finished segment sits exactly at its end.
export const segmentProgress = (segment, nowMs) => clamp((nowMs - segment.startedAt) / segment.durationRealMs, 0, 1);

// "08:42" for a countdown in milliseconds.
export function formatCountdown(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  return `${String(m).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
