// src/auth.js - NextAuth v5 configuration (simple & pragmatic)
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // ❌ Remove Prisma adapter temporarily to fix edge runtime issue
  // adapter: PrismaAdapter(prisma),

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          scope: "openid email profile",
          hd: "youvit.co.id", // Restrict to company domain
        },
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt", // Use JWT instead of database sessions (fixes edge runtime)
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    // Validate company email domain
    async signIn({ user, account, profile }) {
      // Only allow @youvit.co.id emails
      if (user.email && user.email.endsWith("@youvit.co.id")) {
        return true;
      }

      console.warn(`Unauthorized login attempt: ${user.email}`);
      return false;
    },

    // Add user info to JWT
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.isCompanyUser = user.email.endsWith("@youvit.co.id");
        token.domain = user.email.split("@")[1];
      }
      return token;
    },

    // Add user info to session
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.image;
        session.user.isCompanyUser = token.isCompanyUser;
        session.user.domain = token.domain;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      console.log(`Company user signed in: ${user.email}`);
    },
  },
  debug: process.env.NODE_ENV === "development",
});
