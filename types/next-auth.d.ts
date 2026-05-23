import type { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      premiseId: string | null;
      premiseName: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    premiseId: string | null;
    premiseName: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: string;
    premiseId: string | null;
    premiseName: string | null;
  }
}
