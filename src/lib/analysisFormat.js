// Display formatting for Phase 4 metric values. `format` names come from the comparison rows in
// data/phase4Missions.js.

import { formatCurrency, formatDuration } from "./text";

export function formatMetric(format, value) {
  switch (format) {
    case "currency":
      return formatCurrency(value);
    case "currencyPerMile":
      return `$${value.toFixed(2)}`;
    case "miles":
      return `${Math.round(value).toLocaleString("en-US")} mi`;
    case "duration":
      return formatDuration(value);
    default:
      return String(value);
  }
}
