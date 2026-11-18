import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import type { LaravelResponse, LaravelSuccessResponse } from "@/types/api";
import {
  mapEligibilityListMeta,
  mapLoanEligibilitySaveToDto,
  parseLoanEligibilityRow,
} from "../mappers/loan-eligibility.mapper";
import { loanEligibilitySaveInputSchema } from "../schemas/loan-eligibility.schema";
import type {
  LoanEligibilityListQuery,
  LoanEligibilityListResult,
  LoanEligibilityParameter,
} from "../types/loan-eligibility.types";

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

function readParameter(data: unknown, fallback: string): LoanEligibilityParameter {
  const item = parseLoanEligibilityRow(data);
  if (!item) {
    throw new ApiError({
      message: fallback,
      status: 500,
      code: "UNEXPECTED",
    });
  }
  return item;
}

/** Laravel: GET /api/LoanEligibilityParameterList */
export async function listLoanEligibilityParameters(
  query: LoanEligibilityListQuery = {},
): Promise<LoanEligibilityListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<unknown[]>>(
      endpoints.loanEligibility.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: clampPerPage(query.perPage),
          param_id: query.paramId,
          keyword: query.search,
          data_type: query.dataType,
          is_mandatory: query.isMandatory,
          is_active: query.isActive,
        },
      },
    );

    const body = assertListPayload(
      payload,
      "Failed to load loan eligibility parameters",
    );
    const rows = Array.isArray(body.data) ? body.data : [];
    return {
      items: rows.flatMap((row) => {
        const item = parseLoanEligibilityRow(row);
        return item ? [item] : [];
      }),
      meta: mapEligibilityListMeta(body.meta),
    };
  });
}

/** Laravel: POST /api/LoanEligibilityParameterEdit */
export async function updateLoanEligibilityParameter(
  input: unknown,
): Promise<LoanEligibilityParameter> {
  const validated = loanEligibilitySaveInputSchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.post<unknown>(
      endpoints.loanEligibility.edit,
      mapLoanEligibilitySaveToDto(validated.data),
      { accessToken: token, expectEnvelope: true },
    );
    return readParameter(
      data,
      "Loan eligibility parameter response shape was unexpected",
    );
  });
}

/** Laravel: POST /api/LoanEligibilityParameterStatus */
export async function toggleLoanEligibilityStatus(
  paramId: number,
  isActive: boolean,
): Promise<LoanEligibilityParameter> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.post<unknown>(
      endpoints.loanEligibility.status,
      { param_id: paramId, is_active: isActive },
      { accessToken: token, expectEnvelope: true },
    );
    return readParameter(
      data,
      "Loan eligibility parameter status response shape was unexpected",
    );
  });
}
