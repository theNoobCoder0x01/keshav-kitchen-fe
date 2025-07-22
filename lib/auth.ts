import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { sql } from "@/lib/db"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  adapter: {
    async createUser(user) {
      const userId = `user_${Date.now()}`
      const result = await sql`
        INSERT INTO users (id, name, email, image, email_verified)
        VALUES (${userId}, ${user.name}, ${user.email}, ${user.image}, ${user.emailVerified})
        RETURNING *
      `
      return {
        id: result[0].id,
        name: result[0].name,
        email: result[0].email,
        image: result[0].image,
        emailVerified: result[0].email_verified,
      }
    },
    async getUser(id) {
      const result = await sql`SELECT * FROM users WHERE id = ${id}`
      if (result.length === 0) return null
      const user = result[0]
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        emailVerified: user.email_verified,
      }
    },
    async getUserByEmail(email) {
      const result = await sql`SELECT * FROM users WHERE email = ${email}`
      if (result.length === 0) return null
      const user = result[0]
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        emailVerified: user.email_verified,
      }
    },
    async getUserByAccount({ providerAccountId, provider }) {
      const result = await sql`
        SELECT u.* FROM users u
        JOIN accounts a ON u.id = a.user_id
        WHERE a.provider = ${provider} AND a.provider_account_id = ${providerAccountId}
      `
      if (result.length === 0) return null
      const user = result[0]
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        emailVerified: user.email_verified,
      }
    },
    async updateUser(user) {
      const result = await sql`
        UPDATE users 
        SET name = ${user.name}, email = ${user.email}, image = ${user.image}, email_verified = ${user.emailVerified}
        WHERE id = ${user.id}
        RETURNING *
      `
      const updatedUser = result[0]
      return {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
        emailVerified: updatedUser.email_verified,
      }
    },
    async deleteUser(userId) {
      await sql`DELETE FROM users WHERE id = ${userId}`
    },
    async linkAccount(account) {
      const accountId = `acc_${Date.now()}`
      await sql`
        INSERT INTO accounts (
          id, user_id, type, provider, provider_account_id, 
          refresh_token, access_token, expires_at, token_type, scope, id_token, session_state
        )
        VALUES (
          ${accountId}, ${account.userId}, ${account.type}, ${account.provider}, ${account.providerAccountId},
          ${account.refresh_token}, ${account.access_token}, ${account.expires_at}, 
          ${account.token_type}, ${account.scope}, ${account.id_token}, ${account.session_state}
        )
      `
    },
    async unlinkAccount({ providerAccountId, provider }) {
      await sql`
        DELETE FROM accounts 
        WHERE provider = ${provider} AND provider_account_id = ${providerAccountId}
      `
    },
    async createSession({ sessionToken, userId, expires }) {
      const sessionId = `sess_${Date.now()}`
      await sql`
        INSERT INTO sessions (id, session_token, user_id, expires)
        VALUES (${sessionId}, ${sessionToken}, ${userId}, ${expires})
      `
      return { sessionToken, userId, expires }
    },
    async getSessionAndUser(sessionToken) {
      const result = await sql`
        SELECT s.*, u.* FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.session_token = ${sessionToken}
      `
      if (result.length === 0) return null
      const row = result[0]
      return {
        session: {
          sessionToken: row.session_token,
          userId: row.user_id,
          expires: row.expires,
        },
        user: {
          id: row.id,
          name: row.name,
          email: row.email,
          image: row.image,
          emailVerified: row.email_verified,
        },
      }
    },
    async updateSession({ sessionToken, expires }) {
      const result = await sql`
        UPDATE sessions 
        SET expires = ${expires}
        WHERE session_token = ${sessionToken}
        RETURNING *
      `
      if (result.length === 0) return null
      return {
        sessionToken: result[0].session_token,
        userId: result[0].user_id,
        expires: result[0].expires,
      }
    },
    async deleteSession(sessionToken) {
      await sql`DELETE FROM sessions WHERE session_token = ${sessionToken}`
    },
    async createVerificationToken({ identifier, expires, token }) {
      await sql`
        INSERT INTO verification_tokens (identifier, token, expires)
        VALUES (${identifier}, ${token}, ${expires})
      `
      return { identifier, token, expires }
    },
    async useVerificationToken({ identifier, token }) {
      const result = await sql`
        DELETE FROM verification_tokens 
        WHERE identifier = ${identifier} AND token = ${token}
        RETURNING *
      `
      if (result.length === 0) return null
      return {
        identifier: result[0].identifier,
        token: result[0].token,
        expires: result[0].expires,
      }
    },
  },
  callbacks: {
    async session({ session, token }) {
      if (token?.sub) {
        const user = await sql`
          SELECT id, name, email, image, role, kitchen_id 
          FROM users 
          WHERE id = ${token.sub}
        `
        if (user.length > 0) {
          session.user = {
            id: user[0].id,
            name: user[0].name,
            email: user[0].email,
            image: user[0].image,
            role: user[0].role,
            kitchenId: user[0].kitchen_id,
          }
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
}
