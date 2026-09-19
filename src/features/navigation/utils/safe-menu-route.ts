/**
 * Allow only same-app relative paths for menu navigation.
 * Rejects absolute URLs, protocol-relative, and javascript: schemes.
 */

const INTERNAL_PATH =
  /^\/[a-zA-Z0-9][a-zA-Z0-9/_-]*$/;

export function sanitizeMenuRoute(
  route: string | null | undefined,
): string | null {
  if (route == null) return null;
  const trimmed = route.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("http:") ||
    lower.startsWith("https:") ||
    lower.startsWith("//") ||
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.includes("://")
  ) {
    return null;
  }

  const pathOnly = trimmed.split(/[?#]/, 1)[0] ?? "";
  if (!INTERNAL_PATH.test(pathOnly)) return null;
  return pathOnly;
}

/** Safe href for next-intl Link — falls back to home when route is unsafe/missing. */
export function toSafeMenuHref(route: string | null | undefined): string {
  return sanitizeMenuRoute(route) ?? "/";
}
