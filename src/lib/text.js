// Small formatting helpers shared by the Phase 3/4 logic. No app data here.

export function fillTemplate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => (key in vars ? String(vars[key]) : `{${key}}`));
}

// Simulation times are local "YYYY-MM-DDTHH:mm" strings; parse and compare them consistently.
export function parseSimTime(value) {
  return new Date(value);
}

export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

export function formatSimTime(date) {
  return date.toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" });
}

// "Oct 12" from a sim time string.
export function formatSimDay(value) {
  return parseSimTime(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// "11:00 AM" from a sim time string.
export function formatSimClock(value) {
  return parseSimTime(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function formatCurrency(value) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

// "YYYY-MM-DD" part of a sim time string (sim clock only; never the real date).
export const simDateKey = (value) => value.slice(0, 10);

export function formatDuration(minutes) {
  const total = Math.round(Math.abs(minutes));
  const days = Math.floor(total / 1440);
  const hours = Math.floor((total % 1440) / 60);
  const mins = total % 60;
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${String(mins).padStart(2, "0")}m`;
}

export function round2(value) {
  return Math.round(value * 100) / 100;
}
