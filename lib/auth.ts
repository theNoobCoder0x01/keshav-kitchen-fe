import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { email, password } = LoginSchema.parse(credentials)

          const users = await sql`
            SELECT u.*, k.name as kitchen_name
            FROM users u
            LEFT JOIN kitchens k ON u.kitchen_id = k.id
            WHERE u.email = ${email}
          `

          const user = users[0]

          if (!user || !(await bcrypt.compare(password, user.password))) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            kitchenId: user.kitchen_id,
            kitchen: user.kitchen_name,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.kitchenId = user.kitchenId
        token.kitchen = user.kitchen
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.kitchenId = token.kitchenId as string
        session.user.kitchen = token.kitchen as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
})
