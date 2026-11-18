import "server-only";

import { cookies } from "next/headers";
import { isProductionEnv, getAuthSessionSecret } from "@/lib/config/env";
import type { AuthRole, AuthSession, AuthUser } from "@/features/auth/types/auth";
import { AUTH_SESSION_COOKIE } from "@/lib/auth/constants";
import {
  isSessionExpired,
  sealSessionPayload,
  unsealSessionPayload,
  type SealedSessionPayload,
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

/** Normalize sealed / legacy cookies that predate role fields. */
function normalizeSessionUser(user: SealedSessionPayload["user"]): AuthUser {
  const roles: AuthRole[] = Array.isArray(user.roles)
    ? user.roles.filter(
        (role): role is AuthRole =>
          typeof role?.roleId === "number" && typeof role?.roleName === "string",
      )
    : [];

  return {
    userId: user.userId,
    orgId: user.orgId,
    branchId: user.branchId,
    userName: user.userName,
    shortName: user.shortName ?? null,
    staffId: user.staffId ?? null,
    fullName: user.fullName ?? null,
    employeeCode: user.employeeCode ?? null,
    employeeRefCode: user.employeeRefCode ?? null,
    designationId: user.designationId ?? null,
    designationName: user.designationName ?? null,
    mobile: user.mobile ?? null,
    email: user.email ?? null,
    joinDate: user.joinDate ?? null,
    userCode: user.userCode,
    userMob: user.userMob,
    userPhone: user.userPhone ?? null,
    userEmail: user.userEmail,
    isActive: user.isActive,
    loginStatus: user.loginStatus,
    orgDisplayName: user.orgDisplayName,
    legalName: user.legalName,
    orgSchema: user.orgSchema,
    branchCode: user.branchCode,
    branchName: user.branchName,
    isHead: user.isHead,
    roleId: typeof user.roleId === "number" ? user.roleId : (roles[0]?.roleId ?? null),
    roleName:
      typeof user.roleName === "string" && user.roleName
        ? user.roleName
        : (roles[0]?.roleName ?? null),
    isAdmin: user.isAdmin === true || roles.some((role) => role.isAdmin),
    roles,
    passwordExpired: user.passwordExpired === true,
  };
}

export async function setAuthSession(
  session: AuthSession,
  options: { persist?: boolean } = {},
): Promise<void> {
  const store = await cookies();
  const persist = options.persist !== false;
  const sealed = await sealSessionPayload({ ...session, persist }, getAuthSessionSecret());
  const maxAge = persist
    ? Math.max(1, Math.floor((session.expiresAt - Date.now()) / 1000))
    : undefined;

  store.set(
    AUTH_SESSION_COOKIE,
    sealed,
    persist && maxAge !== undefined
      ? cookieOptions(maxAge)
      : {
          httpOnly: true,
          secure: isProductionEnv(),
          sameSite: "lax",
          path: "/",
        },
  );
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

  return {
    token: session.token,
    tokenType: session.tokenType,
    expiresAt: session.expiresAt,
    orgSchema: session.orgSchema,
    persist: session.persist !== false,
    user: normalizeSessionUser(session.user),
  };
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
