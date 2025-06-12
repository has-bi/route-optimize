"use client";

import { useState, useEffect } from "react";

export default function SmartStoreInput({
  store,
  onUpdate,
  onRemove,
  index,
  isCollapsed,
  onToggleCollapse,
}) {
  const [loading, setLoading] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const [error, setError] = useState("");

  // Check if store is considered "complete"
  const isComplete =
    store.storeName &&
    store.coordinates &&
    (store.distributorId || store.distributorId === "0");

  // Handle distributor ID change and auto-fetch store data
  const handleDistributorIdChange = async (distributorId) => {
    onUpdate("distributorId", distributorId);
    setError("");
    setAutoFilled(false);

    if (!distributorId || distributorId.trim() === "") {
      onUpdate("storeName", "");
      onUpdate("coordinates", "");
      return;
    }

    if (distributorId === "0") {
      onUpdate("storeName", "");
      onUpdate("coordinates", "");
      setError("Mode manual - isi nama toko dan koordinat");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/stores/${encodeURIComponent(distributorId)}`
      );

      if (response.ok) {
        const data = await response.json();

        if (data.store) {
          onUpdate("storeName", data.store.storeName);
          onUpdate("coordinates", data.store.coordinates);
          setAutoFilled(true);
          setError("");
        } else {
          setError("Distributor ID tidak ditemukan - isi manual");
          onUpdate("storeName", "");
          onUpdate("coordinates", "");
        }
      } else {
        setError("Gagal mengambil data toko - isi manual");
        onUpdate("storeName", "");
        onUpdate("coordinates", "");
      }
    } catch (error) {
      console.error("Error fetching store:", error);
      setError("Gagal mengambil data toko - isi manual");
      onUpdate("storeName", "");
      onUpdate("coordinates", "");
    } finally {
      setLoading(false);
    }
  };

  const isAutoFilled =
    autoFilled && store.distributorId && store.distributorId !== "0";

  // Render minimized card
  if (isCollapsed && isComplete) {
    return (
      <div
        className="border border-gray-200 bg-gray-50 p-4 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={onToggleCollapse}
      >
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                #{index + 1}
              </span>
              <span className="font-medium text-gray-900">
                {store.storeName}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
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
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span>📍 {store.coordinates}</span>
              <span>⏱️ {store.visitTime} menit</span>
              {store.distributorId && store.distributorId !== "0" && (
                <span>🏪 ID: {store.distributorId}</span>
              )}
              {autoFilled && (
                <span className="text-green-600">✅ Auto-filled</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="text-red-500 hover:text-red-700 p-1"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // Render full card (expanded or new)
  return (
    <div className="border border-gray-200 p-4 rounded-md bg-white">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
            Toko #{index + 1}
          </span>
          {isComplete && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="text-gray-500 hover:text-gray-700 text-xs"
            >
              Minimize
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-500 hover:text-red-700"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        {/* Distributor ID Input */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Distributor ID
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Masukkan ID atau ketik '0' untuk manual"
              value={store.distributorId || ""}
              onChange={(e) => handleDistributorIdChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {loading && (
              <div className="absolute right-2 top-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Kosongkan atau ketik "0" untuk isi manual
          </p>
        </div>

        {/* Auto-fill Status */}
        {autoFilled && (
          <div className="bg-green-50 border border-green-200 rounded-md p-2">
            <p className="text-xs text-green-700 flex items-center">
              <svg
                className="w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Data otomatis terisi dari master data
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
            <p className="text-xs text-yellow-700 flex items-center">
              <svg
                className="w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </p>
          </div>
        )}

        {/* Store Name Input */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Nama Toko
          </label>
          <input
            type="text"
            placeholder="Nama toko"
            required
            value={store.storeName || ""}
            onChange={(e) => onUpdate("storeName", e.target.value)}
            disabled={isAutoFilled}
            className={`w-full p-2 border rounded-md text-sm ${
              isAutoFilled
                ? "bg-gray-50 border-gray-200 text-gray-600"
                : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            }`}
          />
        </div>

        {/* Coordinates Input */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Koordinat (lat,lng)
          </label>
          <input
            type="text"
            placeholder="-7.2574719,112.7520883"
            required
            value={store.coordinates || ""}
            onChange={(e) => onUpdate("coordinates", e.target.value)}
            disabled={isAutoFilled}
            className={`w-full p-2 border rounded-md text-sm ${
              isAutoFilled
                ? "bg-gray-50 border-gray-200 text-gray-600"
                : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            }`}
          />
        </div>

        {/* Priority and Visit Time */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Prioritas
            </label>
            <select
              value={store.priority || "B"}
              onChange={(e) => onUpdate("priority", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="A">Priority A (Tinggi)</option>
              <option value="B">Priority B</option>
              <option value="C">Priority C</option>
              <option value="D">Priority D (Rendah)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Waktu (menit)
            </label>
            <input
              type="number"
              min="5"
              max="120"
              value={store.visitTime || 30}
              onChange={(e) => onUpdate("visitTime", parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Complete indicator */}
        {isComplete && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
            <p className="text-xs text-blue-700 flex items-center">
              <svg
                className="w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Toko lengkap - klik "Minimize" untuk menyembunyikan
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
