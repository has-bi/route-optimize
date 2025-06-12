// src/app/api/routes/[id]/route.js - Fixed Individual Route API

import { auth } from "../../../../../auth.js";
import { prisma } from "../../../../lib/prisma.js";
import { NextResponse } from "next/server";

// Helper function to ensure user exists
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

// GET /api/routes/[id] - Get specific route
export async function GET(request, { params }) {
  try {
    console.log("📋 GET specific route called");

    const session = await auth();
    if (!session?.user?.email) {
      console.log("❌ No authenticated user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ FIX: Await params in Next.js 15
    const { id: routeId } = await params;
    console.log("📍 Getting route ID:", routeId);

    // Ensure user exists
    const user = await ensureUserExists(session);

    const route = await prisma.route.findFirst({
      where: {
        id: routeId,
        userId: user.id,
      },
      include: {
        stores: {
          orderBy: [{ visitOrder: "asc" }, { storeName: "asc" }],
        },
      },
    });

    if (!route) {
      console.log("❌ Route not found or not owned by user");
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    console.log("✅ Route found with", route.stores.length, "stores");
    return NextResponse.json(route);
  } catch (error) {
    console.error("💥 Error fetching route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/routes/[id] - Delete route
export async function DELETE(request, { params }) {
  try {
    console.log("🗑️ DELETE route called");

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ FIX: Await params in Next.js 15
    const { id: routeId } = await params;
    console.log("🗑️ Deleting route ID:", routeId);

    // Ensure user exists
    const user = await ensureUserExists(session);

    // Delete route (stores will be deleted automatically due to cascade)
    const deletedRoute = await prisma.route.deleteMany({
      where: {
        id: routeId,
        userId: user.id,
      },
    });

    if (deletedRoute.count === 0) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    console.log("✅ Route deleted successfully");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("💥 Error deleting route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
