// src/app/dashboard/routes/[id]/page.js - COMPLETE REPLACEMENT

import { auth } from "../../../../../auth.js";
import { redirect } from "next/navigation";
import { prisma } from "../../../../lib/prisma.js";
import RouteDetail from "../../../../components/route/RouteDetail.js";
import { Link } from "lucide-react";

// Ensure user exists in database (same logic as API routes)
async function ensureUserExists(session) {
  if (!session?.user?.email) {
    throw new Error("No user email in session");
  }

  try {
    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

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
      console.log("✅ User found with ID:", user.id);
    }

    return user;
  } catch (error) {
    console.error("💥 Error ensuring user exists:", error);
    throw error;
  }
}

// Get route with proper user validation
async function getRoute(routeId, userId) {
  try {
    console.log("🔍 Fetching route:", routeId, "for user:", userId);

    const route = await prisma.route.findFirst({
      where: {
        id: routeId,
        userId: userId, // Use database user ID
      },
      include: {
        stores: {
          orderBy: [{ visitOrder: "asc" }, { storeName: "asc" }],
        },
      },
    });

    if (route) {
      console.log("✅ Route found:", {
        id: route.id,
        status: route.status,
        storesCount: route.stores.length,
        userId: route.userId,
      });
    } else {
      console.log("❌ Route not found or not owned by user");
    }

    return route;
  } catch (error) {
    console.error("💥 Error fetching route:", error);
    return null;
  }
}

// ✅ MAIN FIX: Properly await params and use database user ID
export default async function RouteDetailPage({ params }) {
  try {
    console.log("📋 Route detail page loading...");

    // Check authentication
    const session = await auth();
    if (!session) {
      console.log("❌ No session found, redirecting to signin");
      redirect("/auth/signin");
    }

    // ✅ CRITICAL FIX: Await params before using
    const resolvedParams = await params;
    const routeId = resolvedParams.id;
    console.log("📍 Route ID from params:", routeId);

    // ✅ CRITICAL FIX: Get database user (not session user)
    const user = await ensureUserExists(session);
    console.log("👤 Database user ID:", user.id);

    // Get the route using database user ID
    const route = await getRoute(routeId, user.id);

    if (!route) {
      console.log("❌ Route not found, redirecting to dashboard");
      redirect("/dashboard");
    }

    console.log("🎯 Route detail page ready to render");

    return (
      <div className="container-mobile py-6">
        <header className="mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Detail Rute</h1>
              <p className="text-gray-600">
                {new Date(route.routeDate).toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </header>

        {/* Debug info in development */}
        {process.env.NODE_ENV === "development" && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
            <p>
              <strong>Debug Info:</strong>
            </p>
            <p>Route ID: {route.id}</p>
            <p>Status: {route.status}</p>
            <p>Stores: {route.stores.length}</p>
            <p>User: {user.email}</p>
          </div>
        )}

        <RouteDetail route={route} />
      </div>
    );
  } catch (error) {
    console.error("💥 Critical error in route detail page:", error);

    // Error fallback page
    return (
      <div className="container-mobile py-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            ⚠️ Error Loading Route
          </h2>
          <p className="text-red-700 mb-4">
            There was an error loading this route. This might be due to:
          </p>
          <ul className="text-red-700 mb-4 text-sm list-disc list-inside">
            <li>The route doesn't exist</li>
            <li>You don't have permission to view this route</li>
            <li>A technical error occurred</li>
          </ul>

          {process.env.NODE_ENV === "development" && (
            <details className="mb-4">
              <summary className="cursor-pointer text-red-800 font-medium">
                Technical Details (Development Only)
              </summary>
              <pre className="mt-2 p-3 bg-red-100 rounded text-xs overflow-auto">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              ← Back to Dashboard
            </Link>
            <Link
              href="/dashboard/create"
              className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              + Create New Route
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
