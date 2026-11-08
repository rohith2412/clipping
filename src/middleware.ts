import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

const publicRoutes = [
  "/",
  "/pricing",
  "/features",
  "/how-it-works",
  "/blog",
  "/legal",
  "/contact",
];

function isPublicRoute(pathname: string) {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isAuthenticated = !!req.auth?.user;

  if (
    isPublicRoute(pathname) ||
    pathname.startsWith("/api/webhooks") ||
    pathname === "/api/health" ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  const isAuthRoute =
    pathname.startsWith("/signin") || pathname.startsWith("/signup");
  if (isAuthRoute) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(
      new URL(`/signin?callbackUrl=${callbackUrl}`, nextUrl)
    );
  }

  if (
    pathname.startsWith("/admin") &&
    req.auth?.user?.role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.svg|og-image.png|fonts/).*)",
  ],
};
