// src/components/route/CreateRouteForm.js - Enhanced with Geolocation

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Simple Store Input Component
function SimpleStoreInput({ store, index, onStoreChange, onRemove }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFindStore = async () => {
    const distributorId = store.distributorId?.trim();
    if (!distributorId || distributorId === "0") return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/stores/${encodeURIComponent(distributorId)}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.store) {
          onStoreChange({
            ...store,
            distributorId: data.store.distributorId,
            storeName: data.store.storeName,
            coordinates: data.store.coordinates,
          });
          setSuccess(true);
        }
      }
    } catch (error) {
      console.error("Error fetching store:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    onStoreChange({ ...store, [field]: value });
    if (success) setSuccess(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-gray-900">
          Toko #{index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Distributor ID */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ID Distributor (opsional)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Masukkan ID atau kosongkan"
            value={store.distributorId || ""}
            onChange={(e) => handleFieldChange("distributorId", e.target.value)}
            className="flex-1 p-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={handleFindStore}
            disabled={loading || !store.distributorId?.trim()}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 min-w-[80px]"
          >
            {loading ? "..." : "Cari"}
          </button>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-800 text-sm">
            ✓ Data toko berhasil ditemukan
          </p>
        </div>
      )}

      {/* Store Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nama Toko *
        </label>
        <input
          type="text"
          placeholder="Masukkan nama toko"
          required
          value={store.storeName || ""}
          onChange={(e) => handleFieldChange("storeName", e.target.value)}
          className="w-full p-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Coordinates */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Koordinat *
        </label>
        <input
          type="text"
          placeholder="-7.2574719,112.7520883"
          required
          value={store.coordinates || ""}
          onChange={(e) => handleFieldChange("coordinates", e.target.value)}
          className="w-full p-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">Format: latitude,longitude</p>
      </div>

      {/* Priority & Visit Time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prioritas
          </label>
          <select
            value={store.priority || "B"}
            onChange={(e) => handleFieldChange("priority", e.target.value)}
            className="w-full p-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="A">A (Tinggi)</option>
            <option value="B">B (Normal)</option>
            <option value="C">C (Rendah)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Waktu (menit)
          </label>
          <input
            type="number"
            min="5"
            max="120"
            value={store.visitTime || 30}
            onChange={(e) =>
              handleFieldChange("visitTime", parseInt(e.target.value))
            }
            className="w-full p-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

export default function SimpleCreateRouteForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const [formData, setFormData] = useState({
    routeDate: new Date().toISOString().split("T")[0],
    startingPoint: "",
    departureTime: "09:00",
  });

  const [stores, setStores] = useState([]);
  const [errors, setErrors] = useState({});

  // Get current location
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation tidak didukung");
      return;
    }

    setGettingLocation(true);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });

      const { latitude, longitude } = position.coords;
      const coordinates = `${latitude},${longitude}`;

      setFormData({ ...formData, startingPoint: coordinates });

      if (errors.startingPoint) {
        const newErrors = { ...errors };
        delete newErrors.startingPoint;
        setErrors(newErrors);
      }

      alert(`Lokasi berhasil didapat: ${coordinates}`);
    } catch (error) {
      alert("Gagal mendapatkan lokasi. Silakan isi manual.");
    } finally {
      setGettingLocation(false);
    }
  };

  // Validation
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
      newErrors.stores = "Minimal tambahkan 1 toko";
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
    if (!validateForm()) return;

    // Remove duplicates
    const uniqueStores = [];
    const seenIds = new Set();

    stores.forEach((store) => {
      const id = store.distributorId?.trim();
      if (!id || id === "0") {
        uniqueStores.push(store);
      } else if (!seenIds.has(id)) {
        seenIds.add(id);
        uniqueStores.push(store);
      }
    });

    setLoading(true);
    try {
      const response = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, stores: uniqueStores }),
      });

      if (response.ok) {
        const route = await response.json();
        router.push(`/dashboard/routes/${route.id}`);
      } else {
        const errorData = await response.json();
        alert(`Gagal membuat rute: ${errorData.error}`);
      }
    } catch (error) {
      alert("Gagal membuat rute. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const addStore = () => {
    setStores([
      ...stores,
      {
        id: Date.now(),
        distributorId: "",
        storeName: "",
        coordinates: "",
        priority: "B",
        visitTime: 30,
      },
    ]);
  };

  const removeStore = (id) => {
    setStores(stores.filter((store) => store.id !== id));
  };

  const handleStoreChange = (updatedStore) => {
    setStores(
      stores.map((store) =>
        store.id === updatedStore.id ? updatedStore : store
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Route Info */}
        <div className="bg-white rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Informasi Rute
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Kunjungan
            </label>
            <input
              type="date"
              required
              value={formData.routeDate}
              onChange={(e) =>
                setFormData({ ...formData, routeDate: e.target.value })
              }
              className="w-full p-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titik Mulai
            </label>
            <div className="space-y-2">
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
                  className={`flex-1 p-3 text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.startingPoint ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 min-w-[80px]"
                >
                  {gettingLocation ? "..." : "GPS"}
                </button>
              </div>
              {errors.startingPoint && (
                <p className="text-red-600 text-sm">{errors.startingPoint}</p>
              )}
              <p className="text-xs text-gray-500">
                Format: latitude,longitude
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="w-full p-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Jam kerja: 09:00 - 17:00
            </p>
          </div>
        </div>

        {/* Store List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Daftar Toko ({stores.length})
            </h2>
            <button
              type="button"
              onClick={addStore}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              + Tambah
            </button>
          </div>

          {errors.stores && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{errors.stores}</p>
            </div>
          )}

          {stores.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500 mb-3">Belum ada toko</p>
              <button
                type="button"
                onClick={addStore}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                + Tambah Toko Pertama
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {stores.map((store, index) => (
                <SimpleStoreInput
                  key={store.id}
                  store={store}
                  index={index}
                  onStoreChange={handleStoreChange}
                  onRemove={() => removeStore(store.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-4 px-4 py-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || stores.length === 0}
            className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Membuat Rute..." : `Buat Rute (${stores.length} toko)`}
          </button>
        </div>
      </div>
    </div>
  );
}
