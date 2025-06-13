import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./src/lib/prisma.js";

// Access control functions (same as before)
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
      // 🔥 ADD THIS: Allow profile updates
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        console.log("🔐 Sign-in attempt:", {
          email: user.email,
          name: user.name,
          provider: account.provider,
          accountId: account.providerAccountId,
        });

        const email = user.email.toLowerCase().trim();

        // Check access control
        if (isCompanyEmail(email)) {
          console.log("✅ Company user access granted:", email);
          return true;
        }

        if (isWhitelistedEmail(email)) {
          console.log("✅ Whitelisted external user access granted:", email);
          return true;
        }

        console.log("❌ Access denied:", email);
        return false;
      } catch (error) {
        console.error("💥 Sign-in callback error:", error);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      if (user) {
        const email = user.email.toLowerCase().trim();
        token.userId = user.id;
        token.email = email;
        token.name = user.name;
        token.userType = isCompanyEmail(email) ? "COMPANY" : "EXTERNAL";
        token.isCompanyUser = isCompanyEmail(email);
        token.isAdmin = isAdmin(email);

        console.log("🔑 JWT created for:", email, "Type:", token.userType);
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.userType = token.userType;
        session.user.isCompanyUser = token.isCompanyUser;
        session.user.isAdmin = token.isAdmin;

        session.user.features = {
          canCreateRoutes: true,
          canViewAnalytics: token.isCompanyUser,
          canAccessMasterData: token.isCompanyUser,
          canManageUsers: token.isAdmin,
        };
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
      console.log(`✅ User signed in: ${user.email} (new: ${isNewUser})`);

      try {
        // Upsert user to ensure database consistency
        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            image: user.image,
            updatedAt: new Date(),
          },
          create: {
            email: user.email,
            name: user.name || null,
            image: user.image || null,
            emailVerified: new Date(),
          },
        });
      } catch (error) {
        console.error("Error saving user to database:", error);
      }
    },
  },

  debug: process.env.NODE_ENV === "development",
});

// Utility functions remain the same...
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
