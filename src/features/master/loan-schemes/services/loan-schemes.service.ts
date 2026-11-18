import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import {
  mapLoanSchemeChargeSaveToDto,
  mapLoanSchemeSaveToDto,
  mapPaginationMetaDto,
  parseLoanSchemeChargeAssignResult,
  parseLoanSchemeChargeRow,
  parseLoanSchemeRow,
} from "../mappers/loan-schemes.mapper";
import {
  loanSchemeChargeSaveInputSchema,
  loanSchemeSetupSaveInputSchema,
  paginationMetaDtoSchema,
} from "../schemas/loan-schemes.schema";
import type {
  LoanSchemeCharge,
  LoanSchemeChargeAssignResult,
  LoanSchemeChargeListQuery,
  LoanSchemeChargeListResult,
  LoanSchemeListQuery,
  LoanSchemeListResult,
  LoanSchemeSetup,
  PaginationMetaDto,
} from "../types/loan-schemes.types";
import type { LaravelResponse, LaravelSuccessResponse } from "@/types/api";

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

function readMeta(
  meta: unknown,
): LoanSchemeListResult["meta"] {
  if (!meta) return null;
  const parsed = paginationMetaDtoSchema.safeParse(meta);
  if (!parsed.success) return null;
  return mapPaginationMetaDto(parsed.data as PaginationMetaDto);
}

/** Laravel: GET /api/LoanSchemeList */
export async function listLoanSchemes(
  query: LoanSchemeListQuery = {},
): Promise<LoanSchemeListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<unknown[]>>(
      endpoints.loanScheme.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: clampPerPage(query.perPage),
          scheme_id: query.schemeId,
          keyword: query.search,
          product_type_cd: query.productTypeCd,
          repay_type_cd: query.repayTypeCd,
          is_active: query.isActive,
        },
      },
    );

    const body = assertListPayload(payload, "Failed to load loan schemes");
    const rows = Array.isArray(body.data) ? body.data : [];
    return {
      items: rows.flatMap((row) => {
        const item = parseLoanSchemeRow(row);
        return item ? [item] : [];
      }),
      meta: readMeta(body.meta),
    };
  });
}

/** Laravel: POST /api/LoanSchemeAdd */
export async function createLoanScheme(
  input: unknown,
): Promise<LoanSchemeSetup> {
  const validated = loanSchemeSetupSaveInputSchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.post<unknown>(
      endpoints.loanScheme.add,
      mapLoanSchemeSaveToDto(validated.data),
      { accessToken: token, expectEnvelope: true },
    );
    const item = parseLoanSchemeRow(data);
    if (!item) {
      throw new ApiError({
        message: "Loan scheme response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
      });
    }
    return item;
  });
}

/** Laravel: POST /api/LoanSchemeEdit */
export async function updateLoanScheme(
  input: unknown,
): Promise<LoanSchemeSetup> {
  const validated = loanSchemeSetupSaveInputSchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);
  if (!validated.data.schemeId) {
    throw new ApiError({
      message: "Scheme ID is required for update",
      status: 422,
      code: "VALIDATION",
    });
  }

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.post<unknown>(
      endpoints.loanScheme.edit,
      mapLoanSchemeSaveToDto(validated.data),
      { accessToken: token, expectEnvelope: true },
    );
    const item = parseLoanSchemeRow(data);
    if (!item) {
      throw new ApiError({
        message: "Loan scheme response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
      });
    }
    return item;
  });
}

/** Laravel: POST /api/LoanSchemeStatus */
export async function toggleLoanSchemeStatus(
  schemeId: number,
  isActive: boolean,
): Promise<LoanSchemeSetup> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.post<unknown>(
      endpoints.loanScheme.status,
      { scheme_id: schemeId, is_active: isActive },
      { accessToken: token, expectEnvelope: true },
    );
    const item = parseLoanSchemeRow(data);
    if (!item) {
      throw new ApiError({
        message: "Loan scheme response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
      });
    }
    return item;
  });
}

/** Laravel: GET /api/LoanSchemeChargesList */
export async function listLoanSchemeCharges(
  query: LoanSchemeChargeListQuery = {},
): Promise<LoanSchemeChargeListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<unknown[]>>(
      endpoints.loanSchemeCharges.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: clampPerPage(query.perPage),
          id: query.id,
          scheme_id: query.schemeId,
          charge_id: query.chargeId,
          is_active: query.isActive,
        },
      },
    );

    const body = assertListPayload(
      payload,
      "Failed to load loan scheme charges",
    );
    const rows = Array.isArray(body.data) ? body.data : [];
    return {
      items: rows.flatMap((row) => {
        const item = parseLoanSchemeChargeRow(row);
        return item ? [item] : [];
      }),
      meta: readMeta(body.meta),
    };
  });
}

function parseAssignResult(data: unknown): LoanSchemeChargeAssignResult {
  const result = parseLoanSchemeChargeAssignResult(data);
  if (!result) {
    throw new ApiError({
      message: "Loan scheme charge response shape was unexpected",
      status: 500,
      code: "UNEXPECTED",
    });
  }
  return result;
}

/** Laravel: POST /api/LoanSchemeChargesAdd */
export async function createLoanSchemeCharge(
  input: unknown,
): Promise<LoanSchemeChargeAssignResult> {
  const validated = loanSchemeChargeSaveInputSchema.safeParse({
    ...(typeof input === "object" && input ? input : {}),
    mode: "create",
  });
  if (!validated.success) throw validationError(validated.error);

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.post<unknown>(
      endpoints.loanSchemeCharges.add,
      mapLoanSchemeChargeSaveToDto(validated.data),
      { accessToken: token, expectEnvelope: true },
    );
    if (!data) {
      throw new ApiError({
        message: "Loan scheme charge creation returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }
    return parseAssignResult(data);
  });
}

/** Laravel: POST /api/LoanSchemeChargesEdit */
export async function updateLoanSchemeCharge(
  input: unknown,
): Promise<LoanSchemeChargeAssignResult> {
  const validated = loanSchemeChargeSaveInputSchema.safeParse({
    ...(typeof input === "object" && input ? input : {}),
    mode: "edit",
  });
  if (!validated.success) throw validationError(validated.error);

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.post<unknown>(
      endpoints.loanSchemeCharges.edit,
      mapLoanSchemeChargeSaveToDto(validated.data),
      { accessToken: token, expectEnvelope: true },
    );
    if (!data) {
      throw new ApiError({
        message: "Loan scheme charge update returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }
    return parseAssignResult(data);
  });
}

/** Laravel: POST /api/LoanSchemeChargesStatus */
export async function toggleLoanSchemeChargeStatus(
  id: number,
  isActive: boolean,
): Promise<LoanSchemeCharge> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.post<unknown>(
      endpoints.loanSchemeCharges.status,
      { id, is_active: isActive },
      { accessToken: token, expectEnvelope: true },
    );
    const item = parseLoanSchemeChargeRow(data);
    if (!item) {
      throw new ApiError({
        message: "Loan scheme charge response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
      });
    }
    return item;
  });
}
