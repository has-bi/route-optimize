import Link from "next/link";

export default async function AuthError({ searchParams }) {
  const resolvedParams = await searchParams;
  const error = resolvedParams?.error;

  const getErrorContent = (errorType) => {
    switch (errorType) {
      case "AccessDenied":
        return {
          title: "🚫 Akses Ditolak",
          message:
            "Maaf, Anda tidak memiliki izin untuk mengakses aplikasi ini.",
          details: [
            "• Pastikan Anda menggunakan email @youvit.co.id, atau",
            "• Email Anda sudah terdaftar dalam whitelist eksternal",
            "• Hubungi administrator untuk mendapatkan akses",
          ],
          action: "Coba dengan email lain atau hubungi admin",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-800",
          iconColor: "text-red-600",
        };

      case "OAuthSignin":
      case "OAuthCallback":
        return {
          title: "⚠️ Masalah Login",
          message: "Terjadi kesalahan saat login dengan Google.",
          details: [
            "• Pastikan koneksi internet stabil",
            "• Coba hapus cache browser dan login ulang",
            "• Gunakan mode incognito/private browsing",
          ],
          action: "Silakan coba login kembali",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          textColor: "text-yellow-800",
          iconColor: "text-yellow-600",
        };

      case "SessionRequired":
        return {
          title: "🔐 Sesi Berakhir",
          message: "Sesi login Anda telah berakhir atau tidak valid.",
          details: [
            "• Sesi login otomatis berakhir setelah 30 hari",
            "• Login diperlukan untuk mengakses fitur ini",
          ],
          action: "Silakan login kembali",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          textColor: "text-blue-800",
          iconColor: "text-blue-600",
        };

      default:
        return {
          title: "❌ Kesalahan Sistem",
          message: "Terjadi kesalahan yang tidak terduga.",
          details: [
            "• Kesalahan teknis pada server",
            "• Silakan coba beberapa saat lagi",
          ],
          action: "Hubungi support jika masalah berlanjut",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          textColor: "text-gray-800",
          iconColor: "text-gray-600",
        };
    }
  };

  const errorContent = getErrorContent(error);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-md">
        {/* Error Card */}
        <div
          className={`${errorContent.bgColor} ${errorContent.borderColor} border rounded-lg p-6 shadow-lg`}
        >
          <div className="text-center mb-6">
            <div
              className={`w-16 h-16 ${errorContent.bgColor} rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-white`}
            >
              <span className={`text-2xl ${errorContent.iconColor}`}>
                {error === "AccessDenied"
                  ? "🚫"
                  : error === "SessionRequired"
                  ? "🔐"
                  : error?.includes("OAuth")
                  ? "⚠️"
                  : "❌"}
              </span>
            </div>

            <h1 className={`text-xl font-bold ${errorContent.textColor} mb-2`}>
              {errorContent.title}
            </h1>

            <p className={`${errorContent.textColor} opacity-90`}>
              {errorContent.message}
            </p>
          </div>

          {/* Error Details */}
          <div
            className={`${errorContent.bgColor} rounded-md p-4 mb-6 border ${errorContent.borderColor}`}
          >
            <h3 className={`font-semibold ${errorContent.textColor} mb-2`}>
              Kemungkinan penyebab:
            </h3>
            <ul
              className={`text-sm ${errorContent.textColor} opacity-80 space-y-1`}
            >
              {errorContent.details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          </div>

          {/* Action Message */}
          <div
            className={`text-center text-sm ${errorContent.textColor} opacity-90 mb-6`}
          >
            💡 {errorContent.action}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/auth/signin"
              className="block w-full text-center bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 font-medium transition-colors"
            >
              🔄 Coba Login Lagi
            </Link>

            <div className="flex gap-3">
              <Link
                href="/"
                className="flex-1 text-center bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 text-sm transition-colors"
              >
                🏠 Home
              </Link>

              <a
                href="mailto:admin@youvit.co.id?subject=Route Optimizer Access Request"
                className="flex-1 text-center bg-green-100 text-green-700 py-2 px-4 rounded-md hover:bg-green-200 text-sm transition-colors"
              >
                📧 Hubungi Admin
              </a>
            </div>
          </div>
        </div>

        {/* Debug Info (Development Only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-3">
            <h3 className="font-medium text-blue-800 mb-2">🔧 Debug Info</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <p>
                <strong>Error Type:</strong> {error || "unknown"}
              </p>
              <p>
                <strong>URL:</strong>{" "}
                {typeof window !== "undefined" ? window.location.href : "N/A"}
              </p>
              <p>
                <strong>Timestamp:</strong> {new Date().toISOString()}
              </p>
            </div>
          </div>
        )}

        {/* Access Request Info */}
        {error === "AccessDenied" && (
          <div className="mt-6 bg-white border border-gray-200 rounded-md p-4">
            <h3 className="font-semibold text-gray-800 mb-2">
              📝 Request Access
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Jika Anda memerlukan akses ke aplikasi ini, silakan hubungi
              administrator dengan informasi berikut:
            </p>
            <div className="bg-gray-50 rounded-md p-3 text-xs text-gray-700">
              <p>
                <strong>Email:</strong> [Your Email Address]
              </p>
              <p>
                <strong>Nama:</strong> [Your Full Name]
              </p>
              <p>
                <strong>Keperluan:</strong> Access to Route Optimizer
              </p>
              <p>
                <strong>Tanggal:</strong>{" "}
                {new Date().toLocaleDateString("id-ID")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
