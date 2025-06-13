// src/app/api/admin/whitelist/route.js - Whitelist Management API

import { auth } from "../../../../../auth.js";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma.js";

// Check if user is admin
async function checkAdminAccess(session) {
  if (!session?.user?.email) {
    return false;
  }

  const adminEmails = [
    "admin@youvit.co.id",
    "cto@youvit.co.id",
    // Add more admin emails here
  ];

  return adminEmails.includes(session.user.email.toLowerCase());
}

// Get current whitelist from database
async function getWhitelistFromDb() {
  try {
    // For now, we'll store in a simple config table
    // You might want to create a proper whitelist table
    const config = await prisma.user.findFirst({
      where: { email: "system@youvit.co.id" }, // System user to store config
      select: { id: true },
    });

    // If no system config, return empty array
    if (!config) {
      return [];
    }

    // For now, return from env variable
    // In production, implement proper database storage
    const whitelist = process.env.EXTERNAL_EMAIL_WHITELIST || "";
    return whitelist
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0);
  } catch (error) {
    console.error("Error getting whitelist from database:", error);
    return [];
  }
}

// GET /api/admin/whitelist - Get current whitelist
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await checkAdminAccess(session);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const whitelist = await getWhitelistFromDb();

    return NextResponse.json({
      success: true,
      whitelist,
      total: whitelist.length,
      message: "Current whitelist retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting whitelist:", error);
    return NextResponse.json(
      { error: "Failed to get whitelist" },
      { status: 500 }
    );
  }
}

// POST /api/admin/whitelist - Add email to whitelist
export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await checkAdminAccess(session);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if it's a company email (shouldn't be in whitelist)
    if (cleanEmail.endsWith("@youvit.co.id")) {
      return NextResponse.json(
        { error: "Company emails don't need to be whitelisted" },
        { status: 400 }
      );
    }

    const currentWhitelist = await getWhitelistFromDb();

    if (currentWhitelist.includes(cleanEmail)) {
      return NextResponse.json(
        { error: "Email already in whitelist" },
        { status: 409 }
      );
    }

    // Add to whitelist
    const updatedWhitelist = [...currentWhitelist, cleanEmail];

    // Log the action
    console.log(
      `👤 Admin ${session.user.email} added ${cleanEmail} to whitelist`
    );

    // In production, you'd update the database here
    // For now, just return success with instructions
    return NextResponse.json({
      success: true,
      message: `Email ${cleanEmail} added to whitelist`,
      newWhitelist: updatedWhitelist,
      total: updatedWhitelist.length,
      instruction: "Update EXTERNAL_EMAIL_WHITELIST in .env and restart server",
    });
  } catch (error) {
    console.error("Error adding to whitelist:", error);
    return NextResponse.json(
      { error: "Failed to add email to whitelist" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/whitelist - Remove email from whitelist
export async function DELETE(request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await checkAdminAccess(session);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const currentWhitelist = await getWhitelistFromDb();

    if (!currentWhitelist.includes(cleanEmail)) {
      return NextResponse.json(
        { error: "Email not found in whitelist" },
        { status: 404 }
      );
    }

    // Remove from whitelist
    const updatedWhitelist = currentWhitelist.filter((e) => e !== cleanEmail);

    // Log the action
    console.log(
      `👤 Admin ${session.user.email} removed ${cleanEmail} from whitelist`
    );

    return NextResponse.json({
      success: true,
      message: `Email ${cleanEmail} removed from whitelist`,
      newWhitelist: updatedWhitelist,
      total: updatedWhitelist.length,
      instruction: "Update EXTERNAL_EMAIL_WHITELIST in .env and restart server",
    });
  } catch (error) {
    console.error("Error removing from whitelist:", error);
    return NextResponse.json(
      { error: "Failed to remove email from whitelist" },
      { status: 500 }
    );
  }
}
