// src/components/route/RouteList.js - Enhanced Route List Component

"use client";

import { useState } from "react";

export default function RouteList({ routes, showAll = true }) {
  const [filter, setFilter] = useState("all"); // all, draft, optimized, completed

  const getStatusBadge = (status) => {
    const badges = {
      DRAFT: "bg-gray-100 text-gray-800",
      OPTIMIZED: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
    };

    const labels = {
      DRAFT: "Draft",
      OPTIMIZED: "Dioptimalkan",
      COMPLETED: "Selesai",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          badges[status] || badges.DRAFT
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
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

  if (routes.length === 0) {
    return (
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
          Buat rute pertama Anda untuk mulai optimasi
        </p>
        <a
          href="/dashboard/create"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
        >
          + Buat Rute Baru
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Tabs (only show if showAll is true and has multiple statuses) */}
      {showAll && routes.length > 1 && (
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Semua ({filterCounts.all})
          </button>
          {filterCounts.draft > 0 && (
            <button
              onClick={() => setFilter("draft")}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === "draft"
                  ? "bg-gray-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Draft ({filterCounts.draft})
            </button>
          )}
          {filterCounts.optimized > 0 && (
            <button
              onClick={() => setFilter("optimized")}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === "optimized"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Dioptimalkan ({filterCounts.optimized})
            </button>
          )}
          {filterCounts.completed > 0 && (
            <button
              onClick={() => setFilter("completed")}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === "completed"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Selesai ({filterCounts.completed})
            </button>
          )}
        </div>
      )}

      {/* Routes Grid */}
      <div className="space-y-4">
        {filteredRoutes.map((route) => (
          <a
            key={route.id}
            href={`/dashboard/routes/${route.id}`}
            className="block p-5 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">
                    Rute {formatDate(route.routeDate)}
                  </h3>
                  {getStatusBadge(route.status)}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
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
                  {route.totalDistance && (
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
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {route.totalDistance} km
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                {getTimeAgo(route.createdAt)}
              </div>
            </div>

            {/* Route Status Details */}
            {route.status === "OPTIMIZED" && (
              <div className="flex gap-4 text-xs text-gray-600 bg-blue-50 rounded-md p-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {
                    route.stores.filter((s) => s.status === "VISITED").length
                  }{" "}
                  dikunjungi
                </span>
                {route.stores.filter((s) => s.status === "UNREACHABLE").length >
                  0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    {
                      route.stores.filter((s) => s.status === "UNREACHABLE")
                        .length
                    }{" "}
                    tidak terjangkau
                  </span>
                )}
                {route.completionTime && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Selesai {route.completionTime}
                  </span>
                )}
              </div>
            )}

            {route.status === "DRAFT" && (
              <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2 flex items-center gap-2">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                Belum dioptimalkan - Klik untuk melanjutkan
              </div>
            )}

            {route.status === "COMPLETED" && (
              <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2 flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Rute selesai dilaksanakan
              </div>
            )}
          </a>
        ))}
      </div>

      {/* No results for filter */}
      {filteredRoutes.length === 0 && routes.length > 0 && (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <p className="text-gray-500">
            Tidak ada rute dengan status "
            {filter === "draft"
              ? "Draft"
              : filter === "optimized"
              ? "Dioptimalkan"
              : "Selesai"}
            "
          </p>
          <button
            onClick={() => setFilter("all")}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Lihat semua rute
          </button>
        </div>
      )}

      {/* Show pagination or load more if needed */}
      {showAll && filteredRoutes.length >= 10 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Menampilkan {filteredRoutes.length} dari {routes.length} total rute
          </p>
        </div>
      )}
    </div>
  );
}
