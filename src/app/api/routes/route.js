// src/app/api/routes/route.js - Fixed with User Creation

import { auth } from "../../../../auth.js";
import { prisma } from "../../../lib/prisma.js";
import { NextResponse } from "next/server";

// Helper function to ensure user exists in database
async function ensureUserExists(session) {
  if (!session?.user?.email) {
    throw new Error("No user email in session");
  }

  try {
    // Try to find existing user
    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    // If user doesn't exist, create them
    if (!user) {
      console.log("👤 Creating new user in database:", session.user.email);
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || null,
          image: session.user.image || null,
          emailVerified: new Date(),
        },
      });
      console.log("✅ User created with ID:", user.id);
    } else {
      console.log("✅ User already exists with ID:", user.id);
    }

    return user;
  } catch (error) {
    console.error("💥 Error ensuring user exists:", error);
    throw error;
  }
}

// GET /api/routes - Get user's routes
export async function GET(request) {
  try {
    console.log("📋 GET /api/routes called");

    const session = await auth();
    if (!session?.user?.email) {
      console.log("❌ No authenticated user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user exists in database
    const user = await ensureUserExists(session);

    console.log("👤 Fetching routes for user:", user.email);

    const routes = await prisma.route.findMany({
      where: { userId: user.id },
      include: {
        stores: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`✅ Found ${routes.length} routes`);
    return NextResponse.json(routes);
  } catch (error) {
    console.error("💥 Error fetching routes:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/routes - Create new route
export async function POST(request) {
  try {
    console.log("🚀 POST /api/routes called - Creating new route");

    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      console.log("❌ No authenticated user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("👤 Session user:", session.user.email);

    // Ensure user exists in database and get the database user
    const user = await ensureUserExists(session);

    // Parse request body
    let data;
    try {
      data = await request.json();
      console.log("📄 Request data received:", {
        routeDate: data.routeDate,
        startingPoint: data.startingPoint,
        departureTime: data.departureTime,
        storesCount: data.stores?.length || 0,
      });
    } catch (parseError) {
      console.error("❌ Failed to parse request JSON:", parseError);
      return NextResponse.json({ error: "Invalid JSON data" }, { status: 400 });
    }

    const { routeDate, startingPoint, departureTime, stores } = data;

    // Validate required fields
    if (!routeDate || !startingPoint || !departureTime || !stores?.length) {
      const missing = [];
      if (!routeDate) missing.push("routeDate");
      if (!startingPoint) missing.push("startingPoint");
      if (!departureTime) missing.push("departureTime");
      if (!stores?.length) missing.push("stores");

      console.log("❌ Missing required fields:", missing);
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // Simple coordinate validation
    const validateCoordinates = (coords) => {
      if (!coords || typeof coords !== "string") return false;
      const cleanCoords = coords.trim().replace(/\s+/g, ""); // Remove all spaces
      const parts = cleanCoords.split(",");
      if (parts.length !== 2) return false;
      const [lat, lng] = parts.map(Number);
      return (
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      );
    };

    // Clean starting point coordinates (remove spaces)
    const cleanStartingPoint = startingPoint.trim().replace(/\s+/g, "");
    if (!validateCoordinates(cleanStartingPoint)) {
      console.log("❌ Invalid starting point coordinates:", startingPoint);
      return NextResponse.json(
        { error: `Invalid starting point coordinates: ${startingPoint}` },
        { status: 400 }
      );
    }

    // Validate and clean store coordinates
    for (let i = 0; i < stores.length; i++) {
      const store = stores[i];

      if (!store.storeName?.trim()) {
        return NextResponse.json(
          { error: `Store ${i + 1}: Missing store name` },
          { status: 400 }
        );
      }

      // Clean coordinates for this store
      const cleanCoords = store.coordinates?.trim().replace(/\s+/g, "");
      if (!validateCoordinates(cleanCoords)) {
        return NextResponse.json(
          { error: `Store ${i + 1} (${store.storeName}): Invalid coordinates` },
          { status: 400 }
        );
      }

      // Update the store with cleaned coordinates
      store.coordinates = cleanCoords;
    }

    console.log("✅ All validation passed, creating route...");

    // Create route in database using the database user ID
    const route = await prisma.route.create({
      data: {
        userId: user.id, // Use database user ID, not session user ID
        routeDate: new Date(routeDate),
        startingPoint: cleanStartingPoint,
        departureTime: departureTime.trim(),
        status: "DRAFT",
        stores: {
          create: stores.map((store) => ({
            distributorId: store.distributorId?.trim() || null,
            storeName: store.storeName.trim(),
            coordinates: store.coordinates, // Already cleaned above
            priority: store.priority || "B",
            visitTime: parseInt(store.visitTime) || 30,
            status: "PENDING",
          })),
        },
      },
      include: {
        stores: true,
      },
    });

    console.log("✅ Route created successfully!");
    console.log(`📊 Route ID: ${route.id}, Stores: ${route.stores.length}`);

    return NextResponse.json(route, { status: 201 });
  } catch (error) {
    console.error("💥 Error creating route:", error);

    // Handle specific Prisma errors
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Duplicate route detected" },
        { status: 409 }
      );
    }

    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "User reference error - please refresh and try again" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create route",
        details:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      },
      { status: 500 }
    );
  }
}
