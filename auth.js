// auth.js - FIXED: Use JWT strategy everywhere for consistency
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./src/lib/prisma.js";
import { authConfig } from "./auth.config.js";

// Helper functions for database operations (separate from auth)
export async function getUserAccessInfo(email) {
  if (!email) {
    return {
      allowed: false,
      userType: null,
      isAdmin: false,
      reason: "No email provided",
    };
  }

  const cleanEmail = email.toLowerCase().trim();

  if (cleanEmail.endsWith("@youvit.co.id")) {
    const adminEmails = ["bi@youvit.co.id", "hasbi@youvit.co.id"];
    return {
      allowed: true,
      userType: "COMPANY",
      isAdmin: adminEmails.includes(cleanEmail),
      reason: "Company domain access",
    };
  }

  const whitelist = (process.env.EXTERNAL_EMAIL_WHITELIST || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  if (whitelist.includes(cleanEmail)) {
    return {
      allowed: true,
      userType: "EXTERNAL",
      isAdmin: false,
      reason: "Whitelisted external user",
    };
  }

  return {
    allowed: false,
    userType: null,
    isAdmin: false,
    reason: "Not authorized - contact admin for access",
  };
}

// Helper function to ensure user exists in database (for routes/data)
export async function ensureUserInDatabase(session) {
  if (!session?.user?.email) return null;

  try {
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    // Create user if doesn't exist
    if (!user) {
      console.log("Creating user in database:", session.user.email);
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || null,
          image: session.user.image || null,
          emailVerified: new Date(),
        },
      });
    }

    return user;
  } catch (error) {
    console.error("Error ensuring user in database:", error);
    return null;
  }
}

export async function debugUserDatabase() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            routes: true,
            sessions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return {
      totalUsers: users.length,
      recentUsers: users,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Debug database error:", error);
    return { error: error.message };
  }
}

// ✅ CRITICAL FIX: Use JWT strategy everywhere (no database sessions)
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  // ✅ REMOVE DATABASE ADAPTER for session compatibility
  // adapter: PrismaAdapter(prisma), // ← COMMENTED OUT

  // ✅ FORCE JWT strategy for consistency with middleware
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Keep all callbacks from authConfig
  callbacks: {
    ...authConfig.callbacks,

    // Enhanced signIn callback with logging
    async signIn({ user, account, profile }) {
      const result = await authConfig.callbacks.signIn({
        user,
        account,
        profile,
      });

      // Optionally create user in database for data operations
      if (result && user.email) {
        try {
          await ensureUserInDatabase({ user });
        } catch (error) {
          console.error("Database user creation failed:", error);
          // Don't fail auth if database is down
        }
      }

      return result;
    },
  },

  events: {
    async signIn({ user, isNewUser }) {
      console.log(
        "User signed in:",
        user.email,
        isNewUser ? "(new)" : "(existing)"
      );
    },
    async signOut({ session }) {
      console.log("User signed out:", session?.user?.email || "unknown");
    },
  },
});
