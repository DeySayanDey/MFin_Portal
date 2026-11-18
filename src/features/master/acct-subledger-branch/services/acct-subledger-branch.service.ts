import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import {
  mapAcctSubledgerBranchCreateToDto,
  mapAcctSubledgerBranchDto,
  mapAcctSubledgerBranchUpdateToDto,
  mapPaginationMetaDto,
} from "@/features/master/acct-subledger-branch/mappers/acct-subledger-branch.mapper";
import {
  acctSubledgerBranchCreateInputSchema,
  acctSubledgerBranchDtoSchema,
  acctSubledgerBranchUpdateInputSchema,
  paginationMetaDtoSchema,
} from "@/features/master/acct-subledger-branch/schemas/acct-subledger-branch.schema";
import type {
  AcctSubledgerBranch,
  AcctSubledgerBranchDto,
  AcctSubledgerBranchListQuery,
  AcctSubledgerBranchListResult,
} from "@/features/master/acct-subledger-branch/types/acct-subledger-branch.types";
import {
  ACCT_SUBLEDGER_BRANCH_DEFAULT_PER_PAGE,
  ACCT_SUBLEDGER_BRANCH_MAX_PER_PAGE,
} from "@/features/master/acct-subledger-branch/types/acct-subledger-branch.types";
import type { LaravelResponse } from "@/types/api";

function clampPerPage(value: number | undefined): number {
  const raw = value ?? ACCT_SUBLEDGER_BRANCH_DEFAULT_PER_PAGE;
  if (!Number.isFinite(raw) || raw < 1)
    return ACCT_SUBLEDGER_BRANCH_DEFAULT_PER_PAGE;
  return Math.min(Math.floor(raw), ACCT_SUBLEDGER_BRANCH_MAX_PER_PAGE);
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

function parseRow(row: unknown): AcctSubledgerBranch | null {
  const parsed = acctSubledgerBranchDtoSchema.safeParse(row);
  if (!parsed.success) return null;
  return mapAcctSubledgerBranchDto(parsed.data);
}

/** Laravel: GET /api/AcctSubledgerBranchList */
export async function listAcctSubledgerBranches(
  query: AcctSubledgerBranchListQuery = {},
): Promise<AcctSubledgerBranchListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<AcctSubledgerBranchDto[]>>(
      endpoints.acctSubledgerBranch.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: clampPerPage(query.perPage),
          id: query.id,
          subledg_id: query.subledgId,
          branch_id: query.branchId,
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
          : "Failed to load subledger branch mappings";
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

    let meta: AcctSubledgerBranchListResult["meta"] = null;
    if (payload.meta) {
      const metaParsed = paginationMetaDtoSchema.safeParse(payload.meta);
      if (metaParsed.success) {
        meta = mapPaginationMetaDto(metaParsed.data);
      }
    }

    return { items, meta };
  });
}

/** Laravel: POST /api/AcctSubledgerBranchAdd */
export async function createAcctSubledgerBranch(
  input: unknown,
): Promise<AcctSubledgerBranch> {
  const validated = acctSubledgerBranchCreateInputSchema.safeParse(input);
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
    const body = mapAcctSubledgerBranchCreateToDto(validated.data);
    const data = await api.post<AcctSubledgerBranchDto>(
      endpoints.acctSubledgerBranch.add,
      body,
      {
        accessToken: token,
        expectEnvelope: true,
      },
    );

    if (!data) {
      throw new ApiError({
        message: "Subledger branch mapping create returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    const item = parseRow(data);
    if (!item) {
      throw new ApiError({
        message: "Subledger branch mapping create response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    return item;
  });
}

/** Laravel: POST /api/AcctSubledgerBranchEdit */
export async function updateAcctSubledgerBranch(
  input: unknown,
): Promise<AcctSubledgerBranch> {
  const validated = acctSubledgerBranchUpdateInputSchema.safeParse(input);
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
    const body = mapAcctSubledgerBranchUpdateToDto(validated.data);
    const data = await api.post<AcctSubledgerBranchDto>(
      endpoints.acctSubledgerBranch.edit,
      body,
      {
        accessToken: token,
        expectEnvelope: true,
      },
    );

    if (!data) {
      throw new ApiError({
        message: "Subledger branch mapping update returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    const item = parseRow(data);
    if (!item) {
      throw new ApiError({
        message: "Subledger branch mapping update response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    return item;
  });
}
