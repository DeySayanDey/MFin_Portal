import type { AuthUser } from "@/features/auth/types/auth";

const AUTH_USER_STORAGE_KEY = "mfin.auth.user.v1";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function storeAuthUser(user: AuthUser): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Storage may be unavailable in private browsing or when quota is exceeded.
  }
}

export function getStoredAuthUser(): AuthUser | null {
  if (!canUseStorage()) return null;
  try {
    const value: unknown = JSON.parse(
      window.localStorage.getItem(AUTH_USER_STORAGE_KEY) ?? "null",
    );
    if (!value || typeof value !== "object") return null;
    const user = value as Partial<AuthUser>;
    return typeof user.userId === "number" &&
      typeof user.orgId === "number" &&
      (typeof user.branchId === "number" || user.branchId === null)
      ? (value as AuthUser)
      : null;
  } catch {
    return null;
  }
}

export function clearStoredAuthUser(): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures during logout.
  }
}
