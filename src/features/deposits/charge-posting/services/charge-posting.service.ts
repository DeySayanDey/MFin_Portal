import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import type { LaravelResponse } from "@/types/api";
import { mapChargeRow } from "../mappers/charge-posting.mapper";
import {
  CHARGE_BULK_LIMIT,
  chargeCalcQuerySchema,
  chargePostInputSchema,
  chargePostResultDtoSchema,
  chargeRowDtoSchema,
} from "../schemas/charge-posting.schema";
import type { ChargeCalcResult, ChargePostResult, ChargeRow } from "../types/charge-posting.types";

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

/** Laravel: GET /api/SavingsChargeCalculate */
export async function calculateSavingsCharges(input: unknown): Promise<ChargeCalcResult> {
  const parsed = chargeCalcQuerySchema.safeParse(input);
  if (!parsed.success) throw validationError(parsed.error);
  const query = parsed.data;

  return withToken(async (token) => {
    const payload = await api.get<LaravelResponse<unknown>>(endpoints.savingsCharges.calculate, {
      accessToken: token,
      expectEnvelope: false,
      searchParams: {
        charge_date: query.chargeDate,
        account_id: query.mode === "single" ? query.accountId : undefined,
        charge_id: query.mode === "bulk" ? query.chargeId : undefined,
        scheme_id: query.mode === "bulk" ? query.schemeId : undefined,
        keyword: query.mode === "bulk" ? query.keyword || undefined : undefined,
        branch_id: query.branchId,
        page: 1,
        per_page: CHARGE_BULK_LIMIT,
      },
    });
    const result = ensureSuccess(payload, "Charges could not be calculated");
    const items: ChargeRow[] = readRows(result.data).flatMap((entry) => {
      const row = chargeRowDtoSchema.safeParse(entry);
      return row.success ? [mapChargeRow(row.data)] : [];
    });
    return { items, total: readTotal(result, items.length) };
  });
}

/** Laravel: POST /api/SavingsChargePost */
export async function postSavingsCharges(input: unknown, branchId: number | undefined): Promise<ChargePostResult> {
  const parsed = chargePostInputSchema.safeParse(input);
  if (!parsed.success) throw validationError(parsed.error);
  const body = parsed.data;

  return withToken(async (token) => {
    const payload = await api.post<LaravelResponse<unknown>>(
      endpoints.savingsCharges.post,
      {
        mode: body.mode,
        charge_date: body.chargeDate,
        remarks: body.remarks || null,
        branch_id: branchId ?? null,
        rows: body.rows.map((row) => ({
          account_id: row.accountId,
          charge_id: row.chargeId,
          calculated_amount: row.calculatedAmount,
          charge_amount: row.chargeAmount,
        })),
      },
      { accessToken: token, expectEnvelope: false },
    );
    const result = ensureSuccess(payload, "Charges could not be posted");
    const dto = chargePostResultDtoSchema.safeParse(result.data);
    if (!dto.success) {
      throw new ApiError({ message: "Charge posting response was unexpected", status: 500, code: "UNEXPECTED" });
    }
    return {
      batchId: dto.data.batch_id,
      batchNo: dto.data.batch_no == null ? "" : String(dto.data.batch_no),
      postedCount: dto.data.posted_count ?? body.rows.length,
      totalCharge: dto.data.total_charge ?? 0,
      totalTax: dto.data.total_tax ?? 0,
      message: typeof result.message === "string" ? result.message : "",
    };
  });
}
