import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Get the session token from the request (JWT-based session)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const isLoggedIn = !!token;

  // Public routes
  const publicRoutes = ["/auth/signin", "/auth/signup", "/auth/error"];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Redirect non-logged-in users to signin
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};