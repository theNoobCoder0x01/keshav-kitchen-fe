import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      kitchenId: string | null
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: string
    kitchenId: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    kitchenId: string | null
  }
}
