import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "../auth.config.js";

// Create Edge-compatible auth function
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const pathname = req.nextUrl.pathname;
  const isAuthenticated = !!req.auth;
  const userEmail = req.auth?.user?.email || "none";

  console.log(
    "🔒 Middleware:",
    pathname,
    "Auth:",
    isAuthenticated,
    "User:",
    userEmail
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

  // Check public routes
  for (const route of publicRoutes) {
    if (pathname.startsWith(route)) {
      return NextResponse.next();
    }
  }

  // Check authentication
  if (!isAuthenticated) {
    console.log("❌ Unauthenticated access to:", pathname);

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

  // Get user info from JWT token
  const userType = req.auth.user?.userType;
  const isAdmin = req.auth.user?.isAdmin;
  const isCompanyUser = req.auth.user?.isCompanyUser;

  // Block unauthorized users
  if (userType === "BLOCKED") {
    console.log("🚫 Blocked user access:", userEmail);

    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.redirect(
      new URL("/auth/error?error=AccessDenied", req.url)
    );
  }

  // Admin routes (only for admins)
  if (pathname.startsWith("/admin")) {
    if (!isAdmin) {
      console.log("🔐 Admin access denied for:", userEmail);

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

  // UPDATED: Stores and debug APIs - allow all authenticated users
  // Remove the company-only restriction since both company and whitelisted external users should have access
  if (pathname.startsWith("/api/stores") || pathname.startsWith("/api/debug")) {
    // All authenticated users can access these APIs
    console.log("✅ Stores/Debug API access granted for:", userEmail);
  }

  // Security headers
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  console.log("✅ Access granted:", userEmail, "to", pathname);
  return response;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|public).*)"],
};
