// src/components/route/RouteList.js - Enhanced for 30+ Users

"use client";

import { useState } from "react";

export default function EnhancedRouteList({ routes, showAll = true }) {
  const [filter, setFilter] = useState("all");

  const getStatusBadge = (status) => {
    const badges = {
      DRAFT: {
        bg: "bg-orange-100",
        text: "text-orange-800",
        border: "border-orange-200",
        icon: "⚠️",
      },
      OPTIMIZED: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        border: "border-blue-200",
        icon: "✅",
      },
      COMPLETED: {
        bg: "bg-green-100",
        text: "text-green-800",
        border: "border-green-200",
        icon: "🎉",
      },
    };

    const labels = {
      DRAFT: "Perlu Dioptimalkan",
      OPTIMIZED: "Siap Dikunjungi",
      COMPLETED: "Selesai",
    };

    const badge = badges[status] || badges.DRAFT;

    return (
      <div
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 font-semibold text-base ${badge.bg} ${badge.text} ${badge.border}`}
      >
        <span className="text-lg">{badge.icon}</span>
        <span>{labels[status] || status}</span>
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Baru dibuat";
    if (diffInHours < 24) return `${diffInHours} jam lalu`;
    if (diffInHours < 48) return "Kemarin";
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} hari lalu`;
    return formatDate(dateString);
  };

  // Filter routes
  const filteredRoutes = routes.filter((route) => {
    if (filter === "all") return true;
    return route.status.toLowerCase() === filter;
  });

  // Filter counts
  const filterCounts = {
    all: routes.length,
    draft: routes.filter((r) => r.status === "DRAFT").length,
    optimized: routes.filter((r) => r.status === "OPTIMIZED").length,
    completed: routes.filter((r) => r.status === "COMPLETED").length,
  };

  // Empty state with larger, clearer design
  if (routes.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🗺️</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Belum Ada Rute
        </h3>
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
          Mulai dengan membuat rute pertama untuk mengoptimalkan kunjungan toko
          Anda
        </p>
        <Link
          href="/dashboard/create"
          className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
        >
          <span className="text-xl">+</span>
          <span>Buat Rute Pertama</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Filter Tabs */}
      {showAll && routes.length > 1 && (
        <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Filter Rute
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFilter("all")}
              className={`p-4 rounded-xl font-semibold text-base transition-all border-2 ${
                filter === "all"
                  ? "bg-blue-600 text-white border-blue-600 shadow-lg"
                  : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">📋</span>
                <div>
                  <div>Semua Rute</div>
                  <div className="text-sm opacity-75">({filterCounts.all})</div>
                </div>
              </div>
            </button>

            {filterCounts.draft > 0 && (
              <button
                onClick={() => setFilter("draft")}
                className={`p-4 rounded-xl font-semibold text-base transition-all border-2 ${
                  filter === "draft"
                    ? "bg-orange-600 text-white border-orange-600 shadow-lg"
                    : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <div>Perlu Optimasi</div>
                    <div className="text-sm opacity-75">
                      ({filterCounts.draft})
                    </div>
                  </div>
                </div>
              </button>
            )}

            {filterCounts.optimized > 0 && (
              <button
                onClick={() => setFilter("optimized")}
                className={`p-4 rounded-xl font-semibold text-base transition-all border-2 ${
                  filter === "optimized"
                    ? "bg-blue-600 text-white border-blue-600 shadow-lg"
                    : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">✅</span>
                  <div>
                    <div>Siap Dikunjungi</div>
                    <div className="text-sm opacity-75">
                      ({filterCounts.optimized})
                    </div>
                  </div>
                </div>
              </button>
            )}

            {filterCounts.completed > 0 && (
              <button
                onClick={() => setFilter("completed")}
                className={`p-4 rounded-xl font-semibold text-base transition-all border-2 ${
                  filter === "completed"
                    ? "bg-green-600 text-white border-green-600 shadow-lg"
                    : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">🎉</span>
                  <div>
                    <div>Selesai</div>
                    <div className="text-sm opacity-75">
                      ({filterCounts.completed})
                    </div>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Routes List */}
      <div className="space-y-6">
        {filteredRoutes.map((route) => (
          <Link
            key={route.id}
            href={`/dashboard/routes/${route.id}`}
            className="block bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all p-6"
          >
            {/* Route Header */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {formatDate(route.routeDate)}
                  </h3>
                  <div className="text-base text-gray-600">
                    Dibuat {getTimeAgo(route.createdAt)}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {getStatusBadge(route.status)}
                </div>
              </div>
            </div>

            {/* Route Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl">🏪</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {route.stores.length}
                  </span>
                </div>
                <div className="text-base font-medium text-gray-600">Toko</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl">🕘</span>
                  <span className="text-xl font-bold text-gray-900">
                    {route.departureTime}
                  </span>
                </div>
                <div className="text-base font-medium text-gray-600">
                  Jam Berangkat
                </div>
              </div>
            </div>

            {/* Priority Distribution */}
            {route.stores.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="text-base font-semibold text-gray-800 mb-3 text-center">
                  Distribusi Prioritas Toko
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {["A", "B", "C", "D"].map((priority) => {
                    const count = route.stores.filter(
                      (store) => store.priority === priority
                    ).length;
                    const colors = {
                      A: "bg-red-100 text-red-800 border-red-200",
                      B: "bg-orange-100 text-orange-800 border-orange-200",
                      C: "bg-yellow-100 text-yellow-800 border-yellow-200",
                      D: "bg-blue-100 text-blue-800 border-blue-200",
                    };

                    return (
                      <div
                        key={priority}
                        className={`border-2 rounded-lg p-2 text-center ${colors[priority]}`}
                      >
                        <div className="text-lg font-bold">{count}</div>
                        <div className="text-sm font-medium">
                          Kelas {priority}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Total Visit Time Display */}
            {route.stores.length > 0 && (
              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">⏱️</span>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-800">
                      {route.stores.reduce(
                        (total, store) => total + (store.visitTime || 30),
                        0
                      )}{" "}
                      menit
                    </div>
                    <div className="text-base font-medium text-purple-600">
                      Total Waktu Kunjungan
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Distance Info (if optimized) */}
            {route.totalDistance && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">📏</span>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-800">
                      {route.totalDistance} km
                    </div>
                    <div className="text-base font-medium text-blue-600">
                      Total Jarak
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Status-Specific Messages */}
            {route.status === "DRAFT" && (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <div className="text-lg font-semibold text-orange-800">
                      Siap untuk Dioptimalkan
                    </div>
                    <div className="text-base text-orange-700">
                      Klik untuk mengurutkan toko berdasarkan jarak terpendek
                    </div>
                  </div>
                </div>
              </div>
            )}

            {route.status === "OPTIMIZED" && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <div className="text-lg font-semibold text-blue-800">
                        Rute Sudah Dioptimalkan
                      </div>
                      <div className="text-base text-blue-700">
                        {
                          route.stores.filter((s) => s.status === "VISITED")
                            .length
                        }{" "}
                        toko akan dikunjungi
                        {route.stores.filter((s) => s.status === "UNREACHABLE")
                          .length > 0 &&
                          `, ${
                            route.stores.filter(
                              (s) => s.status === "UNREACHABLE"
                            ).length
                          } tidak terjangkau`}
                      </div>
                    </div>
                  </div>
                  {route.completionTime && (
                    <div className="text-right">
                      <div className="text-base font-semibold text-blue-800">
                        Selesai: {route.completionTime}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {route.status === "COMPLETED" && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <div className="text-lg font-semibold text-green-800">
                      Rute Telah Selesai
                    </div>
                    <div className="text-base text-green-700">
                      Semua toko telah berhasil dikunjungi
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* No Results State */}
      {filteredRoutes.length === 0 && routes.length > 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🔍</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Tidak Ada Rute Ditemukan
          </h3>
          <p className="text-lg text-gray-600 mb-6">
            Tidak ada rute dengan status "
            {filter === "draft"
              ? "Perlu Optimasi"
              : filter === "optimized"
              ? "Siap Dikunjungi"
              : "Selesai"}
            "
          </p>
          <button
            onClick={() => setFilter("all")}
            className="px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Lihat Semua Rute
          </button>
        </div>
      )}

      {/* Pagination Info */}
      {showAll && filteredRoutes.length >= 10 && (
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          <p className="text-lg font-medium text-gray-700">
            Menampilkan {filteredRoutes.length} dari {routes.length} total rute
          </p>
        </div>
      )}
    </div>
  );
}
