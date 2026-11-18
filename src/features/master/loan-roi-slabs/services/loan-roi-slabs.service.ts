import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import type { LaravelResponse, LaravelSuccessResponse } from "@/types/api";
import {
  mapLoanSchemeSlabSaveToDto,
  mapSlabListMeta,
  parseLoanSchemeSlabRow,
} from "../mappers/loan-roi-slabs.mapper";
import { loanSchemeSlabSaveInputSchema } from "../schemas/loan-roi-slabs.schema";
import type {
  LoanSchemeSlab,
  LoanSchemeSlabListQuery,
  LoanSchemeSlabListResult,
} from "../types/loan-roi-slabs.types";

const DEFAULT_PER_PAGE = 50;
const MAX_PER_PAGE = 200;

function clampPerPage(value: number | undefined): number {
  const raw = value ?? DEFAULT_PER_PAGE;
  if (!Number.isFinite(raw) || raw < 1) return DEFAULT_PER_PAGE;
  return Math.min(Math.floor(raw), MAX_PER_PAGE);
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

function validationError(error: { flatten: () => unknown }): ApiError {
  return new ApiError({
    message: "Validation failed",
    status: 422,
    code: "VALIDATION",
    details: error.flatten(),
  });
}

function assertListPayload(
  payload: LaravelResponse<unknown[]> | null | undefined,
  fallback: string,
): LaravelSuccessResponse<unknown[]> {
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
        : fallback;
    throw new ApiError({
      message,
      status: 500,
      code: "UNEXPECTED",
      details: payload,
    });
  }
  return payload;
}

function readSlab(data: unknown, fallback: string): LoanSchemeSlab {
  const item = parseLoanSchemeSlabRow(data);
  if (!item) {
    throw new ApiError({
      message: fallback,
      status: 500,
      code: "UNEXPECTED",
    });
  }
  return item;
}

/** Laravel: GET /api/LoanSchemeSlabList */
export async function listLoanSchemeSlabs(
  query: LoanSchemeSlabListQuery = {},
): Promise<LoanSchemeSlabListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<unknown[]>>(
      endpoints.loanSchemeSlab.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: clampPerPage(query.perPage),
          id: query.id,
          scheme_id: query.schemeId,
          amount: query.amount,
          effective_on: query.effectiveOn,
          is_active: query.isActive,
        },
      },
    );

    const body = assertListPayload(payload, "Failed to load loan interest slabs");
    const rows = Array.isArray(body.data) ? body.data : [];
    return {
      items: rows.flatMap((row) => {
        const item = parseLoanSchemeSlabRow(row);
        return item ? [item] : [];
      }),
      meta: mapSlabListMeta(body.meta),
    };
  });
}

/** Laravel: POST /api/LoanSchemeSlabAdd */
export async function createLoanSchemeSlab(
  input: unknown,
): Promise<LoanSchemeSlab> {
  const validated = loanSchemeSlabSaveInputSchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.post<unknown>(
      endpoints.loanSchemeSlab.add,
      mapLoanSchemeSlabSaveToDto({ ...validated.data, id: undefined }),
      { accessToken: token, expectEnvelope: true },
    );
    return readSlab(data, "Loan scheme slab response shape was unexpected");
  });
}

/** Laravel: POST /api/LoanSchemeSlabEdit */
export async function updateLoanSchemeSlab(
  input: unknown,
): Promise<LoanSchemeSlab> {
  const validated = loanSchemeSlabSaveInputSchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);
  if (!validated.data.id) {
    throw new ApiError({
      message: "id is required",
      status: 422,
      code: "VALIDATION",
    });
  }

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.post<unknown>(
      endpoints.loanSchemeSlab.edit,
      mapLoanSchemeSlabSaveToDto(validated.data),
      { accessToken: token, expectEnvelope: true },
    );
    return readSlab(data, "Loan scheme slab response shape was unexpected");
  });
}

/** Laravel: POST /api/LoanSchemeSlabStatus */
export async function toggleLoanSchemeSlabStatus(
  id: number,
  isActive: boolean,
): Promise<LoanSchemeSlab> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.post<unknown>(
      endpoints.loanSchemeSlab.status,
      { id, is_active: isActive },
      { accessToken: token, expectEnvelope: true },
    );
    return readSlab(data, "Loan scheme slab status response shape was unexpected");
  });
}
