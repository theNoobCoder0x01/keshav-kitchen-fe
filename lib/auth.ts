import { prisma } from "@/lib/prisma";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { hashPassword, verifyPassword, isBcryptHash } from "@/lib/crypto-utils";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
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

          // Handle both new Web Crypto hashes and legacy bcrypt hashes
          let isPasswordValid = false;
          
          if (isBcryptHash(user.password)) {
            // Legacy bcrypt hash - you might want to migrate this
            // For now, we'll need to keep bcrypt for existing hashes
            // Consider implementing a migration strategy during login
            console.warn('Legacy bcrypt hash detected for user:', user.email);
            
            // Temporary: Import bcrypt only when needed
            const bcrypt = await import("bcryptjs");
            isPasswordValid = await bcrypt.compare(
              credentials.password as string,
              user.password,
            );
            
            // Optional: Migrate to new format after successful verification
            if (isPasswordValid) {
              try {
                const newHash = await hashPassword(credentials.password as string);
                await prisma.user.update({
                  where: { id: user.id },
                  data: { password: newHash },
                });
                console.log('Migrated user password to Web Crypto format:', user.email);
              } catch (error) {
                console.error('Failed to migrate password:', error);
                // Don't fail login if migration fails
              }
            }
          } else {
            // New Web Crypto hash
            isPasswordValid = await verifyPassword(
              credentials.password as string,
              user.password,
            );
          }

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            kitchenId: user.kitchenId,
            kitchenName: user.kitchen?.name,
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
});
