import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    // Players may never reach /admin pages, even if they guess the URL.
    if (pathname.startsWith("/admin") && role === "PLAYER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      // Any matched route requires a valid session at minimum.
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/login" },
  }
);

// Everything under /dashboard and /admin requires authentication.
// Public routes (/, /login, /register, /forgot-password, /api/auth/*) are untouched.
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
