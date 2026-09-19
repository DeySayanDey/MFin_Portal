import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import {
  mapCodeSeriesDto,
  mapCodeSeriesUpdateToDto,
  mapPaginationMetaDto,
} from "@/features/master/code-series/mappers/code-series.mapper";
import {
  codeSeriesDtoSchema,
  codeSeriesUpdateInputSchema,
  paginationMetaDtoSchema,
} from "@/features/master/code-series/schemas/code-series.schema";
import type {
  CodeSeries,
  CodeSeriesDto,
  CodeSeriesListQuery,
  CodeSeriesListResult,
} from "@/features/master/code-series/types/code-series.types";
import type { LaravelResponse } from "@/types/api";

/**
 * Documented aliases: `keyword` / `search`.
 * Canonical choice for this BFF → Laravel call. Change here only if needed.
 */
export const CODE_SERIES_SEARCH_PARAM = "keyword" as const;

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

export async function listCodeSeries(
  query: CodeSeriesListQuery = {},
): Promise<CodeSeriesListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<CodeSeriesDto[]>>(
      endpoints.codeSeries.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: query.perPage ?? 20,
          series_id: query.seriesId,
          module_key: query.moduleKey,
          [CODE_SERIES_SEARCH_PARAM]: query.keyword,
          status: query.status,
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
          : "Failed to load code series";
      throw new ApiError({
        message,
        status: 500,
        code: "UNEXPECTED",
        details: payload,
      });
    }

    const rows = Array.isArray(payload.data) ? payload.data : [];
    const items = rows.flatMap((row) => {
      const parsed = codeSeriesDtoSchema.safeParse(row);
      return parsed.success ? [mapCodeSeriesDto(parsed.data)] : [];
    });

    let meta: CodeSeriesListResult["meta"] = null;
    if (payload.meta) {
      const metaParsed = paginationMetaDtoSchema.safeParse(payload.meta);
      if (metaParsed.success) {
        meta = mapPaginationMetaDto(metaParsed.data);
      }
    }

    return { items, meta };
  });
}

export async function updateCodeSeries(input: unknown): Promise<CodeSeries> {
  const validated = codeSeriesUpdateInputSchema.safeParse(input);
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
    const body = mapCodeSeriesUpdateToDto(validated.data);
    const data = await api.post<CodeSeriesDto>(
      endpoints.codeSeries.update,
      body,
      {
        accessToken: token,
        expectEnvelope: true,
      },
    );

    if (!data) {
      throw new ApiError({
        message: "Code series update returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    const parsed = codeSeriesDtoSchema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError({
        message: "Code series response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
        details: parsed.error.flatten(),
      });
    }

    return mapCodeSeriesDto(parsed.data);
  });
}
