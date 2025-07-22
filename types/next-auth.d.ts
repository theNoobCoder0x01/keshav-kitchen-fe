import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      kitchenId: string
      kitchen: string
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    kitchenId: string
    kitchen: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    kitchenId: string
    kitchen: string
  }
}
