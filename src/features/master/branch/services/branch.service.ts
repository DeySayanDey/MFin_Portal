import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import {
  mapBranchCreateToDto,
  mapBranchDto,
  mapBranchMutationResult,
  mapBranchUpdateToDto,
  mapPaginationMetaDto,
} from "@/features/master/branch/mappers/branch.mapper";
import {
  branchCreateInputSchema,
  branchDtoSchema,
  branchMutationResultSchema,
  branchUpdateInputSchema,
  paginationMetaDtoSchema,
} from "@/features/master/branch/schemas/branch.schema";
import type {
  BranchDto,
  BranchListQuery,
  BranchListResult,
  BranchMutationResult,
} from "@/features/master/branch/types/branch.types";
import type { LaravelResponse } from "@/types/api";

/** Documented aliases: `keyword` / `search`. */
export const BRANCH_SEARCH_PARAM = "keyword" as const;
/** Documented aliases: `is_active` / `status`. */
export const BRANCH_ACTIVE_PARAM = "is_active" as const;

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

export async function listBranches(
  query: BranchListQuery = {},
): Promise<BranchListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<BranchDto[]>>(
      endpoints.branch.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: query.perPage ?? 20,
          branch_id: query.branchId,
          [BRANCH_SEARCH_PARAM]: query.keyword,
          is_head: query.isHead,
          [BRANCH_ACTIVE_PARAM]: query.isActive,
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
          : "Failed to load branches";
      throw new ApiError({
        message,
        status: 500,
        code: "UNEXPECTED",
        details: payload,
      });
    }

    const rows = Array.isArray(payload.data) ? payload.data : [];
    const items = rows.flatMap((row) => {
      const parsed = branchDtoSchema.safeParse(row);
      return parsed.success ? [mapBranchDto(parsed.data)] : [];
    });

    let meta: BranchListResult["meta"] = null;
    if (payload.meta) {
      const metaParsed = paginationMetaDtoSchema.safeParse(payload.meta);
      if (metaParsed.success) {
        meta = mapPaginationMetaDto(metaParsed.data);
      }
    }

    return { items, meta };
  });
}

export async function createBranch(
  input: unknown,
): Promise<BranchMutationResult> {
  const validated = branchCreateInputSchema.safeParse(input);
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
    const body = mapBranchCreateToDto(validated.data);
    const data = await api.post<{ branch_id: number }>(
      endpoints.branch.add,
      body,
      { accessToken: token, expectEnvelope: true },
    );
    const parsed = branchMutationResultSchema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError({
        message: "Branch create response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
        details: parsed.error.flatten(),
      });
    }
    return mapBranchMutationResult(parsed.data);
  });
}

export async function updateBranch(
  input: unknown,
): Promise<BranchMutationResult> {
  const validated = branchUpdateInputSchema.safeParse(input);
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
    const body = mapBranchUpdateToDto(validated.data);
    const data = await api.post<{ branch_id: number }>(
      endpoints.branch.edit,
      body,
      { accessToken: token, expectEnvelope: true },
    );
    const parsed = branchMutationResultSchema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError({
        message: "Branch update response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
        details: parsed.error.flatten(),
      });
    }
    return mapBranchMutationResult(parsed.data);
  });
}
