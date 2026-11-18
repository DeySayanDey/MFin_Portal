import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import { mapSecurityPolicyDto, mapSecurityPolicyUpdateToDto } from "@/features/security/login-settings/mappers/login-settings.mapper";
import {
  loginSecurityDraftSchema,
  securityPolicyDtoSchema,
} from "@/features/security/login-settings/schemas/login-settings.schema";
import type { SecurityPolicy } from "@/features/security/login-settings/types/login-settings.types";

async function requireAccessToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError({
      message: "Unauthorized. Bearer token required.",
      status: 401,
      code: "UNAUTHORIZED",
    });
  }
  return token;
}

async function withUnauthorizedClear<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      await clearAuthSession();
    }
    throw error;
  }
}

function parsePolicy(data: unknown): SecurityPolicy {
  const parsed = securityPolicyDtoSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError({
      message: "Security policy response shape was unexpected",
      status: 500,
      code: "UNEXPECTED",
      details: parsed.error.flatten(),
    });
  }
  return mapSecurityPolicyDto(parsed.data);
}

/** Laravel: GET /api/SecurityPolicyGet */
export async function getSecurityPolicy(): Promise<SecurityPolicy> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.get<unknown>(endpoints.securityPolicy.get, {
      accessToken: token,
      expectEnvelope: true,
    });

    if (!data) {
      throw new ApiError({
        message: "Security policy was not found",
        status: 404,
        code: "NOT_FOUND",
      });
    }

    return parsePolicy(data);
  });
}

/** Laravel: POST /api/SecurityPolicyUpdate */
export async function updateSecurityPolicy(input: unknown): Promise<SecurityPolicy> {
  const validated = loginSecurityDraftSchema.safeParse(input);
  if (!validated.success) {
    throw new ApiError({
      message: "Validation failed",
      status: 422,
      code: "VALIDATION",
      details: validated.error.flatten(),
    });
  }

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.post<unknown>(
      endpoints.securityPolicy.update,
      mapSecurityPolicyUpdateToDto(validated.data),
      {
        accessToken: token,
        expectEnvelope: true,
      },
    );

    if (!data) {
      throw new ApiError({
        message: "Security policy update returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    return parsePolicy(data);
  });
}
