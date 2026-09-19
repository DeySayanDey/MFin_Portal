import "server-only";

import { cookies } from "next/headers";
import { isProductionEnv, getAuthSessionSecret } from "@/lib/config/env";
import type { AuthSession, AuthUser } from "@/features/auth/types/auth";
import { AUTH_SESSION_COOKIE } from "@/lib/auth/constants";
import {
  isSessionExpired,
  sealSessionPayload,
  unsealSessionPayload,
} from "@/lib/auth/session-seal";

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true as const,
    secure: isProductionEnv(),
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function setAuthSession(session: AuthSession): Promise<void> {
  const store = await cookies();
  const maxAge = Math.max(1, Math.floor((session.expiresAt - Date.now()) / 1000));
  const sealed = await sealSessionPayload(session, getAuthSessionSecret());

  store.set(AUTH_SESSION_COOKIE, sealed, cookieOptions(maxAge));
}

export async function clearAuthSession(): Promise<void> {
  const store = await cookies();
  store.set(AUTH_SESSION_COOKIE, "", cookieOptions(0));
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const store = await cookies();
  const raw = store.get(AUTH_SESSION_COOKIE)?.value;
  if (!raw) return null;

  const session = await unsealSessionPayload(raw, getAuthSessionSecret());
  if (!session) {
    await clearAuthSession();
    return null;
  }

  if (isSessionExpired(session)) {
    await clearAuthSession();
    return null;
  }

  return session;
}

export async function getAccessToken(): Promise<string | null> {
  const session = await getAuthSession();
  return session?.token ?? null;
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const session = await getAuthSession();
  return session?.user ?? null;
}

/** Public user fields safe to pass into Client Components (no token). */
export type PublicSessionUser = AuthUser;
