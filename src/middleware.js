import { auth } from "../auth.js";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;
  const userEmail = req.auth?.user?.email;

  console.log(
    `🔐 Middleware: ${pathname} - Auth: ${isAuthenticated} - User: ${
      userEmail || "none"
    }`
  );

  // Public routes
  const publicRoutes = [
    "/auth/signin",
    "/auth/error",
    "/api/auth",
    "/favicon.ico",
    "/_next",
    "/images",
    "/api/health",
  ];

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Authentication check
  if (!isAuthenticated) {
    console.log(`❌ Unauthenticated access to: ${pathname}`);

    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Admin routes access control
  if (pathname.startsWith("/admin")) {
    const isAdmin = req.auth?.user?.isAdmin;

    if (!isAdmin) {
      console.log(`🚫 Admin access denied for: ${userEmail} to ${pathname}`);

      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }

      const dashboardUrl = new URL("/dashboard", req.url);
      dashboardUrl.searchParams.set("error", "admin_required");
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Company-specific routes
  if (pathname.startsWith("/api/stores") || pathname.startsWith("/api/debug")) {
    const isCompanyUser = req.auth?.user?.isCompanyUser;

    if (!isCompanyUser) {
      console.log(`🏢 Company access denied for: ${userEmail} to ${pathname}`);
      return NextResponse.json(
        { error: "Company access required" },
        { status: 403 }
      );
    }
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  if (userEmail) {
    console.log(`✅ Access granted: ${userEmail} → ${pathname}`);
  }

  return response;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|public).*)"],
};
