// src/app/auth/signin/page.js - Enhanced Sign-in Page

import { signIn } from "../../../../auth.js";

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        {/* Main Sign-in Card */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
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

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Route Optimizer
            </h1>
            <p className="text-gray-600">
              Login untuk mengoptimalkan rute kunjungan toko Anda
            </p>
          </div>

          {/* Google Sign-in Button */}
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <button
              type="submit"
              className="w-full min-h-[44px] bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-3 font-medium transition-colors shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Login dengan Google
            </button>
          </form>
        </div>

        {/* Access Information */}
        <div className="mt-6 bg-white/80 backdrop-blur rounded-lg p-4 border border-white/20">
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            ℹ️ Informasi Akses
          </h3>
          <div className="text-sm text-gray-600 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-medium">✅</span>
              <span>
                Email <strong>@youvit.co.id</strong> dapat langsung masuk
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-medium">📋</span>
              <span>Email eksternal perlu persetujuan admin</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-orange-600 font-medium">📧</span>
              <span>
                Hubungi <strong>admin@youvit.co.id</strong> untuk akses
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>© 2024 YouVit Route Optimizer</p>
          <p>Secure authentication powered by Google OAuth</p>
        </div>
      </div>
    </div>
  );
}
