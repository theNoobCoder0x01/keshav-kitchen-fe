declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      kitchenId: string | null
      kitchenName: string | null
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    kitchenId: string | null
    kitchenName: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    kitchenId: string | null
    kitchenName: string | null
  }
}
