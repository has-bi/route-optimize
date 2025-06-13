// src/components/route/CreateRouteForm.js - Enhanced with Geolocation

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SmartStoreInput from "./SmartStoreInput.js";

export default function CreateRouteForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [formData, setFormData] = useState({
    routeDate: new Date().toISOString().split("T")[0],
    startingPoint: "",
    departureTime: "09:00",
  });
  const [stores, setStores] = useState([]);
  const [collapsedStores, setCollapsedStores] = useState(new Set());
  const [errors, setErrors] = useState({});

  // Get user's current location
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert("❌ Geolocation tidak didukung oleh browser Anda");
      return;
    }

    setGettingLocation(true);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position),
          (error) => reject(error),
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000, // Cache for 1 minute
          }
        );
      });

      const { latitude, longitude } = position.coords;
      const coordinates = `${latitude},${longitude}`;

      console.log("📍 Current location obtained:", coordinates);

      setFormData({ ...formData, startingPoint: coordinates });

      // Clear any existing error
      if (errors.startingPoint) {
        const newErrors = { ...errors };
        delete newErrors.startingPoint;
        setErrors(newErrors);
      }

      // Show success feedback
      const accuracy = Math.round(position.coords.accuracy);
      alert(
        `✅ Lokasi berhasil didapat!\n📍 ${coordinates}\n🎯 Akurasi: ±${accuracy}m`
      );
    } catch (error) {
      console.error("Error getting location:", error);

      let errorMessage = "Gagal mendapatkan lokasi. ";

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage +=
            "Izin lokasi ditolak. Silakan aktifkan permission lokasi di browser.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage += "Informasi lokasi tidak tersedia.";
          break;
        case error.TIMEOUT:
          errorMessage += "Timeout mendapatkan lokasi. Silakan coba lagi.";
          break;
        default:
          errorMessage += "Silakan isi koordinat secara manual.";
      }

      alert(`❌ ${errorMessage}`);
    } finally {
      setGettingLocation(false);
    }
  };

  // Validation functions
  const validateCoordinates = (coords) => {
    if (!coords.trim()) return false;
    const parts = coords.split(",");
    if (parts.length !== 2) return false;
    const [lat, lng] = parts.map(Number);
    return (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.startingPoint.trim()) {
      newErrors.startingPoint = "Titik mulai wajib diisi";
    } else if (!validateCoordinates(formData.startingPoint)) {
      newErrors.startingPoint = "Format koordinat tidak valid";
    }

    if (stores.length === 0) {
      newErrors.stores = "Minimal tambahkan 1 toko untuk dikunjungi";
    } else {
      stores.forEach((store, index) => {
        if (!store.storeName?.trim()) {
          newErrors[`store_${index}_name`] = "Nama toko wajib diisi";
        }
        if (!store.coordinates?.trim()) {
          newErrors[`store_${index}_coords`] = "Koordinat wajib diisi";
        } else if (!validateCoordinates(store.coordinates)) {
          newErrors[`store_${index}_coords`] = "Format koordinat tidak valid";
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Remove duplicate distributor IDs
    const uniqueStores = [];
    const seenDistributorIds = new Set();

    stores.forEach((store) => {
      const distId = store.distributorId?.trim();

      if (!distId || distId === "0") {
        uniqueStores.push(store);
      } else if (!seenDistributorIds.has(distId)) {
        seenDistributorIds.add(distId);
        uniqueStores.push(store);
      }
    });

    if (uniqueStores.length !== stores.length) {
      alert(`${stores.length - uniqueStores.length} toko duplikat dihapus`);
    }

    setLoading(true);
    try {
      const response = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          stores: uniqueStores,
        }),
      });

      if (response.ok) {
        const route = await response.json();
        router.push(`/dashboard/routes/${route.id}`);
      } else {
        const errorData = await response.json();
        alert(`Gagal membuat rute: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error creating route:", error);
      alert("Gagal membuat rute. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const addStore = () => {
    const newStore = {
      id: Date.now(),
      distributorId: "",
      storeName: "",
      coordinates: "",
      priority: "B",
      visitTime: 30,
    };
    setStores([...stores, newStore]);
  };

  const removeStore = (id) => {
    setStores(stores.filter((store) => store.id !== id));
    setCollapsedStores((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    // Clear related errors
    const newErrors = { ...errors };
    const index = stores.findIndex((store) => store.id === id);
    delete newErrors[`store_${index}_name`];
    delete newErrors[`store_${index}_coords`];
    setErrors(newErrors);
  };

  const handleStoreChange = (updatedStore) => {
    console.log("🔍 Parent received updated store:", updatedStore);

    setStores(
      stores.map((store) =>
        store.id === updatedStore.id ? updatedStore : store
      )
    );

    // Clear errors for this store
    const index = stores.findIndex((store) => store.id === updatedStore.id);
    if (index >= 0) {
      const newErrors = { ...errors };
      delete newErrors[`store_${index}_name`];
      delete newErrors[`store_${index}_coords`];
      setErrors(newErrors);
    }
  };

  const toggleStoreCollapse = (id) => {
    setCollapsedStores((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Separate completed and incomplete stores
  const completedStores = stores.filter(
    (store) =>
      store.storeName &&
      store.coordinates &&
      (store.distributorId || store.distributorId === "0")
  );
  const incompleteStores = stores.filter(
    (store) =>
      !(
        store.storeName &&
        store.coordinates &&
        (store.distributorId || store.distributorId === "0")
      )
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Route Info */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Informasi Rute</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Tanggal Kunjungan
            </label>
            <input
              type="date"
              required
              value={formData.routeDate}
              onChange={(e) =>
                setFormData({ ...formData, routeDate: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Titik Mulai (Koordinat)
            </label>

            {/* Input with Get Location Button */}
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="-7.2574719,112.7520883"
                value={formData.startingPoint}
                onChange={(e) => {
                  setFormData({ ...formData, startingPoint: e.target.value });
                  if (errors.startingPoint) {
                    const newErrors = { ...errors };
                    delete newErrors.startingPoint;
                    setErrors(newErrors);
                  }
                }}
                className={`flex-1 p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.startingPoint ? "border-red-500" : "border-gray-300"
                }`}
              />

              {/* Get Current Location Button */}
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors min-w-[140px] flex items-center justify-center gap-2"
                title="Dapatkan lokasi saya saat ini"
              >
                {gettingLocation ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">Getting...</span>
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
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="hidden sm:inline">Lokasi Saya</span>
                    <span className="sm:hidden">📍</span>
                  </>
                )}
              </button>
            </div>

            {errors.startingPoint && (
              <p className="text-red-500 text-xs mt-1">
                {errors.startingPoint}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Format: latitude,longitude atau klik "Lokasi Saya" untuk otomatis
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Jam Berangkat
            </label>
            <input
              type="time"
              required
              min="09:00"
              max="17:00"
              value={formData.departureTime}
              onChange={(e) =>
                setFormData({ ...formData, departureTime: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Jam kerja: 09:00 - 17:00 (istirahat: 12:00 - 13:00)
            </p>
          </div>
        </div>
      </div>

      {/* Smart Store List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            Daftar Toko
            {stores.length > 0 && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                ({completedStores.length} lengkap, {incompleteStores.length}{" "}
                belum)
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={addStore}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            + Tambah Toko
          </button>
        </div>

        {errors.stores && (
          <p className="text-red-500 text-sm mb-4">{errors.stores}</p>
        )}

        {stores.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500 mb-2">Belum ada toko</p>
            <p className="text-xs text-gray-400">
              Klik "Tambah Toko" untuk mulai menambahkan toko
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {stores.map((store, index) => (
              <SmartStoreInput
                key={store.id}
                store={store}
                index={index}
                isCollapsed={collapsedStores.has(store.id)}
                onStoreChange={handleStoreChange}
                onRemove={() => removeStore(store.id)}
                onToggleCollapse={() => toggleStoreCollapse(store.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <button
          type="submit"
          disabled={loading || stores.length === 0}
          className="w-full touch-target bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Membuat Rute..." : `Buat Rute (${stores.length} toko)`}
        </button>

        {stores.length > 0 && (
          <p className="text-xs text-gray-500 text-center mt-2">
            Duplikat Distributor ID akan dihapus otomatis
          </p>
        )}
      </div>
    </form>
  );
}
