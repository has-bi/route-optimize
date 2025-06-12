// ===== FILE 1: ./src/app/api/routes/route.js =====
import { auth } from "../../../../auth.js";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// GET /api/routes - Get user's routes
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const routes = await prisma.route.findMany({
      where: { userId: session.user.id },
      include: {
        stores: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(routes);
  } catch (error) {
    console.error("Error fetching routes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/routes - Create new route
export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { routeDate, startingPoint, departureTime, stores } = data;

    // Validate input
    if (!routeDate || !startingPoint || !departureTime || !stores?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate coordinates format
    const validateCoordinates = (coords) => {
      const parts = coords.split(",");
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

    if (!validateCoordinates(startingPoint)) {
      return NextResponse.json(
        { error: "Invalid starting point coordinates" },
        { status: 400 }
      );
    }

    for (const store of stores) {
      if (!validateCoordinates(store.coordinates)) {
        return NextResponse.json(
          {
            error: `Invalid coordinates for store: ${store.storeName}`,
          },
          { status: 400 }
        );
      }
    }

    // Create route with stores
    const route = await prisma.route.create({
      data: {
        userId: session.user.id,
        routeDate: new Date(routeDate),
        startingPoint,
        departureTime,
        status: "DRAFT",
        stores: {
          create: stores.map((store) => ({
            storeName: store.storeName,
            coordinates: store.coordinates,
            priority: store.priority,
            visitTime: store.visitTime,
            status: "PENDING",
          })),
        },
      },
      include: {
        stores: true,
      },
    });

    return NextResponse.json(route, { status: 201 });
  } catch (error) {
    console.error("Error creating route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
