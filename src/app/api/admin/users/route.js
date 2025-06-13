// src/app/api/admin/users/route.js - User Management API

import { auth } from "../../../../../auth.js";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma.js";
import { getUserAccessInfo } from "../../../../../auth.js";

// Check if user is admin
async function checkAdminAccess(session) {
  if (!session?.user?.email) {
    return false;
  }

  const adminEmails = ["admin@youvit.co.id", "cto@youvit.co.id"];
  return adminEmails.includes(session.user.email.toLowerCase());
}

// GET /api/admin/users - Get all users with access info
export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 50;
    const search = searchParams.get("search") || "";
    const userType = searchParams.get("type") || "all";

    // Build where clause
    const where = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            routes: true,
            sessions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get total count
    const total = await prisma.user.count({ where });

    // Enhance with access info
    const usersWithAccess = await Promise.all(
      users.map(async (user) => {
        const accessInfo = await getUserAccessInfo(user.email);
        return {
          ...user,
          accessInfo,
          lastActivity: user._count.sessions > 0 ? "Active" : "Inactive",
        };
      })
    );

    // Filter by user type if specified
    let filteredUsers = usersWithAccess;
    if (userType !== "all") {
      filteredUsers = usersWithAccess.filter(
        (user) => user.accessInfo.userType === userType.toUpperCase()
      );
    }

    // Statistics
    const stats = {
      total: total,
      company: usersWithAccess.filter(
        (u) => u.accessInfo.userType === "COMPANY"
      ).length,
      external: usersWithAccess.filter(
        (u) => u.accessInfo.userType === "EXTERNAL"
      ).length,
      blocked: usersWithAccess.filter((u) => !u.accessInfo.allowed).length,
      totalRoutes: usersWithAccess.reduce((sum, u) => sum + u._count.routes, 0),
    };

    return NextResponse.json({
      success: true,
      users: filteredUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats,
      filters: {
        search,
        userType,
      },
    });
  } catch (error) {
    console.error("Error getting users:", error);
    return NextResponse.json({ error: "Failed to get users" }, { status: 500 });
  }
}

// POST /api/admin/users/bulk-action - Bulk actions on users
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

    const { action, userIds } = await request.json();

    if (!action || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "Valid action and userIds are required" },
        { status: 400 }
      );
    }

    let result = { success: false, message: "", affected: 0 };

    switch (action) {
      case "delete":
        // Delete users and their data
        const deleteResult = await prisma.user.deleteMany({
          where: {
            id: { in: userIds },
            // Prevent deleting admin users
            email: {
              notIn: ["admin@youvit.co.id", "cto@youvit.co.id"],
            },
          },
        });

        result = {
          success: true,
          message: `Deleted ${deleteResult.count} users`,
          affected: deleteResult.count,
        };

        console.log(
          `👤 Admin ${session.user.email} deleted ${deleteResult.count} users`
        );
        break;

      case "export":
        // Export user data (placeholder)
        const exportUsers = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: {
            email: true,
            name: true,
            createdAt: true,
            _count: { select: { routes: true } },
          },
        });

        result = {
          success: true,
          message: `Exported ${exportUsers.length} users`,
          affected: exportUsers.length,
          data: exportUsers,
        };
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error performing bulk action:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk action" },
      { status: 500 }
    );
  }
}
