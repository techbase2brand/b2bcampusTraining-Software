// Distance helpers. The single source of "how far is it" for radius filters, deadhead and ETAs.

import { simulationConfig } from "@/data/simulationConfig";

const EARTH_RADIUS_MILES = 3958.8;
const rad = (deg) => (deg * Math.PI) / 180;

export function straightLineMiles(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

// Approximate road miles (whole miles). Used everywhere distance between two locations is needed.
export function roadMiles(a, b) {
  return Math.round(straightLineMiles(a, b) * simulationConfig.roadCircuityFactor);
}

export function driveMinutesForMiles(miles) {
  return Math.round((miles / simulationConfig.averageSpeedMph) * 60);
}
