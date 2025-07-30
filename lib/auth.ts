// lib/auth.ts
import { verifyPassword } from "@/lib/crypto-utils";
import { prisma } from "@/lib/prisma";
import NextAuth, { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email as string,
            },
            include: {
              kitchen: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await verifyPassword(
            credentials.password as string,
            user.password,
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            kitchenId: user.kitchenId,
            kitchenName: user.kitchen?.name || null,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.kitchenId = user.kitchenId;
        token.kitchenName = user.kitchenName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.kitchenId = token.kitchenId as string;
        session.user.kitchenName = token.kitchenName as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
export const handlers = { GET: handler, POST: handler };
export const auth = () => getServerSession(authOptions);
