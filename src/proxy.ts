import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing, isAppLocale } from "@/i18n/routing";
import {
  AUTH_SESSION_COOKIE,
  isAuthPublicPath,
} from "@/lib/auth/constants";
import { readSessionFromRequest } from "@/lib/auth/session-edge";
import { requiresHeadOfficePath } from "@/lib/permissions";

const intlMiddleware = createMiddleware(routing);

/**
 * Strip any leading locale segment(s) so paths like `/or/bn/login` become `/login`.
 * With `localePrefix: "never"` public URLs have no locale; this still cleans legacy/bad URLs.
 */
function getPathnameWithoutLocale(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  while (segments.length > 0 && isAppLocale(segments[0]!)) {
    segments.shift();
  }
  return segments.length > 0 ? `/${segments.join("/")}` : "/";
}

/**
 * Next.js 16+: file convention is `proxy.ts` (middleware.ts is deprecated).
 * next-intl still uses createMiddleware(); we compose auth around it here.
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes are authenticated inside handlers via server session — skip here.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Force-clean legacy prefixed URLs: /en/login → /login (cookie keeps locale).
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && isAppLocale(segments[0]!)) {
    const cleaned = getPathnameWithoutLocale(pathname);
    const url = request.nextUrl.clone();
    url.pathname = cleaned;
    url.search = request.nextUrl.search;
    const response = NextResponse.redirect(url);
    // Persist the locale from the old prefix so the language still applies.
    response.cookies.set("NEXT_LOCALE", segments[0]!, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  const pathnameWithoutLocale = getPathnameWithoutLocale(pathname);
  const isPublic = isAuthPublicPath(pathnameWithoutLocale);
  const session = await readSessionFromRequest(request);
  const isAuthenticated = session !== null;

  // Protect authenticated app routes (everything under (app) except auth pages).
  if (!isPublic && !isAuthenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    const redirectResponse = NextResponse.redirect(loginUrl);
    if (request.cookies.has(AUTH_SESSION_COOKIE)) {
      redirectResponse.cookies.set(AUTH_SESSION_COOKIE, "", {
        httpOnly: true,
        path: "/",
        maxAge: 0,
      });
    }
    return redirectResponse;
  }

  // Authenticated users hitting login go to home (no locale prefix in URL).
  if (isAuthenticated && pathnameWithoutLocale === "/login") {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/dashboard";
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
    homeUrl.pathname = "/dashboard";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
