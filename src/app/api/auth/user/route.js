import { auth } from "../../../../../auth.js";
import { prisma } from "../../../../lib/prisma.js";
import { NextResponse } from "next/server";

// POST /api/auth/user - Create or update user after successful OAuth
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { email, name, image } = session.user;

    // Create or update user in database
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        image,
        updatedAt: new Date(),
      },
      create: {
        email,
        name,
        image,
        emailVerified: new Date(),
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error creating/updating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
