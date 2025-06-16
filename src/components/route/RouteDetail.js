// src/components/route/RouteDetail.js - Enhanced Error Handling

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "lucide-react";

export default function EnhancedRouteDetail({ route }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const handleOptimize = async () => {
    setOptimizing(true);

    try {
      const response = await fetch(`/api/routes/${route.id}/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const responseText = await response.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error("Server error occurred");
      }

      if (response.ok && data.success) {
        const { summary } = data.optimization;
        alert(
          `Rute berhasil dioptimalkan!\n\n` +
            `✅ Toko dikunjungi: ${summary.visitedStores}\n` +
            `❌ Tidak terjangkau: ${summary.unreachableStores}\n` +
            `📏 Total jarak: ${summary.totalDistance} km\n` +
            `⏰ Selesai: ${summary.completionTime}`
        );
        router.refresh();
      } else {
        throw new Error(data.error || "Gagal mengoptimalkan rute");
      }
    } catch (error) {
      console.error("Error optimizing route:", error);
      alert("Gagal mengoptimalkan rute. Silakan coba lagi.");
    } finally {
      setOptimizing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Yakin ingin menghapus rute ini?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/routes/${route.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Rute berhasil dihapus");
        router.push("/dashboard");
      } else {
        throw new Error("Gagal menghapus rute");
      }
    } catch (error) {
      alert("Gagal menghapus rute. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

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
      OPTIMIZED: "Sudah Dioptimalkan",
      COMPLETED: "Selesai",
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const visitedStores = route.stores.filter(
    (store) => store.status === "VISITED"
  );
  const unreachableStores = route.stores.filter(
    (store) => store.status === "UNREACHABLE"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Route Status Card */}
        <div className="bg-white rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  route.status
                )}`}
              >
                {getStatusLabel(route.status)}
              </div>
              <p className="text-lg font-semibold text-gray-900 mt-2">
                {route.stores.length} Toko
              </p>
            </div>
            {route.status === "OPTIMIZED" && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Jarak</p>
                <p className="text-lg font-semibold text-blue-600">
                  {route.totalDistance} km
                </p>
              </div>
            )}
          </div>

          {/* Route Info */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div className="flex justify-between">
              <span className="text-gray-600">📍 Titik Mulai:</span>
              <span className="font-medium text-right">Lokasi Awal</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">🕘 Jam Berangkat:</span>
              <span className="font-medium">{route.departureTime}</span>
            </div>
            {route.completionTime && (
              <div className="flex justify-between">
                <span className="text-gray-600">⏰ Estimasi Selesai:</span>
                <span className="font-medium">{route.completionTime}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {route.status === "DRAFT" && (
            <button
              onClick={handleOptimize}
              disabled={optimizing}
              className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {optimizing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Mengoptimalkan...
                </>
              ) : (
                <>
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Optimalkan Rute
                </>
              )}
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={loading || optimizing}
            className="w-full py-3 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                Menghapus...
              </>
            ) : (
              <>
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Hapus Rute
              </>
            )}
          </button>
        </div>

        {/* Optimization Results */}
        {route.status === "OPTIMIZED" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              📊 Hasil Optimasi
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {visitedStores.length}
                </div>
                <div className="text-sm text-gray-600">Toko Dikunjungi</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {unreachableStores.length}
                </div>
                <div className="text-sm text-gray-600">Tidak Terjangkau</div>
              </div>
            </div>
          </div>
        )}

        {/* Store List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {route.status === "DRAFT" ? "📝 Daftar Toko" : "🗺️ Rute Kunjungan"}
          </h3>

          {/* Draft State - Simple List */}
          {route.status === "DRAFT" && (
            <div className="space-y-3">
              {route.stores.map((store, index) => (
                <div
                  key={store.id}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {store.storeName}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        📍 {store.coordinates}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span
                          className={`px-2 py-1 rounded ${
                            store.priority === "A"
                              ? "bg-red-100 text-red-700"
                              : store.priority === "B"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          Prioritas {store.priority}
                        </span>
                        <span>⏱️ {store.visitTime} menit</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm text-center">
                  💡 Klik "Optimalkan Rute" untuk mengurutkan toko berdasarkan
                  jarak dan prioritas
                </p>
              </div>
            </div>
          )}

          {/* Optimized State - Visited Stores */}
          {route.status === "OPTIMIZED" && visitedStores.length > 0 && (
            <div className="space-y-3">
              {visitedStores.map((store) => (
                <div
                  key={store.id}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {store.visitOrder}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {store.storeName}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        📍 {store.coordinates}
                      </p>

                      {/* Visit Times */}
                      {store.arrivalTime && (
                        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                          <div>
                            <span className="text-gray-500">Tiba:</span>
                            <div className="font-medium">
                              ⏰ {store.arrivalTime}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Berangkat:</span>
                            <div className="font-medium">
                              🚗 {store.departTime}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-xs">
                        <span
                          className={`px-2 py-1 rounded ${
                            store.priority === "A"
                              ? "bg-red-100 text-red-700"
                              : store.priority === "B"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          Prioritas {store.priority}
                        </span>
                        <span className="text-gray-500">
                          ⏱️ {store.visitTime} menit
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Button */}
                  {store.mapsUrl && (
                    <Link
                      href={store.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
                    >
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
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Navigasi ke Toko
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Unreachable Stores */}
          {route.status === "OPTIMIZED" && unreachableStores.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-red-700 flex items-center gap-2">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                Toko Tidak Terjangkau ({unreachableStores.length})
              </h4>

              {unreachableStores.map((store) => (
                <div
                  key={store.id}
                  className="bg-red-50 border border-red-200 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      ✕
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {store.storeName}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        📍 {store.coordinates}
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        <span
                          className={`px-2 py-1 rounded ${
                            store.priority === "A"
                              ? "bg-red-100 text-red-700"
                              : store.priority === "B"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          Prioritas {store.priority}
                        </span>
                        <span className="text-gray-500">
                          ⏱️ {store.visitTime} menit
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-yellow-800 text-sm">
                      💡 Tidak dapat dikunjungi dalam jam kerja (09:00-17:00).
                      Pertimbangkan untuk dikunjungi di hari lain.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Development Debug */}
        {process.env.NODE_ENV === "development" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-medium text-blue-800 mb-2">🔧 Debug Info</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <p>Route ID: {route.id}</p>
              <p>Status: {route.status}</p>
              <p>Stores: {route.stores.length}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
