// src/lib/utils.js - Utility functions with error handling
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
}

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

export function calculateDistance(point1, point2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
      Math.cos((point2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

// Graceful error handling wrapper
export async function withErrorHandling(fn, errorMessage) {
  try {
    return await fn();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    throw new Error(errorMessage);
  }
}
