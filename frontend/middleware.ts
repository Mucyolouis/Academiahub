import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;

    // The admin login page is public; already-signed-in admins get bounced
    // straight to the panel.
    if (pathname === "/admin/login") {
      if (req.nextauth.token?.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.next();
    }

    if (req.nextauth.token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Let the public admin login page through for everyone.
        if (req.nextUrl.pathname === "/admin/login") return true;
        return !!token;
      },
    },
    pages: { signIn: "/admin/login" },
  },
);

export const config = {
  matcher: ["/admin/:path*"],
};