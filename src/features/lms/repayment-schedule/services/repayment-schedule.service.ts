import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import { mapLoanScheduleRow } from "../mappers/repayment-schedule.mapper";
import type {
  LoanScheduleListQuery,
  LoanScheduleListResult,
  LoanScheduleRowDto,
} from "../types/repayment-schedule.types";
import type { LaravelResponse } from "@/types/api";

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

function extractRows(data: unknown): LoanScheduleRowDto[] {
  if (Array.isArray(data)) return data as LoanScheduleRowDto[];
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as LoanScheduleRowDto[];
    if (Array.isArray(obj.rows)) return obj.rows as LoanScheduleRowDto[];
    if (Array.isArray(obj.schedule)) return obj.schedule as LoanScheduleRowDto[];
  }
  return [];
}

export async function fetchLoanScheduleList(
  query: LoanScheduleListQuery,
): Promise<LoanScheduleListResult> {
  return withUnauthorizedClear(async () => {
    if (!query.loanAccountId || query.loanAccountId < 1) {
      throw new ApiError({
        message: "loan_account_id is required",
        status: 422,
        code: "VALIDATION",
      });
    }

    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<unknown>>(
      endpoints.loanSchedule.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          loan_account_id: query.loanAccountId,
          as_on: query.asOn,
        },
      },
    );

    assertSuccess(payload, "Failed to retrieve repayment schedule");

    const items = extractRows(payload.data).map(mapLoanScheduleRow);
    const meta = payload.meta as Record<string, unknown> | undefined;
    const asOn =
      typeof meta?.as_on === "string"
        ? meta.as_on
        : query.asOn ?? null;

    return { items, asOn };
  });
}
