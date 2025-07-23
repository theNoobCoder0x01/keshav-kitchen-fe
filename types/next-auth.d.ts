import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      kitchenId: string | null
      kitchen?: {
        id: string
        name: string
      } | null
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    kitchenId: string | null
    kitchen?: {
      id: string
      name: string
    } | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    kitchenId: string | null
    kitchen?: {
      id: string
      name: string
    } | null
  }
}
