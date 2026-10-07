// Phase 3 mission logic. Task rules are descriptors in phase3Missions.js; this module interprets
// them against the applied filters, the student's revealed compatibility checks and shortlist.
// All results are derived from state + data: no load IDs or answers are hardcoded.

import { mission02 } from "@/data/phase3Missions";
import { taskXp } from "@/data/rewards";
import { simulationConfig } from "@/data/simulationConfig";
import { loads } from "@/data/loads";
import { fillTemplate } from "./text";
import { getTruckContext, checkLoadCompatibility, getCheckResults, validateShortlist } from "./loadRules";
import { getLocation, formatLocation } from "./loadSelectors";
import { matchesFilters, normalizeFilters } from "./loadFiltering";

const EMPTY_BOARD = { checks: {}, shortlistedLoadIds: [] };

export function getTaskVars(ctx = getTruckContext()) {
  return {
    truckEquipment: ctx.truck.equipment,
    truckLocation: formatLocation(ctx.truck.locationId),
    truckMaxWeight: ctx.truck.maxWeightLbs.toLocaleString("en-US"),
    shortlistMin: simulationConfig.shortlist.min,
    shortlistMax: simulationConfig.shortlist.max,
    driver: ctx.driver.name,
  };
}

// How many suitable loads do the given filters hide? (Used for a non-revealing warning.)
export function countHiddenValidLoads(filters, ctx = getTruckContext()) {
  const f = normalizeFilters(filters);
  return loads.filter((l) => checkLoadCompatibility(l, ctx).compatible && !matchesFilters(l, f)).length;
}

// Has the student revealed a check (one of `codes`) that actually FAILS for some load?
// Revealing a passing check on a suitable load does not count: the lesson is finding the problem.
export function revealedFailingCheck(codes, checks, ctx = getTruckContext()) {
  return loads.some((load) => {
    const revealed = checks[load.id] ?? [];
    return getCheckResults(load, ctx).some((r) => codes.includes(r.code) && r.passed === false && revealed.includes(r.code));
  });
}

// Returns { status: "complete" | "incorrect" | "pending", message?, notice? }.
export function evaluateTask(task, filters, { started, board = EMPTY_BOARD }, ctx = getTruckContext()) {
  const f = normalizeFilters(filters);
  const vars = getTaskVars(ctx);
  const fb = mission02.filterFeedback;

  switch (task.rule?.type) {
    case "navigate":
      // The student is on the Load Board with the mission running.
      return { status: started ? "complete" : "pending" };

    case "filter-equipment-matches-truck": {
      if (!f.equipmentTypes.length) return { status: "pending" };
      const wrong = f.equipmentTypes.filter((e) => e !== ctx.truck.equipment);
      if (!f.equipmentTypes.includes(ctx.truck.equipment)) {
        return { status: "incorrect", message: fillTemplate(fb.equipmentWrong, { ...vars, pickedEquipment: wrong.join(", ") }) };
      }
      if (wrong.length) {
        return { status: "incorrect", message: fillTemplate(fb.equipmentMixed, { ...vars, pickedEquipment: wrong.join(", ") }) };
      }
      return { status: "complete" };
    }

    case "filter-pickup-near-truck": {
      if (!f.pickupLocationId) return { status: "pending" };
      if (f.pickupLocationId !== ctx.truck.locationId) {
        const picked = getLocation(f.pickupLocationId);
        return { status: "incorrect", message: fillTemplate(fb.pickupWrongPlace, { ...vars, pickedCity: `${picked.city}, ${picked.state}` }) };
      }
      if (f.pickupRadiusMiles > task.rule.maxRadiusMiles) {
        return { status: "incorrect", message: fillTemplate(fb.pickupTooWide, { ...vars, pickedRadius: f.pickupRadiusMiles, maxRadius: task.rule.maxRadiusMiles }) };
      }
      const hidden = task.rule.warnWhenHidingValidLoads ? countHiddenValidLoads(f, ctx) : 0;
      return { status: "complete", notice: hidden ? fillTemplate(fb.hiddenValidLoads, { count: hidden }) : null };
    }

    case "check-weight": {
      // Done by using the correct weight rule: the truck's own limit as the filter, or by
      // revealing the weight check on a load that really is overweight.
      if (revealedFailingCheck(["weight"], board.checks, ctx)) return { status: "complete" };
      if (f.maxWeight === ctx.truck.maxWeightLbs) return { status: "complete" };
      if (f.maxWeight != null) {
        const key = f.maxWeight < ctx.truck.maxWeightLbs ? "weightTooLow" : "weightTooHigh";
        return { status: "incorrect", message: fillTemplate(fb[key], { ...vars, pickedWeight: f.maxWeight.toLocaleString("en-US") }) };
      }
      return { status: "pending" };
    }

    case "check-pickup-feasibility":
      return { status: revealedFailingCheck(task.rule.codes, board.checks, ctx) ? "complete" : "pending" };

    case "shortlist-valid":
      return { status: validateShortlist(board.shortlistedLoadIds, ctx).valid ? "complete" : "pending" };

    default:
      return { status: "pending" };
  }
}

export const successMessage = (taskId, vars) => {
  const template = mission02.successMessages[taskId];
  return template ? fillTemplate(template, vars) : null;
};

// Advance the mission through every task the current state satisfies, in order.
// `source`: "apply" (student changed filters) counts wrong attempts; other sources only advance.
// Returns { run, xp, message, completed }.
export function advanceMission({ run, filters, board = EMPTY_BOARD, xp, source }, ctx = getTruckContext()) {
  const vars = getTaskVars(ctx);
  let current = { ...run };
  let totalXp = xp;
  let message = null;
  const completed = [];

  while (current.started && !current.completed) {
    const task = mission02.tasks[current.currentTask];
    if (!task) break;
    const res = evaluateTask(task, filters, { started: current.started, board }, ctx);

    if (res.status === "complete") {
      const gained = taskXp[task.id] ?? 0;
      totalXp += gained;
      current = {
        ...current,
        completedTasks: [...current.completedTasks, task.id],
        currentTask: current.currentTask + 1,
        xpEarned: current.xpEarned + gained,
      };
      completed.push(task.id);
      message = { tone: "success", text: [successMessage(task.id, vars), res.notice].filter(Boolean).join(" ") };
      continue;
    }
    if (res.status === "incorrect" && source === "apply") {
      current = { ...current, attempts: current.attempts + 1 };
      message = { tone: "error", text: res.message };
    }
    break;
  }
  return { run: current, xp: totalXp, message, completed };
}

// The compatibility-check codes the student has revealed that fail, in teaching order.
const AGENT_FAIL_ORDER = ["equipment", "weight", "timing", "hos"];

// Training Agent line for the current board state. Never reveals a verdict the student has not
// uncovered: "valid" is shown only after all five checks were revealed and the load passes.
export function getAgentLine({ load, checks = {}, shortlistCount = 0 }, ctx = getTruckContext()) {
  const msgs = mission02.agentMessages;
  const vars = getTaskVars(ctx);

  if (load) {
    const revealed = checks[load.id] ?? [];
    const results = getCheckResults(load, ctx);
    const failing = AGENT_FAIL_ORDER.find((code) => revealed.includes(code) && results.find((r) => r.code === code)?.passed === false);
    if (failing) return fillTemplate(msgs[failing], vars);
    const allRevealed = results.every((r) => revealed.includes(r.code));
    if (allRevealed && checkLoadCompatibility(load, ctx).compatible) return msgs.valid;
    return msgs.reviewPrompt;
  }

  const { min, max } = simulationConfig.shortlist;
  if (shortlistCount >= max) return msgs.shortlistFull;
  if (shortlistCount >= min) return msgs.shortlistEnough;
  return msgs.noSelection;
}

// Shortlist button outcome for a load. Pure: returns what should happen, the hook applies it.
// { ok, reason: null | "full" | "incompatible", issues, message }
export function evaluateShortlistAttempt(load, shortlistedIds, ctx = getTruckContext()) {
  const fb = mission02.feedback;
  const vars = getTaskVars(ctx);
  const compat = checkLoadCompatibility(load, ctx);
  if (!compat.compatible) {
    return {
      ok: false,
      reason: "incompatible",
      issues: compat.issues,
      message: fillTemplate(fb.shortlistRejected, { reasons: compat.issues.map((i) => i.message).join(" ") }),
    };
  }
  if (shortlistedIds.length >= simulationConfig.shortlist.max) {
    return { ok: false, reason: "full", issues: [], message: fillTemplate(fb.shortlistTooMany, vars) };
  }
  return { ok: true, reason: null, issues: [], message: fb.shortlistAdded };
}

// Failing checks the student has already revealed for a load (drives the "issue found" tag).
export function getRevealedIssues(load, checks, ctx = getTruckContext()) {
  const revealed = checks[load.id] ?? [];
  return getCheckResults(load, ctx).filter((r) => r.passed === false && revealed.includes(r.code));
}
