import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import type { LaravelResponse } from "@/types/api";
import type {
  LoanDisbursementAddInput,
  LoanDisbursementAddResult,
  LoanDisbursementApproveInput,
  LoanDisbursementListQuery,
  LoanDisbursementListResult,
  LoanDisbursementPreviewQuery,
  LoanDisbursementPreviewResult,
  LoanDisbursementRow,
} from "../types/disbursement.types";

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

function assertSuccess<T>(
  payload: LaravelResponse<T>,
  fallback = "Request failed",
): asserts payload is Extract<LaravelResponse<T>, { success: true }> {
  if (!payload || !payload.success) {
    throw new ApiError({
      message: (payload && payload.message) || fallback,
      status: 422,
      code: "VALIDATION",
    });
  }
}

export async function fetchDisbursementList(
  query: LoanDisbursementListQuery = {},
): Promise<LoanDisbursementListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<LoanDisbursementRow[]>>(
      endpoints.loanDisbursement.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          disbursement_id: query.disbursement_id,
          loan_account_id: query.loan_account_id,
          branch_id: query.branch_id,
          approval: query.approval,
          is_final: query.is_final !== undefined ? (query.is_final ? 1 : 0) : undefined,
          payment_mode_cd: query.payment_mode_cd,
          from_date: query.from_date,
          to_date: query.to_date,
          keyword: query.keyword,
          page: query.page ?? 1,
          per_page: query.per_page ?? 50,
        },
      },
    );

    assertSuccess(payload, "Failed to retrieve disbursements");

    let items: LoanDisbursementRow[] = [];
    let total = 0;

    if (Array.isArray(payload.data)) {
      items = payload.data;
      total = payload.meta?.total ?? items.length;
    } else if (payload.data && typeof payload.data === "object") {
      const obj = payload.data as Record<string, unknown>;
      if (Array.isArray(obj.items)) {
        items = obj.items as LoanDisbursementRow[];
        total = typeof obj.total === "number" ? obj.total : items.length;
      }
    }

    return { items, total };
  });
}

export async function fetchDisbursementPreview(
  query: LoanDisbursementPreviewQuery,
): Promise<LoanDisbursementPreviewResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<LoanDisbursementPreviewResult>>(
      endpoints.loanDisbursement.preview,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          loan_account_id: query.loan_account_id,
          gross_amount: query.gross_amount,
          other_deduction: query.other_deduction,
        },
      },
    );

    assertSuccess(payload, "Failed to generate disbursement preview");
    return payload.data;
  });
}

export async function createDisbursement(
  input: LoanDisbursementAddInput,
): Promise<LoanDisbursementAddResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<LoanDisbursementAddResult>>(
      endpoints.loanDisbursement.add,
      input,
      {
        accessToken: token,
        expectEnvelope: false,
      },
    );

    assertSuccess(payload, "Failed to record disbursement");
    return payload.data;
  });
}

export async function approveDisbursement(
  input: LoanDisbursementApproveInput,
): Promise<LoanDisbursementAddResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<LoanDisbursementAddResult>>(
      endpoints.loanDisbursement.approve,
      input,
      {
        accessToken: token,
        expectEnvelope: false,
      },
    );

    assertSuccess(payload, "Failed to approve disbursement");
    return payload.data;
  });
}
