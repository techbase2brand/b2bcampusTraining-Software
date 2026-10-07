// JSDoc types for mission definitions and persisted runs.

/**
 * Persisted per-mission progress (same shape as Mission 01 `missionProgress`).
 * @typedef {Object} MissionRun
 * @property {string|null} missionId
 * @property {boolean} started
 * @property {boolean} completed
 * @property {number} currentTask
 * @property {string[]} completedTasks
 * @property {number} attempts
 * @property {number} hintsUsed
 * @property {number} xpEarned
 * @property {number} starsEarned
 */

/**
 * @typedef {Object} MissionTask
 * @property {string} id
 * @property {string} title
 * @property {string} instruction     may contain {placeholders}
 * @property {string} hint
 * @property {string} highlight       id matched by TaskHighlight / sidebar
 * @property {Object} [rule]          descriptor read by the phase engine
 * @property {Object} [question]      Phase 4 comparison question
 */

/**
 * @typedef {Object} Mission
 * @property {string} id
 * @property {number} levelId
 * @property {string} [phaseId]
 * @property {string} title
 * @property {string} intro
 * @property {string[]} objectives
 * @property {MissionTask[]} tasks
 */

export {};
