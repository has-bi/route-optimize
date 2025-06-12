// src/app/api/routes/[id]/optimize/route.js - Fixed Optimization API

import { auth } from "../../../../../../auth.js";
import { prisma } from "../../../../../lib/prisma.js";
import { NextResponse } from "next/server";
import { optimizeRoute } from "../../../../../lib/route-optimizer.js";

// Helper function to ensure user exists (consistent with other APIs)
async function ensureUserExists(session) {
  if (!session?.user?.email) {
    throw new Error("No user email in session");
  }

  let user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: session.user.email,
        name: session.user.name || null,
        image: session.user.image || null,
        emailVerified: new Date(),
      },
    });
  }

  return user;
}

// POST /api/routes/[id]/optimize - Optimize route algorithm
export async function POST(request, { params }) {
  try {
    console.log("🚀 Route optimization API called");

    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      console.log("❌ No authenticated user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ FIX: Await params in Next.js 15
    const resolvedParams = await params;
    const routeId = resolvedParams.id;
    console.log("📋 Optimizing route ID:", routeId);

    // Ensure user exists and get database user
    const user = await ensureUserExists(session);
    console.log("👤 User ID:", user.id);

    // Get route with stores using database user ID
    const route = await prisma.route.findFirst({
      where: {
        id: routeId,
        userId: user.id, // Use database user ID
      },
      include: {
        stores: true,
      },
    });

    if (!route) {
      console.log("❌ Route not found or not owned by user");
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    if (route.status !== "DRAFT") {
      console.log("❌ Route already optimized, status:", route.status);
      return NextResponse.json(
        { error: "Route already optimized" },
        { status: 400 }
      );
    }

    console.log(`📊 Route has ${route.stores.length} stores to optimize`);

    // Validate route data before optimization
    if (!route.startingPoint || !route.departureTime) {
      console.log(
        "❌ Invalid route data - missing starting point or departure time"
      );
      return NextResponse.json(
        { error: "Invalid route data" },
        { status: 400 }
      );
    }

    if (route.stores.length === 0) {
      console.log("❌ No stores to optimize");
      return NextResponse.json(
        { error: "No stores to optimize" },
        { status: 400 }
      );
    }

    // Validate store data
    for (const store of route.stores) {
      if (!store.coordinates || !store.storeName) {
        console.log("❌ Invalid store data:", store.id);
        return NextResponse.json(
          {
            error: `Invalid store data for ${
              store.storeName || "unnamed store"
            }`,
          },
          { status: 400 }
        );
      }
    }

    console.log("⚙️ Running optimization algorithm...");
    console.log("Starting point:", route.startingPoint);
    console.log("Departure time:", route.departureTime);

    // Run optimization algorithm
    const optimization = optimizeRoute(
      route.startingPoint,
      route.departureTime,
      route.stores
    );

    console.log("✅ Optimization complete");
    console.log("Results:", {
      visitedStores: optimization.summary.visitedStores,
      unreachableStores: optimization.summary.unreachableStores,
      totalDistance: optimization.summary.totalDistance,
      completionTime: optimization.summary.completionTime,
    });

    console.log("💾 Updating database...");

    // Update route and stores in database transaction
    const updatedRoute = await prisma.$transaction(async (tx) => {
      // Update route status and summary
      await tx.route.update({
        where: { id: route.id },
        data: {
          status: "OPTIMIZED",
          totalDistance: optimization.summary.totalDistance,
          totalTime: optimization.summary.totalTime,
          completionTime: optimization.summary.completionTime,
        },
      });

      // Update all stores with optimization results
      for (const optimizedStore of optimization.optimizedStores) {
        await tx.routeStore.update({
          where: { id: optimizedStore.id },
          data: {
            visitOrder: optimizedStore.visitOrder,
            status: optimizedStore.status,
            arrivalTime: optimizedStore.arrivalTime,
            departTime: optimizedStore.departTime,
            mapsUrl: optimizedStore.mapsUrl,
          },
        });
      }

      // Return updated route with stores
      return await tx.route.findFirst({
        where: { id: route.id },
        include: {
          stores: {
            orderBy: [{ visitOrder: "asc" }, { storeName: "asc" }],
          },
        },
      });
    });

    console.log("💾 Database updated successfully");

    return NextResponse.json({
      success: true,
      route: updatedRoute,
      optimization: {
        summary: optimization.summary,
        visitedStores: optimization.optimizedStores.filter(
          (s) => s.status === "VISITED"
        ).length,
        unreachableStores: optimization.optimizedStores.filter(
          (s) => s.status === "UNREACHABLE"
        ).length,
      },
    });
  } catch (error) {
    console.error("💥 Error optimizing route:", error);

    // Return detailed error for debugging
    return NextResponse.json(
      {
        error: "Failed to optimize route",
        details:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
