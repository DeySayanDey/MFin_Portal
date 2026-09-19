import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import {
  clearAuthSession,
  getAccessToken,
  setAuthSession,
} from "@/lib/auth/session";
import { mapLoginDataToSession } from "@/features/auth/mappers/auth-mapper";
import type {
  AuthUser,
  LoginDataDto,
  LoginRequest,
} from "@/features/auth/types/auth";

export type PublicAuthUser = AuthUser;

export async function loginWithLaravel(
  input: LoginRequest,
): Promise<PublicAuthUser> {
  const data = await api.post<LoginDataDto>(endpoints.auth.login, input, {
    expectEnvelope: true,
  });

  if (!data?.token || !data.user) {
    throw new ApiError({
      message: "Login response missing token or user",
      status: 500,
      code: "UNEXPECTED",
    });
  }

  const session = mapLoginDataToSession(data);
  await setAuthSession(session);
  return session.user;
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
