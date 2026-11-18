import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import type { LaravelResponse } from "@/types/api";
import { mapInterestRow } from "../mappers/interest-posting.mapper";
import {
  INTEREST_BULK_LIMIT,
  interestCalcQuerySchema,
  interestPostInputSchema,
  interestPostResultDtoSchema,
  interestRowDtoSchema,
} from "../schemas/interest-posting.schema";
import type {
  InterestCalcResult,
  InterestPostResult,
  InterestRow,
} from "../types/interest-posting.types";

async function withToken<T>(run: (token: string) => Promise<T>): Promise<T> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError({ message: "Unauthorized. Bearer token required.", status: 401, code: "UNAUTHORIZED" });
  }
  try {
    return await run(token);
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) await clearAuthSession();
    throw error;
  }
}

function validationError(error: { flatten: () => unknown; issues: { message: string }[] }): ApiError {
  return new ApiError({
    message: error.issues[0]?.message ?? "Validation failed",
    status: 422,
    code: "VALIDATION",
    details: error.flatten(),
  });
}

function ensureSuccess(payload: LaravelResponse<unknown> | null | undefined, fallback: string) {
  if (!payload || payload.success !== true) {
    throw new ApiError({
      message: payload && typeof payload.message === "string" ? payload.message : fallback,
      status: 422,
      code: "VALIDATION",
    });
  }
  return payload;
}

function readRows(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: unknown[] }).items;
  }
  return [];
}

function readTotal(payload: unknown, fallback: number): number {
  const meta = payload && typeof payload === "object" ? (payload as { meta?: { total?: unknown } }).meta : null;
  const total = Number(meta?.total);
  return Number.isFinite(total) && total >= 0 ? total : fallback;
}

/** Laravel: GET /api/SavingsInterestCalculate */
export async function calculateSavingsInterest(input: unknown): Promise<InterestCalcResult> {
  const parsed = interestCalcQuerySchema.safeParse(input);
  if (!parsed.success) throw validationError(parsed.error);
  const query = parsed.data;

  return withToken(async (token) => {
    const payload = await api.get<LaravelResponse<unknown>>(endpoints.savingsInterest.calculate, {
      accessToken: token,
      expectEnvelope: false,
      searchParams: {
        as_on_date: query.asOnDate,
        account_id: query.mode === "single" ? query.accountId : undefined,
        scheme_id: query.mode === "bulk" ? query.schemeId : undefined,
        keyword: query.mode === "bulk" ? query.keyword || undefined : undefined,
        branch_id: query.branchId,
        page: 1,
        per_page: query.mode === "single" ? 1 : INTEREST_BULK_LIMIT,
      },
    });
    const result = ensureSuccess(payload, "Interest could not be calculated");
    const items: InterestRow[] = readRows(result.data).flatMap((entry) => {
      const row = interestRowDtoSchema.safeParse(entry);
      return row.success ? [mapInterestRow(row.data)] : [];
    });
    return { items, total: readTotal(result, items.length) };
  });
}

/** Laravel: POST /api/SavingsInterestPost */
export async function postSavingsInterest(input: unknown, branchId: number | undefined): Promise<InterestPostResult> {
  const parsed = interestPostInputSchema.safeParse(input);
  if (!parsed.success) throw validationError(parsed.error);
  const body = parsed.data;

  return withToken(async (token) => {
    const payload = await api.post<LaravelResponse<unknown>>(
      endpoints.savingsInterest.post,
      {
        mode: body.mode,
        as_on_date: body.asOnDate,
        posting_date: body.postingDate,
        remarks: body.remarks || null,
        branch_id: branchId ?? null,
        rows: body.rows.map((row) => ({
          account_id: row.accountId,
          from_date: row.fromDate,
          to_date: row.toDate,
          calculated_interest: row.calculatedInterest,
          interest_amount: row.interestAmount,
        })),
      },
      { accessToken: token, expectEnvelope: false },
    );
    const result = ensureSuccess(payload, "Interest could not be posted");
    const dto = interestPostResultDtoSchema.safeParse(result.data);
    if (!dto.success) {
      throw new ApiError({ message: "Interest posting response was unexpected", status: 500, code: "UNEXPECTED" });
    }
    return {
      batchId: dto.data.batch_id,
      batchNo: dto.data.batch_no == null ? "" : String(dto.data.batch_no),
      postedCount: dto.data.posted_count ?? body.rows.length,
      totalInterest: dto.data.total_interest ?? 0,
      message: typeof result.message === "string" ? result.message : "",
    };
  });
}
