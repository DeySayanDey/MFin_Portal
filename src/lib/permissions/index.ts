/**
 * Server-side authorization helpers.
 * Frontend checks remain UX-only; BFF + Laravel enforce access.
 */

import type { AuthUser } from "@/features/auth/types/auth";

/** Sensitive app path prefixes that require head-office session users. */
const HEAD_OFFICE_PATH_PREFIXES = [
  "/master/roles",
  "/master/company-profile",
  "/master/rbi-policies",
  "/master/series",
  "/master/timings",
  "/security/audit-log",
  "/mis/audit-trail",
] as const;

export function isHeadOfficeUser(user: AuthUser): boolean {
  return user.isHead === true;
}

/**
 * Whether a locale-stripped pathname requires head-office access.
 * Used by app layout as a coarse gate; Laravel remains source of truth for APIs.
 */
export function requiresHeadOfficePath(pathname: string): boolean {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  return HEAD_OFFICE_PATH_PREFIXES.some(
    (prefix) =>
      normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}

export function canAccessAppPath(user: AuthUser, pathname: string): boolean {
  if (!requiresHeadOfficePath(pathname)) return true;
  return isHeadOfficeUser(user);
}
