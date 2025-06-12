import { auth } from "../../../../../auth.js";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// GET /api/routes/[id] - Get specific route
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const route = await prisma.route.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        stores: {
          orderBy: { visitOrder: "asc" },
        },
      },
    });

    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    return NextResponse.json(route);
  } catch (error) {
    console.error("Error fetching route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/routes/[id] - Delete route
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.route.deleteMany({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

export function parseCoordinates(coordinates) {
  const [lat, lng] = coordinates.split(",").map(Number);
  return { lat, lng };
}

export function formatTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

export function addMinutesToTime(timeString, minutes) {
  const [hours, mins] = timeString.split(":").map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  return formatTime(totalMinutes % (24 * 60));
}

export function timeToMinutes(timeString) {
  const [hours, mins] = timeString.split(":").map(Number);
  return hours * 60 + mins;
}

export function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
}

export function optimizeRoute(startingPoint, departureTime, stores) {
  const start = parseCoordinates(startingPoint);
  let currentTime = timeToMinutes(departureTime);
  let currentPosition = start;
  let totalDistance = 0;
  let totalTime = 0;

  const optimizedStores = [];
  const remainingStores = [...stores];

  // Working hours: 09:00 - 17:00, lunch break: 12:00 - 13:00
  const WORK_END = 17 * 60; // 17:00 in minutes
  const LUNCH_START = 12 * 60; // 12:00 in minutes
  const LUNCH_END = 13 * 60; // 13:00 in minutes
  const TRAVEL_TIME_PER_KM = 5; // minutes
  const BUFFER_TIME = 5; // minutes for parking/walking

  while (remainingStores.length > 0) {
    let bestStore = null;
    let bestScore = Infinity;
    let bestIndex = -1;

    // Find nearest store with priority consideration
    remainingStores.forEach((store, index) => {
      const storePos = parseCoordinates(store.coordinates);
      const distance = calculateDistance(currentPosition, storePos);

      // Priority scoring: A=1, B=2, C=3, D=4
      const priorityScore = { A: 1, B: 2, C: 3, D: 4 }[store.priority];

      // Distance-first with priority weight
      const score = distance * 100 + priorityScore * 10;

      if (score < bestScore) {
        bestScore = score;
        bestStore = store;
        bestIndex = index;
      }
    });

    if (!bestStore) break;

    // Calculate travel time and arrival
    const storePos = parseCoordinates(bestStore.coordinates);
    const distance = calculateDistance(currentPosition, storePos);
    const travelTime = Math.ceil(distance * TRAVEL_TIME_PER_KM) + BUFFER_TIME;

    // Check if we can reach and complete visit before work ends
    const arrivalTime = currentTime + travelTime;
    const departTime = arrivalTime + bestStore.visitTime;

    // Check lunch break conflict
    const isLunchConflict =
      (arrivalTime >= LUNCH_START && arrivalTime < LUNCH_END) ||
      (departTime > LUNCH_START && departTime <= LUNCH_END);

    // Adjust for lunch break
    let adjustedArrivalTime = arrivalTime;
    let adjustedDepartTime = departTime;

    if (isLunchConflict) {
      if (arrivalTime < LUNCH_START) {
        // Can start before lunch, but extends into lunch
        adjustedDepartTime = LUNCH_END + (departTime - LUNCH_START);
      } else {
        // Starts during lunch, move to after lunch
        adjustedArrivalTime = LUNCH_END;
        adjustedDepartTime = LUNCH_END + bestStore.visitTime;
      }
    }

    if (adjustedDepartTime > WORK_END) {
      // Mark as unreachable and remove from remaining
      remainingStores.splice(bestIndex, 1);
      optimizedStores.push({
        ...bestStore,
        visitOrder: null,
        status: "UNREACHABLE",
        arrivalTime: null,
        departTime: null,
        mapsUrl: null,
      });
      continue;
    }

    // Add to optimized route
    totalDistance += distance;
    totalTime +=
      travelTime + bestStore.visitTime + (adjustedDepartTime - departTime);
    currentTime = adjustedDepartTime;
    currentPosition = storePos;

    // Generate Google Maps URL
    const prevLat = currentPosition.lat;
    const prevLng = currentPosition.lng;
    const mapsUrl = `https://www.google.com/maps/dir/${prevLat},${prevLng}/${storePos.lat},${storePos.lng}`;

    optimizedStores.push({
      ...bestStore,
      visitOrder:
        optimizedStores.filter((s) => s.status !== "UNREACHABLE").length + 1,
      status: "VISITED",
      arrivalTime: minutesToTime(adjustedArrivalTime),
      departTime: minutesToTime(adjustedDepartTime),
      mapsUrl: mapsUrl,
    });

    remainingStores.splice(bestIndex, 1);
  }

  return {
    optimizedStores,
    summary: {
      visitedStores: optimizedStores.filter((s) => s.status === "VISITED")
        .length,
      unreachableStores: optimizedStores.filter(
        (s) => s.status === "UNREACHABLE"
      ).length,
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalTime,
      completionTime: minutesToTime(currentTime),
    },
  };
}
