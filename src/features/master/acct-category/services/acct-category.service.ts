import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import {
  mapAcctCategoryCreateToDto,
  mapAcctCategoryDto,
  mapAcctCategoryUpdateToDto,
  mapPaginationMetaDto,
} from "@/features/master/acct-category/mappers/acct-category.mapper";
import {
  acctCategoryCreateInputSchema,
  acctCategoryDtoSchema,
  acctCategoryUpdateInputSchema,
  paginationMetaDtoSchema,
} from "@/features/master/acct-category/schemas/acct-category.schema";
import type {
  AcctCategory,
  AcctCategoryDto,
  AcctCategoryListQuery,
  AcctCategoryListResult,
} from "@/features/master/acct-category/types/acct-category.types";
import {
  ACCT_CATEGORY_DEFAULT_PER_PAGE,
  ACCT_CATEGORY_MAX_PER_PAGE,
} from "@/features/master/acct-category/types/acct-category.types";
import type { LaravelResponse } from "@/types/api";

function clampPerPage(value: number | undefined): number {
  const raw = value ?? ACCT_CATEGORY_DEFAULT_PER_PAGE;
  if (!Number.isFinite(raw) || raw < 1) return ACCT_CATEGORY_DEFAULT_PER_PAGE;
  return Math.min(Math.floor(raw), ACCT_CATEGORY_MAX_PER_PAGE);
}

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

function parseRow(row: unknown): AcctCategory | null {
  const parsed = acctCategoryDtoSchema.safeParse(row);
  if (!parsed.success) return null;
  return mapAcctCategoryDto(parsed.data);
}

/** Laravel: GET /api/AcctCategoryList */
export async function listAcctCategories(
  query: AcctCategoryListQuery = {},
): Promise<AcctCategoryListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<AcctCategoryDto[]>>(
      endpoints.acctCategory.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: clampPerPage(query.perPage),
          categ_id: query.categId,
          keyword: query.keyword,
          categy_type: query.categoryType,
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
          : "Failed to load account categories";
      throw new ApiError({
        message,
        status: 500,
        code: "UNEXPECTED",
        details: payload,
      });
    }

    const rows = Array.isArray(payload.data) ? payload.data : [];
    const items = rows.flatMap((row) => {
      const item = parseRow(row);
      return item ? [item] : [];
    });

    let meta: AcctCategoryListResult["meta"] = null;
    if (payload.meta) {
      const metaParsed = paginationMetaDtoSchema.safeParse(payload.meta);
      if (metaParsed.success) {
        meta = mapPaginationMetaDto(metaParsed.data);
      }
    }

    return { items, meta };
  });
}

/** Laravel: POST /api/AcctCategoryAdd */
export async function createAcctCategory(
  input: unknown,
): Promise<AcctCategory> {
  const validated = acctCategoryCreateInputSchema.safeParse(input);
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
    const body = mapAcctCategoryCreateToDto(validated.data);
    const data = await api.post<AcctCategoryDto>(
      endpoints.acctCategory.add,
      body,
      { accessToken: token, expectEnvelope: true },
    );

    if (!data) {
      throw new ApiError({
        message: "Account category create returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    const item = parseRow(data);
    if (!item) {
      throw new ApiError({
        message: "Account category create response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    return item;
  });
}

/** Laravel: POST /api/AcctCategoryEdit */
export async function updateAcctCategory(
  input: unknown,
): Promise<AcctCategory> {
  const validated = acctCategoryUpdateInputSchema.safeParse(input);
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
    const body = mapAcctCategoryUpdateToDto(validated.data);
    const data = await api.post<AcctCategoryDto>(
      endpoints.acctCategory.edit,
      body,
      { accessToken: token, expectEnvelope: true },
    );

    if (!data) {
      throw new ApiError({
        message: "Account category update returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    const item = parseRow(data);
    if (!item) {
      throw new ApiError({
        message: "Account category update response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    return item;
  });
}
