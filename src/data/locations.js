// Reference cities (API-style). Loads and trucks point here by locationId.
// lat/lng feed distance and map-position helpers in src/lib/. mapPos is a % position
// on the stylized U.S. route preview (not geographic truth).

export const locations = [
  { id: "loc-dallas-tx", city: "Dallas", state: "TX", lat: 32.7767, lng: -96.797, mapPos: { x: 47, y: 70 } },
  { id: "loc-arlington-tx", city: "Arlington", state: "TX", lat: 32.7357, lng: -97.1081, mapPos: { x: 46, y: 70 } },
  { id: "loc-corsicana-tx", city: "Corsicana", state: "TX", lat: 32.0954, lng: -96.4689, mapPos: { x: 48, y: 74 } },
  { id: "loc-mineral-wells-tx", city: "Mineral Wells", state: "TX", lat: 32.8085, lng: -98.1128, mapPos: { x: 43, y: 69 } },
  { id: "loc-fort-worth-tx", city: "Fort Worth", state: "TX", lat: 32.7555, lng: -97.3308, mapPos: { x: 45, y: 70 } },
  { id: "loc-san-antonio-tx", city: "San Antonio", state: "TX", lat: 29.4241, lng: -98.4936, mapPos: { x: 45, y: 83 } },
  { id: "loc-houston-tx", city: "Houston", state: "TX", lat: 29.7604, lng: -95.3698, mapPos: { x: 51, y: 82 } },
  { id: "loc-austin-tx", city: "Austin", state: "TX", lat: 30.2672, lng: -97.7431, mapPos: { x: 47, y: 79 } },
  { id: "loc-oklahoma-city-ok", city: "Oklahoma City", state: "OK", lat: 35.4676, lng: -97.5164, mapPos: { x: 46, y: 60 } },
  { id: "loc-memphis-tn", city: "Memphis", state: "TN", lat: 35.1495, lng: -90.049, mapPos: { x: 61, y: 62 } },
  { id: "loc-nashville-tn", city: "Nashville", state: "TN", lat: 36.1627, lng: -86.7816, mapPos: { x: 67, y: 59 } },
  { id: "loc-atlanta-ga", city: "Atlanta", state: "GA", lat: 33.749, lng: -84.388, mapPos: { x: 72, y: 68 } },
  { id: "loc-miami-fl", city: "Miami", state: "FL", lat: 25.7617, lng: -80.1918, mapPos: { x: 79, y: 90 } },
  { id: "loc-chicago-il", city: "Chicago", state: "IL", lat: 41.8781, lng: -87.6298, mapPos: { x: 62, y: 38 } },
  { id: "loc-columbus-oh", city: "Columbus", state: "OH", lat: 39.9612, lng: -82.9988, mapPos: { x: 72, y: 46 } },
  { id: "loc-kansas-city-mo", city: "Kansas City", state: "MO", lat: 39.0997, lng: -94.5786, mapPos: { x: 52, y: 51 } },
  { id: "loc-denver-co", city: "Denver", state: "CO", lat: 39.7392, lng: -104.9903, mapPos: { x: 31, y: 48 } },
  { id: "loc-phoenix-az", city: "Phoenix", state: "AZ", lat: 33.4484, lng: -112.074, mapPos: { x: 20, y: 68 } },
  { id: "loc-little-rock-ar", city: "Little Rock", state: "AR", lat: 34.7465, lng: -92.2896, mapPos: { x: 56, y: 65 } },
];
