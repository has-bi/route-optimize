// src/lib/route-optimizer.js - Fixed Route Optimization Algorithm

/**
 * Calculate distance between two points using Haversine formula
 * @param {Object} point1 - {lat, lng}
 * @param {Object} point2 - {lat, lng}
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(point1, point2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
      Math.cos((point2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Parse coordinate string to lat/lng object
 * @param {string} coordinates - "lat,lng" format
 * @returns {Object} {lat, lng}
 */
export function parseCoordinates(coordinates) {
  try {
    const [lat, lng] = coordinates.split(",").map(Number);
    if (isNaN(lat) || isNaN(lng)) {
      throw new Error("Invalid coordinates format");
    }
    return { lat, lng };
  } catch (error) {
    throw new Error(`Failed to parse coordinates: ${coordinates}`);
  }
}

/**
 * Convert time string to minutes since midnight
 * @param {string} timeString - "HH:MM" format
 * @returns {number} Minutes since midnight
 */
export function timeToMinutes(timeString) {
  const [hours, mins] = timeString.split(":").map(Number);
  return hours * 60 + mins;
}

/**
 * Convert minutes to formatted time string
 * @param {number} minutes - Minutes since midnight
 * @returns {string} "H:MM AM/PM" format
 */
export function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
}

/**
 * Generate Google Maps navigation URL
 * @param {Object} from - {lat, lng}
 * @param {Object} to - {lat, lng}
 * @returns {string} Google Maps URL
 */
export function generateMapsUrl(from, to) {
  return `https://www.google.com/maps/dir/${from.lat},${from.lng}/${to.lat},${to.lng}`;
}

/**
 * Main route optimization function
 * Uses distance-first greedy algorithm with priority weighting
 *
 * @param {string} startingPoint - "lat,lng" starting coordinates
 * @param {string} departureTime - "HH:MM" departure time
 * @param {Array} stores - Array of store objects
 * @returns {Object} Optimization results
 */
export function optimizeRoute(startingPoint, departureTime, stores) {
  console.log("🚀 Starting route optimization...");
  console.log("Starting point:", startingPoint);
  console.log("Departure time:", departureTime);
  console.log("Number of stores:", stores.length);

  // Constants
  const WORK_START = 9 * 60; // 09:00 in minutes
  const WORK_END = 17 * 60; // 17:00 in minutes
  const LUNCH_START = 12 * 60; // 12:00 in minutes
  const LUNCH_END = 13 * 60; // 13:00 in minutes
  const TRAVEL_TIME_PER_KM = 5; // 5 minutes per kilometer
  const BUFFER_TIME = 5; // 5 minutes for parking/walking

  // Initialize
  const start = parseCoordinates(startingPoint);
  let currentTime = timeToMinutes(departureTime);
  let currentPosition = start;
  let totalDistance = 0;
  let totalTime = 0;

  const optimizedStores = [];
  const remainingStores = [...stores];

  console.log("⚙️ Starting optimization loop...");

  // Greedy algorithm: always pick the nearest store considering priority
  while (remainingStores.length > 0) {
    let bestStore = null;
    let bestScore = Infinity;
    let bestIndex = -1;

    console.log(
      `🔍 Finding best store from ${remainingStores.length} remaining...`
    );

    // Find the best store based on distance and priority
    remainingStores.forEach((store, index) => {
      try {
        const storePos = parseCoordinates(store.coordinates);
        const distance = calculateDistance(currentPosition, storePos);

        // Priority scoring: A=1, B=2, C=3, D=4 (lower is better)
        const priorityScore = { A: 1, B: 2, C: 3, D: 4 }[store.priority] || 2;

        // Score = distance weight + priority weight
        const score = distance * 100 + priorityScore * 10;

        if (score < bestScore) {
          bestScore = score;
          bestStore = store;
          bestIndex = index;
        }
      } catch (error) {
        console.warn(
          `⚠️ Invalid coordinates for store ${store.storeName}:`,
          error.message
        );
      }
    });

    if (!bestStore) {
      console.log("❌ No valid stores remaining");
      break;
    }

    console.log(
      `📍 Best store found: ${bestStore.storeName} (Priority ${bestStore.priority})`
    );

    // Calculate travel time and arrival
    const storePos = parseCoordinates(bestStore.coordinates);
    const distance = calculateDistance(currentPosition, storePos);
    const travelTime = Math.ceil(distance * TRAVEL_TIME_PER_KM) + BUFFER_TIME;

    console.log(
      `📏 Distance: ${distance.toFixed(2)}km, Travel time: ${travelTime}min`
    );

    // Calculate arrival and departure times
    let arrivalTime = currentTime + travelTime;
    let departTime = arrivalTime + bestStore.visitTime;

    console.log(
      `⏰ Planned arrival: ${minutesToTime(
        arrivalTime
      )}, departure: ${minutesToTime(departTime)}`
    );

    // Handle lunch break (12:00 - 13:00)
    if (arrivalTime < LUNCH_END && departTime > LUNCH_START) {
      console.log("🍽️ Lunch break conflict detected, adjusting times...");

      if (arrivalTime < LUNCH_START) {
        // Can start before lunch, but extends into lunch
        departTime = LUNCH_END + (departTime - LUNCH_START);
      } else {
        // Starts during lunch, move to after lunch
        arrivalTime = LUNCH_END;
        departTime = LUNCH_END + bestStore.visitTime;
      }

      console.log(
        `⏰ Adjusted arrival: ${minutesToTime(
          arrivalTime
        )}, departure: ${minutesToTime(departTime)}`
      );
    }

    // Check if we can complete visit before work ends
    if (departTime > WORK_END) {
      console.log(
        `⏰ Store ${
          bestStore.storeName
        } unreachable - would finish at ${minutesToTime(departTime)}`
      );

      // Mark as unreachable
      optimizedStores.push({
        ...bestStore,
        visitOrder: null,
        status: "UNREACHABLE",
        arrivalTime: null,
        departTime: null,
        mapsUrl: null,
      });

      remainingStores.splice(bestIndex, 1);
      continue;
    }

    // Add to optimized route
    const visitOrder =
      optimizedStores.filter((s) => s.status === "VISITED").length + 1;
    const mapsUrl = generateMapsUrl(currentPosition, storePos);

    console.log(`✅ Adding store to route (order #${visitOrder})`);

    optimizedStores.push({
      ...bestStore,
      visitOrder,
      status: "VISITED",
      arrivalTime: minutesToTime(arrivalTime),
      departTime: minutesToTime(departTime),
      mapsUrl,
    });

    // Update current state
    totalDistance += distance;
    totalTime += travelTime + bestStore.visitTime;
    currentTime = departTime;
    currentPosition = storePos;

    // Remove from remaining stores
    remainingStores.splice(bestIndex, 1);
  }

  // Handle any remaining stores as unreachable
  remainingStores.forEach((store) => {
    console.log(
      `❌ Marking ${store.storeName} as unreachable (time constraint)`
    );
    optimizedStores.push({
      ...store,
      visitOrder: null,
      status: "UNREACHABLE",
      arrivalTime: null,
      departTime: null,
      mapsUrl: null,
    });
  });

  const visitedStores = optimizedStores.filter(
    (s) => s.status === "VISITED"
  ).length;
  const unreachableStores = optimizedStores.filter(
    (s) => s.status === "UNREACHABLE"
  ).length;

  console.log("🎯 Optimization complete!");
  console.log(
    `✅ Visited: ${visitedStores}, ❌ Unreachable: ${unreachableStores}`
  );
  console.log(`📏 Total distance: ${totalDistance.toFixed(2)}km`);
  console.log(`⏱️ Completion time: ${minutesToTime(currentTime)}`);

  return {
    optimizedStores,
    summary: {
      visitedStores,
      unreachableStores,
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalTime,
      completionTime: minutesToTime(currentTime),
    },
    unreachableStores: optimizedStores.filter(
      (s) => s.status === "UNREACHABLE"
    ),
  };
}
