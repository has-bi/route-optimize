// ===== FILE 2: ./src/components/route/RouteList.js =====
export default function RouteList({ routes, showAll = true }) {
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (routes.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">
          <svg
            className="w-12 h-12 mx-auto"
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
        <p className="text-gray-500">Belum ada rute tersimpan</p>
        <p className="text-sm text-gray-400 mt-1">
          Buat rute pertama Anda untuk mulai optimasi
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {routes.map((route) => (
        <a
          key={route.id}
          href={`/dashboard/routes/${route.id}`}
          className="block p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-medium text-gray-900">
                Rute {formatDate(route.routeDate)}
              </h3>
              <p className="text-sm text-gray-600">
                {route.stores.length} toko • Berangkat {route.departureTime}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {getStatusBadge(route.status)}
              {route.status === "OPTIMIZED" && route.totalDistance && (
                <span className="text-xs text-gray-500">
                  {route.totalDistance} km
                </span>
              )}
            </div>
          </div>

          {route.status === "OPTIMIZED" && (
            <div className="flex gap-4 text-xs text-gray-600">
              <span>
                ✅ {route.stores.filter((s) => s.status === "VISITED").length}{" "}
                dikunjungi
              </span>
              {route.stores.filter((s) => s.status === "UNREACHABLE").length >
                0 && (
                <span>
                  ⚠️{" "}
                  {
                    route.stores.filter((s) => s.status === "UNREACHABLE")
                      .length
                  }{" "}
                  tidak terjangkau
                </span>
              )}
            </div>
          )}

          {route.status === "DRAFT" && (
            <div className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded mt-2">
              💡 Belum dioptimalkan - Klik untuk melanjutkan
            </div>
          )}
        </a>
      ))}
    </div>
  );
}
