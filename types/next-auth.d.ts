import type { DefaultSession, DefaultUser } from "next-auth"
import type { DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      kitchenId: string | null
      kitchen?: {
        id: string
        name: string
        location?: string | null
        description?: string | null
      } | null
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: string
    kitchenId: string | null
    kitchen?: {
      id: string
      name: string
      location?: string | null
      description?: string | null
    } | null
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: string
    kitchenId: string | null
    kitchen?: {
      id: string
      name: string
      location?: string | null
      description?: string | null
    } | null
  }
}
