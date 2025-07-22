import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Public routes that don't require authentication
  const publicRoutes = ["/auth/signin", "/auth/signup", "/auth/error"]
  const isPublicRoute = publicRoutes.includes(pathname)

  // API routes that should be accessible
  const isApiRoute = pathname.startsWith("/api/")

  // Allow API routes to pass through
  if (isApiRoute) {
    return NextResponse.next()
  }

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Redirect non-logged-in users to signin (except for public routes)
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/auth/signin", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
