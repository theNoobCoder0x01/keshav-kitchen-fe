import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }
  return session
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth()
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error("Insufficient permissions")
  }
  return session
}

export async function getCurrentUser() {
  const session = await auth()
  return session?.user || null
}
