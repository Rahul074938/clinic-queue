import type { DefaultSession } from "next-auth";

/**
 * Augment the NextAuth session/user types to include custom fields
 * (role, id) that we set in the jwt + session callbacks in lib/auth.ts.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}
