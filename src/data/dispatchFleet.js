// Extra fleet for Phase 6 driver selection (API-style). Phase 2 keeps using trucks.js / drivers.js
// untouched; src/lib/dispatchRoster.js joins both into one roster. Each entry matches the shape of
// the existing truck/driver records (locationId -> locations.js, hosMinutes = remaining drive time).
//
// Selection traps (none is marked as such; the student has to read the data):
//   DRV-206  Dry Van, but far away with little HOS left
//   DRV-207  Dry Van, but on a break and unavailable
//   DRV-208  Dry Van, available and within reach: a second suitable driver
//   DRV-209  Reefer, already On Load and almost out of HOS (also the wrong equipment)
//   DRV-210  Flatbed, strong HOS but far away in Nashville (wrong equipment)

export const dispatchTrucks = [
  { id: "TRK-106", model: "International LT", equipment: "Dry Van", trailer: "53' Dry Van", location: "Oklahoma City, OK", locationId: "loc-oklahoma-city-ok", status: "Available", driverId: "DRV-206", capacity: "45,000 lbs / 26 pallets", maxWeightLbs: 45000 },
  { id: "TRK-107", model: "Mack Anthem", equipment: "Dry Van", trailer: "53' Dry Van", location: "Fort Worth, TX", locationId: "loc-fort-worth-tx", status: "Available", driverId: "DRV-207", capacity: "45,000 lbs / 26 pallets", maxWeightLbs: 45000 },
  { id: "TRK-108", model: "Volvo VNL 860", equipment: "Dry Van", trailer: "53' Dry Van", location: "Austin, TX", locationId: "loc-austin-tx", status: "Available", driverId: "DRV-208", capacity: "45,000 lbs / 26 pallets", maxWeightLbs: 45000 },
  { id: "TRK-109", model: "Volvo VNR 640", equipment: "Reefer", trailer: "53' Refrigerated Trailer", location: "Memphis, TN", locationId: "loc-memphis-tn", status: "On Load", driverId: "DRV-209", capacity: "43,000 lbs / 24 pallets", maxWeightLbs: 43000 },
  { id: "TRK-110", model: "Kenworth W990", equipment: "Flatbed", trailer: "48' Flatbed", location: "Nashville, TN", locationId: "loc-nashville-tn", status: "Available", driverId: "DRV-210", capacity: "48,000 lbs", maxWeightLbs: 48000 },
];

export const dispatchDrivers = [
  { id: "DRV-206", name: "Ryan Cooper", truckId: "TRK-106", location: "Oklahoma City, OK", dutyStatus: "On Duty", hosMinutes: 180, availability: "Available" },
  { id: "DRV-207", name: "Tasha Brown", truckId: "TRK-107", location: "Fort Worth, TX", dutyStatus: "On Break", hosMinutes: 420, availability: "Unavailable" },
  { id: "DRV-208", name: "Luis Ortega", truckId: "TRK-108", location: "Austin, TX", dutyStatus: "On Duty", hosMinutes: 420, availability: "Available" },
  { id: "DRV-209", name: "Andre Wallace", truckId: "TRK-109", location: "Memphis, TN", dutyStatus: "Driving", hosMinutes: 150, availability: "On Load" },
  { id: "DRV-210", name: "Brianna Cole", truckId: "TRK-110", location: "Nashville, TN", dutyStatus: "On Duty", hosMinutes: 660, availability: "Available" },
];
