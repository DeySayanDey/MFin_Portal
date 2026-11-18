import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import {
  mapAcctSubledgerCreateToDto,
  mapAcctSubledgerDto,
  mapAcctSubledgerUpdateToDto,
  mapPaginationMetaDto,
} from "@/features/master/acct-subledger/mappers/acct-subledger.mapper";
import {
  acctSubledgerCreateInputSchema,
  acctSubledgerDtoSchema,
  acctSubledgerUpdateInputSchema,
  paginationMetaDtoSchema,
} from "@/features/master/acct-subledger/schemas/acct-subledger.schema";
import type {
  AcctSubledger,
  AcctSubledgerDto,
  AcctSubledgerListQuery,
  AcctSubledgerListResult,
} from "@/features/master/acct-subledger/types/acct-subledger.types";
import {
  ACCT_SUBLEDGER_DEFAULT_PER_PAGE,
  ACCT_SUBLEDGER_MAX_PER_PAGE,
} from "@/features/master/acct-subledger/types/acct-subledger.types";
import type { LaravelResponse } from "@/types/api";

function clampPerPage(value: number | undefined): number {
  const raw = value ?? ACCT_SUBLEDGER_DEFAULT_PER_PAGE;
  if (!Number.isFinite(raw) || raw < 1) return ACCT_SUBLEDGER_DEFAULT_PER_PAGE;
  return Math.min(Math.floor(raw), ACCT_SUBLEDGER_MAX_PER_PAGE);
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

function parseRow(row: unknown): AcctSubledger | null {
  const parsed = acctSubledgerDtoSchema.safeParse(row);
  if (!parsed.success) return null;
  return mapAcctSubledgerDto(parsed.data);
}

/** Laravel: GET /api/AcctSubledgerList */
export async function listAcctSubledgers(
  query: AcctSubledgerListQuery = {},
): Promise<AcctSubledgerListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<AcctSubledgerDto[]>>(
      endpoints.acctSubledger.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: clampPerPage(query.perPage),
          subledg_id: query.subledgId,
          ledger_id: query.ledgerId,
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
          : "Failed to load account subledgers";
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

    let meta: AcctSubledgerListResult["meta"] = null;
    if (payload.meta) {
      const metaParsed = paginationMetaDtoSchema.safeParse(payload.meta);
      if (metaParsed.success) {
        meta = mapPaginationMetaDto(metaParsed.data);
      }
    }

    return { items, meta };
  });
}

/** Laravel: POST /api/AcctSubledgerAdd */
export async function createAcctSubledger(
  input: unknown,
): Promise<AcctSubledger> {
  const validated = acctSubledgerCreateInputSchema.safeParse(input);
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
    const body = mapAcctSubledgerCreateToDto(validated.data);
    const data = await api.post<AcctSubledgerDto>(
      endpoints.acctSubledger.add,
      body,
      {
        accessToken: token,
        expectEnvelope: true,
      },
    );

    if (!data) {
      throw new ApiError({
        message: "Account subledger create returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    const item = parseRow(data);
    if (!item) {
      throw new ApiError({
        message: "Account subledger create response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    return item;
  });
}

/** Laravel: POST /api/AcctSubledgerEdit */
export async function updateAcctSubledger(
  input: unknown,
): Promise<AcctSubledger> {
  const validated = acctSubledgerUpdateInputSchema.safeParse(input);
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
    const body = mapAcctSubledgerUpdateToDto(validated.data);
    const data = await api.post<AcctSubledgerDto>(
      endpoints.acctSubledger.edit,
      body,
      {
        accessToken: token,
        expectEnvelope: true,
      },
    );

    if (!data) {
      throw new ApiError({
        message: "Account subledger update returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    const item = parseRow(data);
    if (!item) {
      throw new ApiError({
        message: "Account subledger update response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    return item;
  });
}
