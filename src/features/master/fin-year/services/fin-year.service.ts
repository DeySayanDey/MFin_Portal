import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import {
  mapFinYearDto,
  mapFinYearSaveToDto,
  mapPaginationMetaDto,
} from "@/features/master/fin-year/mappers/fin-year.mapper";
import {
  finYearDtoSchema,
  finYearSaveInputSchema,
  paginationMetaDtoSchema,
} from "@/features/master/fin-year/schemas/fin-year.schema";
import type {
  FinYear,
  FinYearDto,
  FinYearListQuery,
  FinYearListResult,
} from "@/features/master/fin-year/types/fin-year.types";
import {
  FIN_YEAR_DEFAULT_PER_PAGE,
  FIN_YEAR_MAX_PER_PAGE,
} from "@/features/master/fin-year/types/fin-year.types";
import type { LaravelResponse } from "@/types/api";

function clampPerPage(value: number | undefined): number {
  const raw = value ?? FIN_YEAR_DEFAULT_PER_PAGE;
  if (!Number.isFinite(raw) || raw < 1) return FIN_YEAR_DEFAULT_PER_PAGE;
  return Math.min(Math.floor(raw), FIN_YEAR_MAX_PER_PAGE);
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

function parseFinYearRow(row: unknown): FinYear | null {
  const parsed = finYearDtoSchema.safeParse(row);
  if (!parsed.success) return null;
  return mapFinYearDto(parsed.data);
}

/** Laravel: GET /api/FinYearGet */
export async function listFinYears(
  query: FinYearListQuery = {},
): Promise<FinYearListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<FinYearDto[]>>(
      endpoints.finYear.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: clampPerPage(query.perPage),
          year_id: query.yearId,
          is_active: query.isActive,
          search: query.search,
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
          : "Failed to load financial years";
      throw new ApiError({
        message,
        status: 500,
        code: "UNEXPECTED",
        details: payload,
      });
    }

    const rows = Array.isArray(payload.data) ? payload.data : [];
    const items = rows.flatMap((row) => {
      const year = parseFinYearRow(row);
      return year ? [year] : [];
    });

    let meta: FinYearListResult["meta"] = null;
    if (payload.meta) {
      const metaParsed = paginationMetaDtoSchema.safeParse(payload.meta);
      if (metaParsed.success) {
        meta = mapPaginationMetaDto(metaParsed.data);
      }
    }

    return { items, meta };
  });
}

/** Laravel: POST /api/FinYearUpdate (upsert). */
export async function saveFinYear(input: unknown): Promise<FinYear> {
  const validated = finYearSaveInputSchema.safeParse(input);
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
    const body = mapFinYearSaveToDto(validated.data);
    const data = await api.post<FinYearDto>(endpoints.finYear.update, body, {
      accessToken: token,
      expectEnvelope: true,
    });

    if (!data) {
      throw new ApiError({
        message: "Financial year save returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    const year = parseFinYearRow(data);
    if (!year) {
      throw new ApiError({
        message: "Financial year response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    return year;
  });
}
