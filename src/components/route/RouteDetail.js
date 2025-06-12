// ===== FILE 2: ./src/components/route/RouteDetail.js =====
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RouteDetail({ route }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const handleOptimize = async () => {
    setOptimizing(true);
    try {
      const response = await fetch(`/api/routes/${route.id}/optimize`, {
        method: "POST",
      });

      if (response.ok) {
        // Refresh the page to show updated results
        router.refresh();
      } else {
        throw new Error("Failed to optimize route");
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
        router.push("/dashboard");
      } else {
        throw new Error("Failed to delete route");
      }
    } catch (error) {
      console.error("Error deleting route:", error);
      alert("Gagal menghapus rute. Silakan coba lagi.");
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
        className={`px-2 py-1 text-xs rounded-full ${
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
        className={`px-2 py-1 text-xs rounded-full ${
          badges[status] || badges.PENDING
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const visitedStores = route.stores.filter(
    (store) => store.status === "VISITED"
  );
  const unreachableStores = route.stores.filter(
    (store) => store.status === "UNREACHABLE"
  );

  return (
    <div className="space-y-6">
      {/* Route Summary */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-semibold">Informasi Rute</h2>
            {getStatusBadge(route.status)}
          </div>
          <div className="flex gap-2">
            {route.status === "DRAFT" && (
              <button
                onClick={handleOptimize}
                disabled={optimizing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm"
              >
                {optimizing ? "Mengoptimalkan..." : "Optimalkan Rute"}
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 text-sm"
            >
              {loading ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Titik Mulai:</span>
            <p className="font-medium">{route.startingPoint}</p>
          </div>
          <div>
            <span className="text-gray-600">Jam Berangkat:</span>
            <p className="font-medium">{route.departureTime}</p>
          </div>
          {route.totalDistance && (
            <>
              <div>
                <span className="text-gray-600">Total Jarak:</span>
                <p className="font-medium">{route.totalDistance} km</p>
              </div>
              <div>
                <span className="text-gray-600">Estimasi Selesai:</span>
                <p className="font-medium">{route.completionTime}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Optimization Summary */}
      {route.status === "OPTIMIZED" && (
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Hasil Optimasi
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Toko Dikunjungi:</span>
              <p className="font-bold text-lg text-blue-900">
                {visitedStores.length}
              </p>
            </div>
            <div>
              <span className="text-blue-700">Tidak Terjangkau:</span>
              <p className="font-bold text-lg text-red-600">
                {unreachableStores.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Visited Stores */}
      {visitedStores.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">
            Rute Kunjungan ({visitedStores.length} toko)
          </h3>
          <div className="space-y-3">
            {visitedStores.map((store) => (
              <div
                key={store.id}
                className="border border-gray-200 p-4 rounded-md"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                        #{store.visitOrder}
                      </span>
                      <span className="font-medium">{store.storeName}</span>
                      {getStoreStatusBadge(store.status)}
                    </div>
                    <p className="text-sm text-gray-600">{store.coordinates}</p>
                  </div>
                  <div className="text-right text-sm">
                    <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                      Priority {store.priority}
                    </div>
                  </div>
                </div>

                {store.arrivalTime && (
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mt-3">
                    <div>
                      <span>Tiba:</span>
                      <p className="font-medium text-gray-900">
                        {store.arrivalTime}
                      </p>
                    </div>
                    <div>
                      <span>Berangkat:</span>
                      <p className="font-medium text-gray-900">
                        {store.departTime}
                      </p>
                    </div>
                    <div>
                      <span>Durasi:</span>
                      <p className="font-medium text-gray-900">
                        {store.visitTime} min
                      </p>
                    </div>
                  </div>
                )}

                {store.mapsUrl && (
                  <div className="mt-3">
                    <a
                      href={store.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center bg-green-600 text-white py-2 rounded-md hover:bg-green-700 text-sm"
                    >
                      🗺️ Buka di Google Maps
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
          <h3 className="text-lg font-semibold mb-4">
            Toko Tidak Terjangkau ({unreachableStores.length})
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
                    <p className="text-sm text-gray-600">{store.coordinates}</p>
                  </div>
                  <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                    Priority {store.priority}
                  </div>
                </div>
                <p className="text-xs text-red-600 mt-2">
                  Tidak dapat dikunjungi dalam jam kerja (09:00-17:00)
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Stores (for DRAFT status) */}
      {route.status === "DRAFT" && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">
            Daftar Toko ({route.stores.length})
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
                    <p className="text-sm text-gray-600">{store.coordinates}</p>
                  </div>
                  <div className="text-right">
                    <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs mb-1">
                      Priority {store.priority}
                    </div>
                    <p className="text-xs text-gray-600">
                      {store.visitTime} min
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              💡 Klik "Optimalkan Rute" untuk mengurutkan toko berdasarkan jarak
              dan prioritas
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
