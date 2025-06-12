// src/components/route/RouteDetail.js - Enhanced Error Handling

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RouteDetail({ route }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState("");

  const handleOptimize = async () => {
    setOptimizing(true);
    setError("");

    try {
      console.log("🚀 Starting route optimization for route:", route.id);

      const response = await fetch(`/api/routes/${route.id}/optimize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("📡 API Response status:", response.status);
      console.log("📡 API Response ok:", response.ok);

      // Get response text first to handle both JSON and HTML responses
      const responseText = await response.text();
      console.log("📡 Raw response:", responseText.substring(0, 200) + "...");

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ Failed to parse JSON response:", parseError);
        throw new Error(
          `API returned non-JSON response: ${responseText.substring(0, 100)}`
        );
      }

      if (response.ok && data.success) {
        console.log("✅ Route optimized successfully");
        console.log("📊 Optimization results:", data.optimization);

        // Show success message with results
        const { summary } = data.optimization;
        alert(
          `🎯 Rute berhasil dioptimalkan!\n\n` +
            `✅ Toko dikunjungi: ${summary.visitedStores}\n` +
            `❌ Tidak terjangkau: ${summary.unreachableStores}\n` +
            `📏 Total jarak: ${summary.totalDistance} km\n` +
            `⏰ Selesai: ${summary.completionTime}`
        );

        // Refresh the page to show updated results
        router.refresh();
      } else {
        // Handle API errors
        const errorMessage =
          data.error || `HTTP ${response.status}: ${response.statusText}`;
        console.error("❌ API Error:", errorMessage);

        if (data.details) {
          console.error("❌ Error details:", data.details);
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("💥 Error optimizing route:", error);
      setError(error.message);

      // Show user-friendly error message
      let userMessage = "Gagal mengoptimalkan rute. ";

      if (error.message.includes("Route not found")) {
        userMessage += "Rute tidak ditemukan.";
      } else if (error.message.includes("Unauthorized")) {
        userMessage += "Sesi login sudah berakhir. Silakan login ulang.";
      } else if (error.message.includes("already optimized")) {
        userMessage += "Rute sudah dioptimalkan sebelumnya.";
      } else if (error.message.includes("non-JSON response")) {
        userMessage += "Terjadi error pada server. Silakan coba lagi.";
      } else {
        userMessage += "Silakan coba lagi dalam beberapa saat.";
      }

      alert(userMessage);
    } finally {
      setOptimizing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("⚠️ Yakin ingin menghapus rute ini?")) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/routes/${route.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("✅ Rute berhasil dihapus");
        router.push("/dashboard");
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete route");
      }
    } catch (error) {
      console.error("Error deleting route:", error);
      alert("❌ Gagal menghapus rute. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

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
        className={`px-3 py-1 text-xs font-medium rounded-full ${
          badges[status] || badges.DRAFT
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const getStoreStatusBadge = (status) => {
    const badges = {
      PENDING: "bg-yellow-100 text-yellow-800",
      VISITED: "bg-green-100 text-green-800",
      UNREACHABLE: "bg-red-100 text-red-800",
    };

    const labels = {
      PENDING: "Pending",
      VISITED: "Dikunjungi",
      UNREACHABLE: "Tidak Terjangkau",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          badges[status] || badges.PENDING
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const visitedStores = route.stores.filter(
    (store) => store.status === "VISITED"
  );
  const unreachableStores = route.stores.filter(
    (store) => store.status === "UNREACHABLE"
  );

  return (
    <div className="space-y-6">
      {/* Route Summary Card */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">
              Rute {formatDate(route.routeDate)}
            </h2>
            <div className="flex items-center gap-3">
              {getStatusBadge(route.status)}
              <span className="text-sm text-gray-600">
                {route.stores.length} toko
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {route.status === "DRAFT" && (
              <button
                onClick={handleOptimize}
                disabled={optimizing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium min-w-[140px]"
              >
                {optimizing ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Optimizing...
                  </div>
                ) : (
                  "🎯 Optimalkan Rute"
                )}
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={loading || optimizing}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 text-sm"
            >
              {loading ? "Menghapus..." : "🗑️ Hapus"}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm font-medium">❌ {error}</p>
            {process.env.NODE_ENV === "development" && (
              <details className="mt-2">
                <summary className="cursor-pointer text-red-600 text-xs">
                  Technical Details (Dev Only)
                </summary>
                <pre className="mt-1 text-xs text-red-600 overflow-auto">
                  {error}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Route Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">📍 Titik Mulai:</span>
            <p className="font-medium">{route.startingPoint}</p>
          </div>
          <div>
            <span className="text-gray-600">🕘 Berangkat:</span>
            <p className="font-medium">{route.departureTime}</p>
          </div>
          {route.totalDistance && (
            <>
              <div>
                <span className="text-gray-600">📏 Total Jarak:</span>
                <p className="font-medium">{route.totalDistance} km</p>
              </div>
              <div>
                <span className="text-gray-600">⏰ Estimasi Selesai:</span>
                <p className="font-medium">{route.completionTime}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Development Debug Info */}
      {process.env.NODE_ENV === "development" && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="font-medium text-blue-800 mb-2">🔧 Debug Info</h3>
          <div className="text-xs text-blue-700 space-y-1">
            <p>
              <strong>Route ID:</strong> {route.id}
            </p>
            <p>
              <strong>Status:</strong> {route.status}
            </p>
            <p>
              <strong>Stores:</strong> {route.stores.length}
            </p>
            <p>
              <strong>Optimize URL:</strong> /api/routes/{route.id}/optimize
            </p>
          </div>
        </div>
      )}

      {/* Rest of the component continues with optimization results... */}
      {/* (keeping the existing optimization results display code) */}

      {/* Optimization Summary */}
      {route.status === "OPTIMIZED" && (
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            📊 Hasil Optimasi
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <p className="text-blue-700 mb-1">Toko Dikunjungi</p>
              <p className="font-bold text-2xl text-green-600">
                {visitedStores.length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-blue-700 mb-1">Tidak Terjangkau</p>
              <p className="font-bold text-2xl text-red-600">
                {unreachableStores.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Show stores based on status */}
      {route.status === "DRAFT" ? (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">
            📝 Daftar Toko ({route.stores.length})
          </h3>
          <div className="space-y-3">
            {route.stores.map((store, index) => (
              <div
                key={store.id}
                className="border border-gray-200 p-4 rounded-md"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-gray-400 text-white text-xs px-2 py-1 rounded-full">
                        #{index + 1}
                      </span>
                      <span className="font-medium">{store.storeName}</span>
                      {getStoreStatusBadge(store.status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      📍 {store.coordinates}
                    </p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`px-2 py-1 rounded text-xs mb-1 ${
                        store.priority === "A"
                          ? "bg-red-100 text-red-700"
                          : store.priority === "B"
                          ? "bg-orange-100 text-orange-700"
                          : store.priority === "C"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      Priority {store.priority}
                    </div>
                    <p className="text-xs text-gray-600">
                      ⏱️ {store.visitTime} min
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800 flex items-center gap-2">
              <span className="text-lg">💡</span>
              <span>
                <strong>Siap untuk dioptimalkan!</strong> Klik "Optimalkan Rute"
                untuk mengurutkan toko berdasarkan jarak dan prioritas.
              </span>
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Visited Stores Route */}
          {visitedStores.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                🗺️ Rute Kunjungan ({visitedStores.length} toko)
              </h3>
              <div className="space-y-4">
                {visitedStores.map((store) => (
                  <div
                    key={store.id}
                    className="border border-gray-200 p-4 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full font-medium">
                            #{store.visitOrder}
                          </span>
                          <span className="font-medium text-lg">
                            {store.storeName}
                          </span>
                          {getStoreStatusBadge(store.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          📍 {store.coordinates}
                        </p>
                      </div>
                      <div className="text-right">
                        <div
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            store.priority === "A"
                              ? "bg-red-100 text-red-700"
                              : store.priority === "B"
                              ? "bg-orange-100 text-orange-700"
                              : store.priority === "C"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          Priority {store.priority}
                        </div>
                      </div>
                    </div>

                    {/* Visit Times */}
                    {store.arrivalTime && (
                      <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="block text-xs">Tiba:</span>
                          <p className="font-medium text-gray-900">
                            ⏰ {store.arrivalTime}
                          </p>
                        </div>
                        <div>
                          <span className="block text-xs">Berangkat:</span>
                          <p className="font-medium text-gray-900">
                            🚗 {store.departTime}
                          </p>
                        </div>
                        <div>
                          <span className="block text-xs">Durasi:</span>
                          <p className="font-medium text-gray-900">
                            ⏱️ {store.visitTime} min
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Google Maps Link */}
                    {store.mapsUrl && (
                      <div>
                        <a
                          href={store.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full text-center bg-green-600 text-white py-3 rounded-md hover:bg-green-700 font-medium transition-colors"
                        >
                          🗺️ Navigasi di Google Maps
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unreachable Stores */}
          {unreachableStores.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 text-red-700">
                ⚠️ Toko Tidak Terjangkau ({unreachableStores.length})
              </h3>
              <div className="space-y-3">
                {unreachableStores.map((store) => (
                  <div
                    key={store.id}
                    className="border border-red-200 p-4 rounded-md bg-red-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{store.storeName}</span>
                          {getStoreStatusBadge(store.status)}
                        </div>
                        <p className="text-sm text-gray-600">
                          📍 {store.coordinates}
                        </p>
                      </div>
                      <div
                        className={`px-2 py-1 rounded text-xs ${
                          store.priority === "A"
                            ? "bg-red-100 text-red-700"
                            : store.priority === "B"
                            ? "bg-orange-100 text-orange-700"
                            : store.priority === "C"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        Priority {store.priority}
                      </div>
                    </div>
                    <p className="text-xs text-red-600 mt-2">
                      💡 Tidak dapat dikunjungi dalam jam kerja (09:00-17:00)
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  💡 <strong>Saran:</strong> Kunjungi toko ini di hari lain atau
                  ubah prioritas rute
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
