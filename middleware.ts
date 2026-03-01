import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;
        // Protect edit routes
        if (pathname.match(/^\/timeline\/.*\/edit$/)) {
          return !!token;
        }
        // Protect setup page
        if (pathname === "/setup") {
          return !!token;
        }
        return true;
      },
    },
  },
);

export const config = {
  matcher: [
    "/timeline/:id*/edit",
    "/setup",
  ],
};
