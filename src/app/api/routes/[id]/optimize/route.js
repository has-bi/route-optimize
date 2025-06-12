// ===== FILE 1: ./src/app/api/routes/[id]/optimize/route.js =====
import { auth } from "../../../../../../auth.js";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { optimizeRoute } from "../../../../../lib/route-optimizer.js";

const prisma = new PrismaClient();

// POST /api/routes/[id]/optimize - Optimize route
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get route with stores
    const route = await prisma.route.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        stores: true,
      },
    });

    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    if (route.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Route already optimized" },
        { status: 400 }
      );
    }

    // Run optimization algorithm
    const optimization = optimizeRoute(
      route.startingPoint,
      route.departureTime,
      route.stores
    );

    // Update route and stores in database
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
            orderBy: { visitOrder: "asc" },
          },
        },
      });
    });

    return NextResponse.json({
      route: updatedRoute,
      optimization,
    });
  } catch (error) {
    console.error("Error optimizing route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
