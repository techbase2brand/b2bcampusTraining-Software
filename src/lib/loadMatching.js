// Phase 4 answer key: hidden match score, decision band, question answers and reason checks.
// Everything is derived from the student's shortlist; no load IDs or "best" answers are stored.

import { simulationConfig } from "@/data/simulationConfig";
import { round2 } from "./text";

// Higher is better for every extractor (deadhead is negated).
const SCORE_METRICS = {
  allInRpm: (a) => a.allInRpm,
  profit: (a) => a.estimatedProfit,
  deadhead: (a) => -a.deadheadMiles,
  hosMargin: (a) => a.hosMarginMinutes,
};

const METRIC_LABELS = {
  allInRpm: "effective RPM",
  profit: "total margin",
  deadhead: "deadhead miles",
  hosMargin: "HOS margin",
};

// Phase 3 gates. A load failing any gate is not a valid Phase 4 candidate.
export const isValidCandidate = (a) => a.equipmentOk && a.weightOk && a.timingOk && a.hosOk;

// Min-max normalise each weighted factor across the valid candidates, then weight and sum (0-1).
// Loads that fail a gate are excluded before scoring.
export function scoreLoads(allAnalyses) {
  const analyses = allAnalyses.filter(isValidCandidate);
  const weights = simulationConfig.matchScoreWeights;
  const rows = analyses.map((a) => ({ loadId: a.loadId, score: 0, parts: {} }));

  for (const [key, weight] of Object.entries(weights)) {
    const extract = SCORE_METRICS[key];
    if (!extract) throw new Error(`Unknown match score metric: ${key}`);
    const values = analyses.map(extract);
    const min = Math.min(...values);
    const max = Math.max(...values);
    analyses.forEach((a, i) => {
      const normalised = max === min ? 1 : (extract(a) - min) / (max - min);
      rows[i].parts[key] = round2(normalised);
      rows[i].score += weight * normalised;
    });
  }

  return rows
    .map((r) => ({ ...r, score: round2(r.score) }))
    .sort((a, b) => b.score - a.score)
    .map((r, i) => ({ ...r, rank: i + 1, stars: scoreToStars(r.score) }));
}

export const scoreToStars = (score) => Math.max(1, Math.min(5, Math.round(1 + score * 4)));

export const getBestLoadId = (analyses) => scoreLoads(analyses)[0]?.loadId ?? null;

// A candidate set is "clear" when no two loads share a score (so rank order is unambiguous).
export function hasScoreTies(analyses) {
  const scores = scoreLoads(analyses).map((r) => r.score);
  return new Set(scores).size !== scores.length;
}

// Is there a clear winner? (gap between first and second place)
export function getScoreGap(analyses) {
  const ranked = scoreLoads(analyses);
  return ranked.length < 2 ? 1 : round2(ranked[0].score - ranked[1].score);
}

// "strong" = the top-ranked pick, "acceptable" = within the configured band, otherwise "review".
export function getDecisionBand(selectedId, analyses) {
  const ranked = scoreLoads(analyses);
  const top = ranked[0];
  const picked = ranked.find((r) => r.loadId === selectedId);
  if (!picked) return "review";
  if (picked.loadId === top.loadId) return "strong";
  return top.score - picked.score <= simulationConfig.decisionBands.acceptableWithin ? "acceptable" : "review";
}

// Where the selected load is weaker than the top-ranked load (for parameterised feedback).
export function getWeakMetrics(selectedId, analyses) {
  const candidates = analyses.filter(isValidCandidate);
  const best = candidates.find((a) => a.loadId === getBestLoadId(candidates));
  const picked = candidates.find((a) => a.loadId === selectedId);
  if (!best || !picked || best.loadId === picked.loadId) return [];
  return Object.keys(SCORE_METRICS)
    .filter((k) => SCORE_METRICS[k](picked) < SCORE_METRICS[k](best))
    .map((k) => METRIC_LABELS[k]);
}

// Answer key for a Phase 4 question. `loadIds` has more than one entry only when there is a tie.
export function resolveQuestionAnswer(question, analyses, targetLoadId = null) {
  const { metric, goal, kind } = question;
  if (kind === "value") {
    const target = analyses.find((a) => a.loadId === targetLoadId);
    return { loadIds: target ? [target.loadId] : [], value: target ? target[metric] : null };
  }
  const values = analyses.map((a) => a[metric]);
  const best = goal === "min" ? Math.min(...values) : Math.max(...values);
  return { loadIds: analyses.filter((a) => a[metric] === best).map((a) => a.loadId), value: best };
}

// Which of the student's chosen decision reasons are supported by the numbers?
// Informational reasons (always true for any valid candidate, e.g. compatible equipment) are
// confirmations only: they are reported separately and never scored as right or wrong.
export function evaluateDecisionReasons(selectedId, reasonIds, analyses, reasons) {
  const candidates = analyses.filter(isValidCandidate);
  const picked = candidates.find((a) => a.loadId === selectedId);
  const supported = [];
  const unsupported = [];
  const informational = [];
  for (const id of reasonIds) {
    const reason = reasons.find((r) => r.id === id);
    if (reason?.informational) {
      informational.push(id);
      continue;
    }
    if (!picked || !reason || reason.misleading || !reason.evidence) {
      unsupported.push(id);
      continue;
    }
    const { metric, goal } = reason.evidence;
    const values = candidates.map((a) => a[metric]);
    const best = goal === "min" ? Math.min(...values) : Math.max(...values);
    (picked[metric] === best ? supported : unsupported).push(id);
  }
  return { supported, unsupported, informational };
}
