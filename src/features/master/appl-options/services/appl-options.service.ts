import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import { mapApplOptionDto } from "../mappers/appl-options.mapper";
import { applOptionDtoSchema } from "../schemas/appl-options.schema";
import type {
  ApplOption,
  ApplOptionDto,
  ApplOptionQuery,
} from "../types/appl-options.types";
import type { LaravelResponse } from "@/types/api";

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

/** Laravel: GET /api/ApplOptionsList?opt_grp_id=... */
export async function listApplOptions(
  query: ApplOptionQuery,
): Promise<ApplOption[]> {
  if (!Number.isInteger(query.optGrpId) || query.optGrpId <= 0) {
    throw new ApiError({
      message: "opt_grp_id must be a positive integer",
      status: 422,
      code: "VALIDATION",
    });
  }

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<ApplOptionDto[]>>(
      endpoints.applOptions.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          opt_grp_id: query.optGrpId,
          ...(query.includeInactive ? { include_inactive: true } : {}),
        },
      },
    );

    if (
      !payload ||
      typeof payload !== "object" ||
      !("success" in payload) ||
      payload.success !== true
    ) {
      const message =
        payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : "Failed to load application options";
      throw new ApiError({
        message,
        status: 500,
        code: "UNEXPECTED",
        details: payload,
      });
    }

    if (!Array.isArray(payload.data)) {
      throw new ApiError({
        message: "Application options response must contain an array",
        status: 502,
        code: "SERVER",
      });
    }
    if (payload.data.length === 0) {
      throw new ApiError({
        message: "No application options found for this group",
        status: 404,
        code: "NOT_FOUND",
      });
    }

    const options = payload.data.map((row, index) => {
      const parsed = applOptionDtoSchema.safeParse(row);
      if (!parsed.success) {
        throw new ApiError({
          message: `Application option ${index + 1} has an invalid response shape`,
          status: 502,
          code: "SERVER",
          details: parsed.error.issues,
        });
      }
      return mapApplOptionDto(parsed.data);
    });

    const filteredOptions = options
      .filter((option) => query.includeInactive || option.isActive)
      .sort((left, right) => left.srlNo - right.srlNo || left.optCode - right.optCode);
    if (filteredOptions.length === 0) {
      throw new ApiError({
        message: "No application options found for this group",
        status: 404,
        code: "NOT_FOUND",
      });
    }
    return filteredOptions;
  });
}
