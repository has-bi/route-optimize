// src/app/dashboard/page.js - Enhanced Simple & Senior-Friendly Dashboard

import { auth, signOut } from "../../../auth.js";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma.js";
import { Link } from "lucide-react";

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

// Simple Route Card Component
function SimpleRouteCard({ route }) {
  const getStatusColor = (status) => {
    const colors = {
      DRAFT: "bg-gray-100 text-gray-800",
      OPTIMIZED: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
    };
    return colors[status] || colors.DRAFT;
  };

  const getStatusLabel = (status) => {
    const labels = {
      DRAFT: "Belum Dioptimalkan",
      OPTIMIZED: "Siap Dikunjungi",
      COMPLETED: "Selesai",
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Baru saja";
    if (diffInHours < 24) return `${diffInHours} jam lalu`;
    if (diffInHours < 48) return "Kemarin";
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} hari lalu`;
    return formatDate(dateString);
  };

  return (
    <Link
      href={`/dashboard/routes/${route.id}`}
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">
          Rute {formatDate(route.routeDate)}
        </h3>
        <div
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
            route.status
          )}`}
        >
          {getStatusLabel(route.status)}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <svg
              className="w-4 h-4"
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
            {route.stores.length} toko
          </span>
          <span className="flex items-center gap-1">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {route.departureTime}
          </span>
        </div>
        <span className="text-xs">{getTimeAgo(route.createdAt)}</span>
      </div>

      {/* Route Status Details */}
      {route.status === "OPTIMIZED" && (
        <div className="bg-blue-50 rounded p-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-blue-700">
              ✅ {route.stores.filter((s) => s.status === "VISITED").length}{" "}
              dikunjungi
            </span>
            {route.totalDistance && (
              <span className="text-blue-700 font-medium">
                📏 {route.totalDistance} km
              </span>
            )}
          </div>
        </div>
      )}

      {route.status === "DRAFT" && (
        <div className="bg-yellow-50 rounded p-2 text-xs">
          <span className="text-yellow-700">
            💡 Tap untuk mengoptimalkan rute
          </span>
        </div>
      )}

      {route.status === "COMPLETED" && (
        <div className="bg-green-50 rounded p-2 text-xs">
          <span className="text-green-700">✅ Rute selesai dilaksanakan</span>
        </div>
      )}
    </Link>
  );
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

  // Show only recent routes (limit to 3 for mobile)
  const recentRoutes = routes.slice(0, 3);
  const hasMoreRoutes = routes.length > 3;

  const formatGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                {formatGreeting()}
              </h1>
              <p className="text-gray-600 mt-1">
                {session.user?.name || "User"}
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
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600">Total Rute</div>
            {stats.recentRoutes > 0 && (
              <div className="text-xs text-gray-400 mt-1">
                +{stats.recentRoutes} minggu ini
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {stats.totalStores}
            </div>
            <div className="text-sm text-gray-600">Total Toko</div>
            <div className="text-xs text-gray-400 mt-1">
              Dari {stats.total} rute
            </div>
          </div>
        </div>

        {/* Quick Action */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <h2 className="text-lg font-semibold mb-2">Siap Buat Rute?</h2>
          <p className="text-blue-100 mb-4 text-sm">
            Rencanakan kunjungan toko dengan mudah
          </p>
          <Link
            href="/dashboard/create"
            className="inline-block w-full py-3 bg-white text-blue-600 text-center font-semibold rounded-lg hover:bg-blue-50 transition-colors"
          >
            + Buat Rute Baru
          </Link>
        </div>

        {/* Status Overview - Only show if has routes */}
        {stats.total > 0 && (
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Status Rute</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-600 mb-1">
                  {stats.draft}
                </div>
                <div className="text-xs text-gray-500">Draft</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600 mb-1">
                  {stats.optimized}
                </div>
                <div className="text-xs text-gray-500">Siap</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600 mb-1">
                  {stats.completed}
                </div>
                <div className="text-xs text-gray-500">Selesai</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Routes */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              {routes.length === 0 ? "Rute Anda" : "Rute Terbaru"}
            </h3>
            {hasMoreRoutes && (
              <Link
                href="/dashboard/routes"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Lihat Semua
              </Link>
            )}
          </div>

          {routes.length === 0 ? (
            /* Empty State */
            <div className="text-center py-8">
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
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Belum Ada Rute
              </h4>
              <p className="text-gray-500 mb-6 text-sm">
                Mulai dengan membuat rute pertama untuk mengoptimalkan kunjungan
                toko
              </p>
              <Link
                href="/dashboard/create"
                className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Buat Rute Pertama
              </Link>
            </div>
          ) : (
            /* Routes List */
            <div className="space-y-3">
              {recentRoutes.map((route) => (
                <SimpleRouteCard key={route.id} route={route} />
              ))}

              {hasMoreRoutes && (
                <div className="text-center pt-3">
                  <Link
                    href="/dashboard/routes"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Lihat Semua Rute ({routes.length}) →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Tips - Only show if user has draft routes */}
        {routes.length > 0 && stats.draft > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              Tips
            </h4>
            <p className="text-yellow-700 text-sm">
              Anda memiliki {stats.draft} rute yang belum dioptimalkan. Tap rute
              untuk mengoptimalkannya sebelum kunjungan.
            </p>
          </div>
        )}

        {/* Development Info */}
        {process.env.NODE_ENV === "development" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-medium text-blue-800 mb-2">🔧 Debug Info</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <p>User: {user.email}</p>
              <p>Total Routes: {routes.length}</p>
              <p>Recent Routes Shown: {Math.min(3, routes.length)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
