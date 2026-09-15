import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/prisma/connection";
import argon2 from "argon2";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image: string;
      role: "USER" | "ADMIN";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "USER" | "ADMIN";
  }
}

// Shared credential verification. Throws a stable error code in place of the
// NextAuth generic "CredentialsSignin" so UIs can map it to a friendly message.
type VerifiedUser = Awaited<ReturnType<typeof prisma.user.findFirst>>;

async function verifyCredentials(
  credentials: { email?: string; password?: string } | undefined,
): Promise<VerifiedUser> {
  const user = await prisma.user.findFirst({
    where: { email: credentials?.email },
  });
  if (!user) {
    throw new Error("No user found with the given email");
  }
  if (!credentials?.password) {
    throw new Error("Password is required");
  }
  if (!user.password) {
    throw new Error("This account uses OAuth. Please sign in with Google or GitHub");
  }
  const isValid = await argon2.verify(user.password, credentials.password);
  if (!isValid) throw new Error("Invalid email or password");

  if (user.isSuspended) {
    throw new Error("Your account has been suspended. Contact an administrator.");
  }

  // Check if email is verified
  if (!user.emailVerified) {
    throw new Error("EMAIL_NOT_VERIFIED");
  }
  return user;
}

export const authOptions:NextAuthOptions = {
  // Configure one or more authentication providers
  providers: [
    CredentialsProvider({
    name: "Email and Password",
    credentials: {
      email: { label: "Email", type: "text" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
        try {
            return await verifyCredentials(credentials);
        } catch (_error) {
            throw new Error("Check your credentials")
        }
    }
  }),
  // Dedicated admin-only credentials flow. The main session cookie is shared
  // with regular users, but this provider refuses to sign in anyone who is
  // not an ADMIN, and the signIn callback below re-verifies it server-side.
  CredentialsProvider({
    id: "admin-credentials",
    name: "Admin",
    credentials: {
      email: { label: "Email", type: "text" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      let user;
      try {
        user = await verifyCredentials(credentials);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Check your credentials";
        if (message === "EMAIL_NOT_VERIFIED") throw new Error("ADMIN_EMAIL_NOT_VERIFIED");
        if (message.includes("suspended")) throw new Error("ADMIN_SUSPENDED");
        throw new Error("INVALID_ADMIN_CREDENTIALS");
      }
      if (!user || user.role !== "ADMIN") {
        throw new Error("NOT_ADMIN");
      }
      return user;
    }
  }),
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!
  })
  ],
  callbacks: {
    async signIn({ user, account}) {
      // Defense in depth: only sign users in through the admin provider if the
      // DB row really is an ADMIN.
      if (account?.provider === "admin-credentials") {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { role: true, isSuspended: true, emailVerified: true },
        });
        if (
          !dbUser ||
          dbUser.role !== "ADMIN" ||
          dbUser.isSuspended ||
          !dbUser.emailVerified
        ) {
          return false;
        }
      }
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findFirst({ where: { email: user.email! } });
        if (existingUser?.isSuspended) {
          return false;
        }
        if (!existingUser) {
          await prisma.user.create({
            data: {
              name: user.name!,
              email: user.email!,
              image: user.image!
            },
          });
        }
      }
      return true
    },
    async jwt({ token, trigger, session }) {
      if (
        trigger === "update" &&
        session &&
        typeof session === "object" &&
        "image" in session &&
        typeof session.image === "string"
      ) {
        token.picture = session.image;
      }
      if (token.email) {
        const dbUser = await prisma.user.findFirst({
          where: { email: token.email },
          select: { id: true, role: true },
        });
        if (dbUser) {
          token.sub = dbUser.id;
          // Always refresh role so demotions/promotions apply without a re-login.
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session }) {
      const loggedInUser = await prisma.user.findFirst({
         where: { email: session.user?.email },
         select: { id: true, role: true, isSuspended: true }
        });
      if (!loggedInUser || loggedInUser.isSuspended) {
        // User was deleted or suspended (e.g. by an admin); keep the session
        // shape valid instead of throwing a 500 on every authenticated request.
        return { ...session, user: { ...session.user, id: "", role: "USER" } };
      }
      session.user.id = loggedInUser.id;
      session.user.name = session.user.name!;
      session.user.email = session.user.email!;
      session.user.image = session.user.image!;
      session.user.role = loggedInUser.role;

      return session
    },
}
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
