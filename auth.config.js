// auth.config.js - JWT Strategy for Edge Compatibility (FIXED)
import Google from "next-auth/providers/google";

// Helper function for access control
function determineUserAccess(email) {
  if (!email) return { allowed: false, userType: "BLOCKED", isAdmin: false };

  const cleanEmail = email.toLowerCase().trim();

  // Company email check
  if (cleanEmail.endsWith("@youvit.co.id")) {
    const adminEmails = ["bi@youvit.co.id", "hasbi@youvit.co.id"];
    return {
      allowed: true,
      userType: "COMPANY",
      isAdmin: adminEmails.includes(cleanEmail),
    };
  }

  // External whitelist check
  const whitelist = (process.env.EXTERNAL_EMAIL_WHITELIST || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  if (whitelist.includes(cleanEmail)) {
    return {
      allowed: true,
      userType: "EXTERNAL",
      isAdmin: false,
    };
  }

  return { allowed: false, userType: "BLOCKED", isAdmin: false };
}

// Shared auth configuration
export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  // ✅ CRITICAL FIX: Force JWT everywhere for compatibility
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    // ✅ FIXED: Consistent JWT handling
    async signIn({ user, account, profile }) {
      if (!user.email) {
        console.log("SignIn denied: No email");
        return false;
      }

      const access = determineUserAccess(user.email);

      if (!access.allowed) {
        console.log("SignIn denied:", user.email, "- blocked user");
        return false;
      }

      console.log("SignIn approved:", user.email, access.userType);
      return true;
    },

    // ✅ FIXED: JWT callback for token enrichment
    async jwt({ token, user, account }) {
      // On sign in, add user properties to token
      if (user?.email) {
        const access = determineUserAccess(user.email);
        token.userType = access.userType;
        token.isAdmin = access.isAdmin;
        token.isCompanyUser = access.userType === "COMPANY";
        token.allowed = access.allowed;
      }
      return token;
    },

    // ✅ FIXED: Session callback for client
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub;
        session.user.userType = token.userType;
        session.user.isAdmin = token.isAdmin;
        session.user.isCompanyUser = token.isCompanyUser;
      }
      return session;
    },

    // ✅ FIXED: Middleware authorization
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

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
      if (isPublicRoute) return true;

      // Require login for protected routes
      if (!isLoggedIn) return false;

      // Check user access from JWT token
      const userType = auth.user?.userType;
      if (userType === "BLOCKED") return false;

      return true;
    },
  },
};
