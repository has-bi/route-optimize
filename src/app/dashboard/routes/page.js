// src/app/dashboard/routes/page.js - Fixed Navigation Links

import { auth } from "../../../../auth.js";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma.js";
import RouteList from "../../../components/route/RouteList.js";
import Link from "next/link"; // ✅ FIXED: Correct import

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

// Get all user routes with search/filter
async function getAllRoutes(userId, searchParams) {
  try {
    const {
      search,
      status,
      sortBy = "createdAt",
      order = "desc",
    } = searchParams;

    const where = {
      userId,
      ...(status && status !== "all" && { status: status.toUpperCase() }),
      ...(search && {
        OR: [
          {
            stores: {
              some: { storeName: { contains: search, mode: "insensitive" } },
            },
          },
        ],
      }),
    };

    const routes = await prisma.route.findMany({
      where,
      include: {
        stores: true,
      },
      orderBy: { [sortBy]: order },
    });

    return routes;
  } catch (error) {
    console.error("Error fetching routes:", error);
    return [];
  }
}

export default async function AllRoutesPage({ searchParams }) {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  // Ensure user exists
  const user = await ensureUserExists(session);

  // Get search parameters
  const resolvedSearchParams = await searchParams;
  const routes = await getAllRoutes(user.id, resolvedSearchParams);

  // Get statistics
  const stats = {
    total: routes.length,
    draft: routes.filter((r) => r.status === "DRAFT").length,
    optimized: routes.filter((r) => r.status === "OPTIMIZED").length,
    completed: routes.filter((r) => r.status === "COMPLETED").length,
  };

  return (
    <div className="container-mobile py-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          {/* ✅ FIXED: Proper Link usage */}
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
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Semua Rute</h1>
            <p className="text-gray-600">{routes.length} rute tersimpan</p>
          </div>
          <Link
            href="/dashboard/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
          >
            + Buat Rute
          </Link>
        </div>

        {/* Quick Stats */}
        {routes.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-white p-3 rounded-lg shadow-sm border text-center">
              <p className="text-lg font-bold text-gray-700">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm border text-center">
              <p className="text-lg font-bold text-gray-600">{stats.draft}</p>
              <p className="text-xs text-gray-500">Draft</p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm border text-center">
              <p className="text-lg font-bold text-blue-600">
                {stats.optimized}
              </p>
              <p className="text-xs text-gray-500">Optimized</p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm border text-center">
              <p className="text-lg font-bold text-green-600">
                {stats.completed}
              </p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        )}
      </header>

      {/* Search and Filter Bar */}
      {routes.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <form method="GET" className="space-y-4">
            {/* Search Input */}
            <div>
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Cari Toko
              </label>
              <input
                type="text"
                id="search"
                name="search"
                placeholder="Nama toko..."
                defaultValue={resolvedSearchParams.search || ""}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={resolvedSearchParams.status || "all"}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Semua Status</option>
                  <option value="draft">Draft</option>
                  <option value="optimized">Dioptimalkan</option>
                  <option value="completed">Selesai</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="sortBy"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Urutkan
                </label>
                <select
                  id="sortBy"
                  name="sortBy"
                  defaultValue={resolvedSearchParams.sortBy || "createdAt"}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="createdAt">Tanggal Dibuat</option>
                  <option value="routeDate">Tanggal Rute</option>
                  <option value="totalDistance">Jarak</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
              >
                🔍 Cari & Filter
              </button>
              <Link
                href="/dashboard/routes"
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium transition-colors"
              >
                Reset
              </Link>
            </div>
          </form>
        </div>
      )}

      {/* Routes List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <RouteList routes={routes} showAll={true} />
        </div>
      </div>

      {/* Development Info */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="font-medium text-blue-800 mb-2">🔧 Debug Info</h3>
          <div className="text-xs text-blue-700 space-y-1">
            <p>
              <strong>User ID:</strong> {user.id}
            </p>
            <p>
              <strong>Total Routes:</strong> {routes.length}
            </p>
            <p>
              <strong>Search Params:</strong>{" "}
              {JSON.stringify(resolvedSearchParams)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
