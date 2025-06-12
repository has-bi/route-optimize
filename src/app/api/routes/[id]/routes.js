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
