import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import {
  clearAuthSession,
  getAccessToken,
  getAuthSession,
  setAuthSession,
} from "@/lib/auth/session";
import { mapAuthUserDto, mapLoginDataToSession } from "@/features/auth/mappers/auth-mapper";
import type {
  AuthUser,
  AuthUserDto,
  LoginDataDto,
  LoginRequest,
} from "@/features/auth/types/auth";

export type PublicAuthUser = AuthUser;

export async function loginWithLaravel(
  input: LoginRequest,
): Promise<PublicAuthUser> {
  const payload: Record<string, unknown> = {
    org_code: input.orgCode,
    login: input.login,
    password: input.password,
  };

  const data = await api.post<LoginDataDto>(
    endpoints.auth.login,
    payload,
    { expectEnvelope: true },
  );

  if (!data?.token || !data.user) {
    throw new ApiError({
      message: "Login response missing token or user",
      status: 500,
      code: "UNEXPECTED",
    });
  }

  const session = mapLoginDataToSession(data);
  await setAuthSession(session, { persist: input.remember !== false });
  return session.user;
}

export async function fetchCurrentUserFromLaravel(): Promise<PublicAuthUser> {
  const session = await getAuthSession();
  if (!session) {
    throw new ApiError({ message: "Unauthorized", status: 401, code: "UNAUTHORIZED" });
  }
  const data = await api.get<{ user?: AuthUser }>(endpoints.auth.me, {
    accessToken: session.token,
    expectEnvelope: true,
  });
  const raw = data?.user;
  if (!raw) {
    throw new ApiError({
      message: "Current user response is missing",
      status: 500,
      code: "UNEXPECTED",
    });
  }
  const user = mapAuthUserDto(raw as AuthUserDto);
  return {
    ...user,
    orgSchema: user.orgSchema || session.orgSchema,
    passwordExpired: session.user.passwordExpired,
  };
}

export async function logoutFromLaravel(): Promise<void> {
  const token = await getAccessToken();
  try {
    if (token) {
      await api.post<null>(endpoints.auth.logout, undefined, {
        accessToken: token,
        expectEnvelope: true,
      });
    }
  } catch (error) {
    // Always clear local session; Laravel may already consider the token invalid.
    if (!(error instanceof ApiError && error.isUnauthorized)) {
      // still clear below
    }
  } finally {
    await clearAuthSession();
  }
}
