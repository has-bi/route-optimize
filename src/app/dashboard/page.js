// src/app/dashboard/page.js - Enhanced Dashboard with Saved Routes

import { auth, signOut } from "../../../auth.js";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma.js";
import RouteList from "../../components/route/RouteList.js";

// Helper function to ensure user exists
async function ensureUserExists(session) {
  if (!session?.user?.email) {
    throw new Error("No user email in session");
  }

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
  }

  return user;
}

// Get user's routes
async function getUserRoutes(userId) {
  try {
    const routes = await prisma.route.findMany({
      where: { userId },
      include: {
        stores: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return routes;
  } catch (error) {
    console.error("Error fetching user routes:", error);
    return [];
  }
}

// Get route statistics
function getRouteStats(routes) {
  const total = routes.length;
  const draft = routes.filter((r) => r.status === "DRAFT").length;
  const optimized = routes.filter((r) => r.status === "OPTIMIZED").length;
  const completed = routes.filter((r) => r.status === "COMPLETED").length;

  const totalStores = routes.reduce(
    (sum, route) => sum + route.stores.length,
    0
  );
  const recentRoutes = routes.filter((route) => {
    const routeDate = new Date(route.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return routeDate > weekAgo;
  }).length;

  return {
    total,
    draft,
    optimized,
    completed,
    totalStores,
    recentRoutes,
  };
}

export default async function Dashboard() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  // Ensure user exists and get routes
  const user = await ensureUserExists(session);
  const routes = await getUserRoutes(user.id);
  const stats = getRouteStats(routes);

  // Split routes for display
  const recentRoutes = routes.slice(0, 5); // Show last 5 routes
  const hasMoreRoutes = routes.length > 5;

  return (
    <div className="container-mobile py-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">
              Selamat datang, {session.user?.name || "User"}
            </p>
            <p className="text-xs text-gray-400">{session.user?.email}</p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/auth/signin" });
            }}
          >
            <button
              type="submit"
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm transition-colors"
            >
              Logout
            </button>
          </form>
        </div>
      </header>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Rute</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {stats.recentRoutes} dibuat minggu ini
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Toko</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.totalStores}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Dalam {stats.total} rute
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4">
          <a
            href="/dashboard/create"
            className="block w-full touch-target bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center py-4 font-medium transition-colors"
          >
            <div className="flex items-center justify-center gap-2">
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Buat Rute Baru
            </div>
          </a>

          {hasMoreRoutes && (
            <a
              href="/dashboard/routes"
              className="block w-full touch-target bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-center py-3 font-medium transition-colors"
            >
              <div className="flex items-center justify-center gap-2">
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                Lihat Semua Rute ({routes.length})
              </div>
            </a>
          )}
        </div>
      </div>

      {/* Status Overview */}
      {stats.total > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Status Overview</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-gray-100 rounded-lg p-3 mb-2">
                <p className="text-lg font-bold text-gray-700">{stats.draft}</p>
              </div>
              <p className="text-sm text-gray-600">Draft</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-lg p-3 mb-2">
                <p className="text-lg font-bold text-blue-700">
                  {stats.optimized}
                </p>
              </div>
              <p className="text-sm text-gray-600">Dioptimalkan</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-lg p-3 mb-2">
                <p className="text-lg font-bold text-green-700">
                  {stats.completed}
                </p>
              </div>
              <p className="text-sm text-gray-600">Selesai</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Routes */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {routes.length === 0 ? "Rute Tersimpan" : `Rute Terbaru`}
          </h2>
          {hasMoreRoutes && (
            <a
              href="/dashboard/routes"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Lihat Semua →
            </a>
          )}
        </div>

        {routes.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Belum ada rute
            </h3>
            <p className="text-gray-500 mb-6">
              Mulai dengan membuat rute pertama Anda untuk mengoptimalkan
              kunjungan toko
            </p>
            <a
              href="/dashboard/create"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
            >
              + Buat Rute Pertama
            </a>
          </div>
        ) : (
          <RouteList routes={recentRoutes} showAll={false} />
        )}
      </div>

      {/* Development Info */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="font-medium text-blue-800 mb-2">
            🔧 Development Info
          </h3>
          <div className="text-xs text-blue-700 space-y-1">
            <p>
              <strong>User ID:</strong> {user.id}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Total Routes:</strong> {routes.length}
            </p>
            <p>
              <strong>Recent Routes Shown:</strong> {Math.min(5, routes.length)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
