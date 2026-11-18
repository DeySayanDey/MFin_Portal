import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import {
  mapAcctHeadCreateToDto,
  mapAcctHeadDto,
  mapAcctHeadUpdateToDto,
  mapPaginationMetaDto,
} from "@/features/master/acct-head/mappers/acct-head.mapper";
import {
  acctHeadCreateInputSchema,
  acctHeadDtoSchema,
  acctHeadUpdateInputSchema,
  paginationMetaDtoSchema,
} from "@/features/master/acct-head/schemas/acct-head.schema";
import type {
  AcctHead,
  AcctHeadDto,
  AcctHeadListQuery,
  AcctHeadListResult,
} from "@/features/master/acct-head/types/acct-head.types";
import {
  ACCT_HEAD_DEFAULT_PER_PAGE,
  ACCT_HEAD_MAX_PER_PAGE,
} from "@/features/master/acct-head/types/acct-head.types";
import type { LaravelResponse } from "@/types/api";

function clampPerPage(value: number | undefined): number {
  const raw = value ?? ACCT_HEAD_DEFAULT_PER_PAGE;
  if (!Number.isFinite(raw) || raw < 1) return ACCT_HEAD_DEFAULT_PER_PAGE;
  return Math.min(Math.floor(raw), ACCT_HEAD_MAX_PER_PAGE);
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

function parseRow(row: unknown): AcctHead | null {
  const parsed = acctHeadDtoSchema.safeParse(row);
  if (!parsed.success) return null;
  return mapAcctHeadDto(parsed.data);
}

/** Laravel: GET /api/AcctHeadList */
export async function listAcctHeads(
  query: AcctHeadListQuery = {},
): Promise<AcctHeadListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<AcctHeadDto[]>>(
      endpoints.acctHead.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: clampPerPage(query.perPage),
          mainhd_id: query.mainhdId,
          categ_id: query.categId,
          keyword: query.keyword,
          is_active: query.isActive,
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
          : "Failed to load account main heads";
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

    let meta: AcctHeadListResult["meta"] = null;
    if (payload.meta) {
      const metaParsed = paginationMetaDtoSchema.safeParse(payload.meta);
      if (metaParsed.success) {
        meta = mapPaginationMetaDto(metaParsed.data);
      }
    }

    return { items, meta };
  });
}

/** Laravel: POST /api/AcctHeadAdd */
export async function createAcctHead(input: unknown): Promise<AcctHead> {
  const validated = acctHeadCreateInputSchema.safeParse(input);
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
    const body = mapAcctHeadCreateToDto(validated.data);
    const data = await api.post<AcctHeadDto>(endpoints.acctHead.add, body, {
      accessToken: token,
      expectEnvelope: true,
    });

    if (!data) {
      throw new ApiError({
        message: "Account main head create returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    const item = parseRow(data);
    if (!item) {
      throw new ApiError({
        message: "Account main head create response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    return item;
  });
}

/** Laravel: POST /api/AcctHeadEdit */
export async function updateAcctHead(input: unknown): Promise<AcctHead> {
  const validated = acctHeadUpdateInputSchema.safeParse(input);
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
    const body = mapAcctHeadUpdateToDto(validated.data);
    const data = await api.post<AcctHeadDto>(endpoints.acctHead.edit, body, {
      accessToken: token,
      expectEnvelope: true,
    });

    if (!data) {
      throw new ApiError({
        message: "Account main head update returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    const item = parseRow(data);
    if (!item) {
      throw new ApiError({
        message: "Account main head update response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    return item;
  });
}
