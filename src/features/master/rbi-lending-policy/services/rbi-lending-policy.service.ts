import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import {
  mapRbiLendingPolicyDto,
  mapRbiLendingPolicyUpdateToDto,
} from "@/features/master/rbi-lending-policy/mappers/rbi-lending-policy.mapper";
import {
  rbiLendingPolicyDtoSchema,
  rbiLendingPolicyUpdateInputSchema,
} from "@/features/master/rbi-lending-policy/schemas/rbi-lending-policy.schema";
import type {
  RbiLendingPolicy,
  RbiLendingPolicyDto,
} from "@/features/master/rbi-lending-policy/types/rbi-lending-policy.types";

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

export async function getRbiLendingPolicy(): Promise<RbiLendingPolicy> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.get<RbiLendingPolicyDto>(
      endpoints.rbiLendingPolicy.get,
      {
        accessToken: token,
        expectEnvelope: true,
      },
    );

    if (!data) {
      throw new ApiError({
        message: "RBI lending policy not configured",
        status: 404,
        code: "NOT_FOUND",
      });
    }

    const parsed = rbiLendingPolicyDtoSchema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError({
        message: "RBI lending policy response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
        details: parsed.error.flatten(),
      });
    }

    return mapRbiLendingPolicyDto(parsed.data);
  });
}

export async function updateRbiLendingPolicy(
  input: unknown,
): Promise<RbiLendingPolicy> {
  const validated = rbiLendingPolicyUpdateInputSchema.safeParse(input);
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
    const body = mapRbiLendingPolicyUpdateToDto(validated.data);
    const data = await api.post<RbiLendingPolicyDto>(
      endpoints.rbiLendingPolicy.update,
      body,
      {
        accessToken: token,
        expectEnvelope: true,
      },
    );

    if (!data) {
      throw new ApiError({
        message: "RBI lending policy update returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    const parsed = rbiLendingPolicyDtoSchema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError({
        message: "RBI lending policy response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
        details: parsed.error.flatten(),
      });
    }

    return mapRbiLendingPolicyDto(parsed.data);
  });
}
