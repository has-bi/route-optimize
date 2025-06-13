import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./src/lib/prisma.js";

// Access control functions
function isWhitelistedEmail(email) {
  const whitelistEnv = process.env.EXTERNAL_EMAIL_WHITELIST || "";
  if (!whitelistEnv.trim()) return false;

  const whitelist = whitelistEnv
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  return whitelist.includes(email.toLowerCase().trim());
}

function isCompanyEmail(email) {
  return email.toLowerCase().endsWith("@youvit.co.id");
}

function isAdmin(email) {
  const adminEmails = ["admin@youvit.co.id", "cto@youvit.co.id"];
  return adminEmails.includes(email.toLowerCase());
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  session: {
    strategy: "jwt", // Using JWT to avoid Prisma Edge Runtime issues
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        console.log("🔐 SignIn Callback - Raw Data:");
        console.log("  User:", JSON.stringify(user, null, 2));
        console.log("  Account:", JSON.stringify(account, null, 2));
        console.log("  Profile:", JSON.stringify(profile, null, 2));

        const email = user.email?.toLowerCase().trim();

        if (!email) {
          console.log("❌ No email provided in sign-in");
          return false;
        }

        console.log("🔍 Processing email:", email);

        // Check access control
        if (isCompanyEmail(email)) {
          console.log("✅ Access granted: Company user -", email);
          return true;
        }

        if (isWhitelistedEmail(email)) {
          console.log("✅ Access granted: Whitelisted external user -", email);
          return true;
        }

        console.log("❌ Access denied:", email, "- Not company or whitelisted");
        return false;
      } catch (error) {
        console.error("💥 Sign-in callback error:", error);
        return false;
      }
    },

    async jwt({ token, user, account, trigger }) {
      console.log("🔑 JWT Callback - Trigger:", trigger);

      if (user) {
        console.log("🔑 JWT - Creating token for user:");
        console.log("  User ID:", user.id);
        console.log("  User Email:", user.email);
        console.log("  User Name:", user.name);

        const email = user.email?.toLowerCase().trim();

        // CRITICAL: Store the EXACT email from the user object
        token.userId = user.id;
        token.email = email; // This should be the Google account email
        token.name = user.name;
        token.image = user.image;
        token.userType = isCompanyEmail(email) ? "COMPANY" : "EXTERNAL";
        token.isCompanyUser = isCompanyEmail(email);
        token.isAdmin = isAdmin(email);

        console.log("🔑 JWT Token created:");
        console.log("  Token Email:", token.email);
        console.log("  Token Type:", token.userType);
        console.log("  Token User ID:", token.userId);
      }

      return token;
    },

    async session({ session, token }) {
      console.log("🔒 Session Callback:");
      console.log("  Token Email:", token.email);
      console.log("  Session User Email:", session.user?.email);

      if (token) {
        // CRITICAL: Use token data, not session.user
        session.user.id = token.userId;
        session.user.email = token.email; // Use email from token
        session.user.name = token.name;
        session.user.image = token.image;
        session.user.userType = token.userType;
        session.user.isCompanyUser = token.isCompanyUser;
        session.user.isAdmin = token.isAdmin;

        // Add feature flags
        session.user.features = {
          canCreateRoutes: true,
          canViewAnalytics: token.isCompanyUser,
          canAccessMasterData: token.isCompanyUser,
          canManageUsers: token.isAdmin,
        };

        console.log("🔒 Final Session User:");
        console.log("  Email:", session.user.email);
        console.log("  Type:", session.user.userType);
        console.log("  ID:", session.user.id);
      }

      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      console.log(
        `✅ Event - User signed in: ${user.email} (new: ${isNewUser})`
      );

      // Check if this creates confusion in database
      try {
        console.log("💾 Saving user to database...");

        const savedUser = await prisma.user.upsert({
          where: { email: user.email }, // Use exact email
          update: {
            name: user.name,
            image: user.image,
            updatedAt: new Date(),
          },
          create: {
            email: user.email, // Use exact email
            name: user.name || null,
            image: user.image || null,
            emailVerified: new Date(),
          },
        });

        console.log("💾 User saved to database:");
        console.log("  DB User ID:", savedUser.id);
        console.log("  DB User Email:", savedUser.email);
      } catch (error) {
        console.error("💥 Error saving user to database:", error);
      }
    },

    async signOut({ session }) {
      console.log(`👋 User signed out: ${session?.user?.email}`);
    },
  },

  debug: process.env.NODE_ENV === "development",
});

// Debug function to check database state
export async function debugUserDatabase() {
  try {
    console.log("🔍 Current users in database:");

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    users.forEach((user) => {
      console.log(
        `  - ${user.email} (ID: ${user.id}, Created: ${user.createdAt})`
      );
    });

    // Check accounts table for OAuth connections
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        userId: true,
        provider: true,
        providerAccountId: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    console.log("🔍 OAuth accounts in database:");
    accounts.forEach((account) => {
      console.log(
        `  - Provider: ${account.provider}, User: ${account.user.email}, Account ID: ${account.providerAccountId}`
      );
    });

    return { users, accounts };
  } catch (error) {
    console.error("Error debugging database:", error);
    return null;
  }
}

// Utility function for admin dashboard
export async function getUserAccessInfo(email) {
  try {
    const emailLower = email.toLowerCase().trim();

    const isCompany = isCompanyEmail(emailLower);
    const isWhitelisted = isWhitelistedEmail(emailLower);
    const userIsAdmin = isAdmin(emailLower);

    let existingUser = null;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email: emailLower },
        select: { id: true, email: true, createdAt: true },
      });
    } catch (prismaError) {
      console.error("Prisma error in getUserAccessInfo:", prismaError);
    }

    let allowed = false;
    let reason = "";
    let userType = null;

    if (isCompany) {
      allowed = true;
      reason = "Company domain access";
      userType = "COMPANY";
    } else if (isWhitelisted) {
      allowed = true;
      reason = "Whitelisted external user";
      userType = "EXTERNAL";
    } else {
      allowed = false;
      reason = "Not authorized - contact admin for access";
      userType = null;
    }

    return {
      allowed,
      reason,
      userType,
      isCompanyEmail: isCompany,
      isAdmin: userIsAdmin,
      isWhitelisted: isWhitelisted,
      existingUser: !!existingUser,
    };
  } catch (error) {
    console.error("Error getting user access info:", error);
    return {
      allowed: false,
      reason: "System error during access check",
      userType: null,
      isCompanyEmail: false,
      isAdmin: false,
      isWhitelisted: false,
      existingUser: false,
    };
  }
}
