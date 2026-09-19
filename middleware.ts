import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import {
  AUTH_SESSION_COOKIE,
  isAuthPublicPath,
} from "@/lib/auth/constants";
import { readSessionFromRequest } from "@/lib/auth/session-edge";
import { requiresHeadOfficePath } from "@/lib/permissions";

const intlMiddleware = createMiddleware(routing);

function getLocaleFromPathname(pathname: string): string {
  const segment = pathname.split("/")[1];
  if (segment && routing.locales.includes(segment as (typeof routing.locales)[number])) {
    return segment;
  }
  return routing.defaultLocale;
}

function getPathnameWithoutLocale(pathname: string): string {
  const segments = pathname.split("/");
  const maybeLocale = segments[1];
  if (
    maybeLocale &&
    routing.locales.includes(maybeLocale as (typeof routing.locales)[number])
  ) {
    const rest = segments.slice(2).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname || "/";
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes are authenticated inside handlers via server session — skip here.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const locale = getLocaleFromPathname(pathname);
  const pathnameWithoutLocale = getPathnameWithoutLocale(pathname);
  const isPublic = isAuthPublicPath(pathnameWithoutLocale);
  const session = await readSessionFromRequest(request);
  const isAuthenticated = session !== null;

  // Protect authenticated app routes (everything under (app) except auth pages).
  if (!isPublic && !isAuthenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${locale}/login`;
    loginUrl.search = "";
    const redirectResponse = NextResponse.redirect(loginUrl);
    // Clear stale/invalid cookie if present but unreadable/expired.
    if (request.cookies.has(AUTH_SESSION_COOKIE)) {
      redirectResponse.cookies.set(AUTH_SESSION_COOKIE, "", {
        httpOnly: true,
        path: "/",
        maxAge: 0,
      });
    }
    return redirectResponse;
  }

  // Authenticated users hitting login go to the localized home.
  if (isAuthenticated && pathnameWithoutLocale === "/login") {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = `/${locale}`;
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  // Coarse head-office gate for sensitive pages (Laravel remains API SoT).
  if (
    isAuthenticated &&
    session &&
    requiresHeadOfficePath(pathnameWithoutLocale) &&
    !session.user.isHead
  ) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = `/${locale}`;
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/(en|bn|hi|or)/:path*", "/((?!_next|_vercel|.*\\..*).*)"],
};
