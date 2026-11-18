import { endpoints } from "@/lib/api/endpoints";
import type { AuthUser } from "@/features/auth/types/auth";
import { clearStoredAuthUser, storeAuthUser } from "@/features/auth/utils/auth-user-storage";

export async function refreshStoredAuthUser(onUnauthorized?: () => void): Promise<AuthUser | null> {
  const response = await fetch(endpoints.auth.me, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
    cache: "no-store",
  });
  if (response.status === 401) {
    clearStoredAuthUser();
    onUnauthorized?.();
    return null;
  }
  const payload = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    data?: { user?: AuthUser };
  };
  const user = payload.data?.user;
  if (!response.ok || payload.success === false || !user) return null;
  storeAuthUser(user);
  return user;
}
