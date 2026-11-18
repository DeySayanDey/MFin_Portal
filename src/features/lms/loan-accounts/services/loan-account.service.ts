import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import { mapPaginationMetaDto, parseLoanAccountRow } from "../mappers/loan-account.mapper";
import {
  loanAccountSaveInputSchema,
  loanAccountStatusInputSchema,
  paginationMetaDtoSchema,
} from "../schemas/loan-account.schema";
import type {
  LoanAccount,
  LoanAccountListQuery,
  LoanAccountListResult,
  PaginationMetaDto,
} from "../types/loan-account.types";
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

function readMeta(meta: unknown): LoanAccountListResult["meta"] {
  if (!meta) return null;
  const parsed = paginationMetaDtoSchema.safeParse(meta);
  if (!parsed.success) return null;
  return mapPaginationMetaDto(parsed.data as PaginationMetaDto);
}

function requireRow(raw: unknown, fallback: string): LoanAccount {
  const item = parseLoanAccountRow(raw);
  if (!item) {
    throw new ApiError({
      message: fallback,
      status: 500,
      code: "UNEXPECTED",
      details: raw,
    });
  }
  return item;
}

/** Laravel: GET /api/LoanAccountList */
export async function listLoanAccounts(
  query: LoanAccountListQuery = {},
): Promise<LoanAccountListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<unknown[]>>(
      endpoints.loanAccount.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: clampPerPage(query.perPage),
          loan_account_id: query.loanAccountId,
          application_id: query.applicationId,
          branch_id: query.branchId,
          fo_id: query.foId,
          scheme_id: query.schemeId,
          cust_type_cd: query.custTypeCd,
          member_id: query.memberId,
          group_id: query.groupId,
          status_cd: query.statusCd,
          is_defaulter:
            query.isDefaulter == null ? undefined : query.isDefaulter ? 1 : 0,
          is_npa: query.isNpa == null ? undefined : query.isNpa ? 1 : 0,
          from_date: query.fromDate,
          to_date: query.toDate,
          keyword: query.search,
        },
      },
    );

    const body = assertListPayload(payload, "Failed to load loan accounts");
    const rows = Array.isArray(body.data) ? body.data : [];
    return {
      items: rows.flatMap((row) => {
        const item = parseLoanAccountRow(row);
        return item ? [item] : [];
      }),
      meta: readMeta(body.meta),
    };
  });
}

/** Laravel: POST /api/LoanAccountAdd */
export async function createLoanAccount(input: unknown): Promise<LoanAccount> {
  const validated = loanAccountSaveInputSchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);
  if (!validated.data.applicationId || !validated.data.loanDate) {
    throw new ApiError({
      message: "application_id and loan_date are required",
      status: 422,
      code: "VALIDATION",
    });
  }

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.post<unknown>(
      endpoints.loanAccount.add,
      {
        application_id: validated.data.applicationId,
        loan_date: validated.data.loanDate,
        loan_amount: validated.data.loanAmount,
        interest_rate: validated.data.interestRate,
        final_due_date: validated.data.finalDueDate,
        loan_account_no: validated.data.loanAccountNo,
        ref_account_no: validated.data.refAccountNo,
        is_defaulter: validated.data.isDefaulter,
        is_npa: validated.data.isNpa,
      },
      { accessToken: token, expectEnvelope: true },
    );
    return requireRow(data, "Failed to create loan account");
  });
}

/** Laravel: POST /api/LoanAccountEdit */
export async function updateLoanAccount(input: unknown): Promise<LoanAccount> {
  const validated = loanAccountSaveInputSchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);
  if (!validated.data.loanAccountId) {
    throw new ApiError({
      message: "loan_account_id is required",
      status: 422,
      code: "VALIDATION",
    });
  }

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.post<unknown>(
      endpoints.loanAccount.edit,
      {
        loan_account_id: validated.data.loanAccountId,
        application_id: validated.data.applicationId,
        loan_date: validated.data.loanDate,
        loan_amount: validated.data.loanAmount,
        interest_rate: validated.data.interestRate,
        final_due_date: validated.data.finalDueDate,
        loan_account_no: validated.data.loanAccountNo,
        ref_account_no: validated.data.refAccountNo,
        is_defaulter: validated.data.isDefaulter,
        is_npa: validated.data.isNpa,
      },
      { accessToken: token, expectEnvelope: true },
    );
    return requireRow(data, "Failed to update loan account");
  });
}

/** Laravel: POST /api/LoanAccountStatus */
export async function changeLoanAccountStatus(
  input: unknown,
): Promise<LoanAccount> {
  const validated = loanAccountStatusInputSchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.post<unknown>(
      endpoints.loanAccount.status,
      {
        loan_account_id: validated.data.loanAccountId,
        status_cd: validated.data.statusCd,
      },
      { accessToken: token, expectEnvelope: true },
    );
    return requireRow(data, "Failed to change loan account status");
  });
}
