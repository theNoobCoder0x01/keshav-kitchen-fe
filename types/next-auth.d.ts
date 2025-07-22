declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      role: string
      kitchenId?: string
      kitchen?: {
        id: string
        name: string
        location?: string
      }
    }
  }

  interface User {
    id: string
    email: string
    name?: string
    role: string
    kitchenId?: string
    kitchen?: {
      id: string
      name: string
      location?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    kitchenId?: string
    kitchen?: {
      id: string
      name: string
      location?: string
    }
  }
}
