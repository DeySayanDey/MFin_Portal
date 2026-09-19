export const AUTH_SESSION_COOKIE = "mfin_auth_session";

export const AUTH_PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
] as const;

export function isAuthPublicPath(pathnameWithoutLocale: string): boolean {
  return AUTH_PUBLIC_PATHS.some(
    (path) =>
      pathnameWithoutLocale === path ||
      pathnameWithoutLocale.startsWith(`${path}/`),
  );
}
