import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import { legacyRecordId, sameRecordCode, type RecordRef } from "@/lib/navigation/record-code";
import type { LaravelResponse, LaravelSuccessResponse } from "@/types/api";
import { settlementAccountCode } from "../fd-settlement.routes";
import {
  SETTLEMENT_TYPE_CD,
  accountStatusParam,
  mapSettlementAccountDto,
  mapSettlementQuoteDto,
  mapSettlementRequestDto,
  mapSettlementSaveToFields,
  requestStatusParam,
} from "../mappers/fd-settlement.mapper";
import {
  paginationMetaDtoSchema,
  settlementAccountDetailDtoSchema,
  settlementAccountDtoSchema,
  settlementActionSchema,
  settlementCalculateSchema,
  settlementQuoteDtoSchema,
  settlementRequestDtoSchema,
  settlementSaveSchema,
} from "../schemas/fd-settlement.schema";
import type {
  ListResult,
  SettlementAccount,
  SettlementAccountDetail,
  SettlementAccountQuery,
  SettlementQuote,
  SettlementRequest,
  SettlementRequestQuery,
} from "../types/fd-settlement.types";

const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;

type Scope = { branchId?: number };

function clampPerPage(value: number | undefined): number {
  const raw = value ?? DEFAULT_PER_PAGE;
  if (!Number.isFinite(raw) || raw < 1) return DEFAULT_PER_PAGE;
  return Math.min(Math.floor(raw), MAX_PER_PAGE);
}

async function requireAccessToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError({ message: "Unauthorized. Bearer token required.", status: 401, code: "UNAUTHORIZED" });
  }
  return token;
}

async function withToken<T>(run: (token: string) => Promise<T>): Promise<T> {
  try {
    return await run(await requireAccessToken());
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) await clearAuthSession();
    throw error;
  }
}

function validationError(error: { flatten: () => unknown }): ApiError {
  return new ApiError({ message: "Validation failed", status: 422, code: "VALIDATION", details: error.flatten() });
}

function unexpected(message: string): ApiError {
  return new ApiError({ message, status: 500, code: "UNEXPECTED" });
}

function ensureSuccess<T>(
  payload: LaravelResponse<T> | null | undefined,
  fallback: string,
  status = 422,
): LaravelSuccessResponse<T> {
  if (!payload || payload.success !== true) {
    throw new ApiError({
      message: payload && typeof payload.message === "string" ? payload.message : fallback,
      status,
      code: status === 404 ? "NOT_FOUND" : status >= 500 ? "UNEXPECTED" : "VALIDATION",
    });
  }
  return payload;
}

function readRows(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.data)) return record.data;
    if (Array.isArray(record.items)) return record.items;
  }
  return [];
}

function readMeta(payload: unknown, query: { page?: number; perPage?: number }) {
  const meta = payload && typeof payload === "object" && "meta" in payload ? payload.meta : null;
  const parsed = paginationMetaDtoSchema.safeParse(meta);
  if (!parsed.success) return null;
  return {
    total: parsed.data.total,
    page: parsed.data.page ?? query.page ?? 1,
    perPage: parsed.data.per_page ?? clampPerPage(query.perPage),
    lastPage: parsed.data.last_page ?? 1,
  };
}

function parseRequest(row: unknown): SettlementRequest {
  const parsed = settlementRequestDtoSchema.safeParse(row);
  if (!parsed.success) throw unexpected("Settlement response was unexpected");
  return mapSettlementRequestDto(parsed.data);
}

/** Laravel: GET /api/TdSettlementAccountList */
export async function listSettlementAccounts(
  query: SettlementAccountQuery,
): Promise<ListResult<SettlementAccount>> {
  return withToken(async (token) => {
    const payload = await api.get<LaravelResponse<unknown>>(endpoints.tdSettlement.accountList, {
      accessToken: token,
      expectEnvelope: false,
      searchParams: {
        page: query.page ?? 1,
        per_page: clampPerPage(query.perPage),
        scheme_type: query.scheme,
        keyword: query.keyword,
        branch_id: query.branchId,
        account_status: accountStatusParam(query.status),
      },
    });
    const { data } = ensureSuccess(payload, "Failed to load deposit accounts", 500);
    const items = readRows(data).flatMap((row) => {
      const parsed = settlementAccountDtoSchema.safeParse(row);
      return parsed.success ? [mapSettlementAccountDto(parsed.data)] : [];
    });
    return { items, meta: readMeta(payload, query) };
  });
}

/** Laravel: GET /api/TdSettlementAccountGet */
export async function getSettlementAccount(
  accountId: number,
  scope: Scope,
): Promise<SettlementAccountDetail> {
  if (!Number.isInteger(accountId) || accountId <= 0) {
    throw new ApiError({ message: "Deposit account not found", status: 404, code: "NOT_FOUND" });
  }
  return withToken(async (token) => {
    const payload = await api.get<LaravelResponse<unknown>>(endpoints.tdSettlement.accountGet, {
      accessToken: token,
      expectEnvelope: false,
      searchParams: { account_id: accountId, branch_id: scope.branchId },
    });
    const { data } = ensureSuccess(payload, "Deposit account not found", 404);
    const parsed = settlementAccountDetailDtoSchema.safeParse(data);
    if (!parsed.success) throw unexpected("Deposit account response was unexpected");
    const account = mapSettlementAccountDto(parsed.data.account);
    if (scope.branchId != null && account.branchId !== scope.branchId) {
      throw new ApiError({ message: "Forbidden", status: 403, code: "FORBIDDEN" });
    }
    return {
      account,
      openRequest: parsed.data.open_request ? mapSettlementRequestDto(parsed.data.open_request) : null,
      settledRequest: parsed.data.settled_request ? mapSettlementRequestDto(parsed.data.settled_request) : null,
    };
  });
}

/** Resolves an account code from a page URL to its id within the caller's branch. */
export async function resolveSettlementAccountRef(
  code: string,
  branchId: number | undefined,
): Promise<RecordRef | null> {
  const { items } = await listSettlementAccounts({ keyword: code, branchId, perPage: MAX_PER_PAGE });
  const match = items.find((item) => item.accountNumber && sameRecordCode(item.accountNumber, code));
  if (match) return { id: match.id, code: settlementAccountCode(match.accountNumber, match.id) };

  const legacyId = legacyRecordId(code);
  if (legacyId == null) return null;
  const { account } = await getSettlementAccount(legacyId, { branchId });
  return { id: account.id, code: settlementAccountCode(account.accountNumber, account.id) };
}

/** Laravel: GET /api/TdSettlementCalculate */
export async function calculateSettlement(input: unknown, scope: Scope): Promise<SettlementQuote> {
  const validated = settlementCalculateSchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);
  return withToken(async (token) => {
    const payload = await api.get<LaravelResponse<unknown>>(endpoints.tdSettlement.calculate, {
      accessToken: token,
      expectEnvelope: false,
      searchParams: {
        account_id: validated.data.accountId,
        settlement_type_cd: SETTLEMENT_TYPE_CD[validated.data.settlementType],
        settlement_date: validated.data.settlementDate,
        branch_id: scope.branchId,
      },
    });
    const { data } = ensureSuccess(payload, "Settlement could not be calculated");
    const parsed = settlementQuoteDtoSchema.safeParse(data);
    const quote = parsed.success ? mapSettlementQuoteDto(parsed.data) : null;
    if (!quote) throw unexpected("Calculation response was unexpected");
    return quote;
  });
}

/** Laravel: GET /api/TdSettlementList */
export async function listSettlementRequests(
  query: SettlementRequestQuery,
): Promise<ListResult<SettlementRequest>> {
  return withToken(async (token) => {
    const payload = await api.get<LaravelResponse<unknown>>(endpoints.tdSettlement.list, {
      accessToken: token,
      expectEnvelope: false,
      searchParams: {
        page: query.page ?? 1,
        per_page: clampPerPage(query.perPage),
        status_cd: requestStatusParam(query.view),
        branch_id: query.branchId,
      },
    });
    const { data } = ensureSuccess(payload, "Failed to load settlement requests", 500);
    const items = readRows(data).flatMap((row) => {
      const parsed = settlementRequestDtoSchema.safeParse(row);
      return parsed.success ? [mapSettlementRequestDto(parsed.data)] : [];
    });
    return { items, meta: readMeta(payload, query) };
  });
}

/** Laravel: POST /api/TdSettlementSave (multipart; document is optional) */
export async function saveSettlement(
  input: unknown,
  document: File | null,
  scope: Scope,
): Promise<{ item: SettlementRequest; message: string }> {
  const validated = settlementSaveSchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);
  return withToken(async (token) => {
    const body = new FormData();
    for (const [key, value] of Object.entries(mapSettlementSaveToFields(validated.data))) {
      body.set(key, value);
    }
    if (scope.branchId != null) body.set("branch_id", String(scope.branchId));
    if (document) body.set("document", document, document.name);
    const payload = await api.post<LaravelResponse<unknown>>(endpoints.tdSettlement.save, body, {
      accessToken: token,
      expectEnvelope: false,
    });
    const result = ensureSuccess(payload, "Settlement could not be saved");
    return { item: parseRequest(result.data), message: result.message ?? "" };
  });
}

/** Laravel: POST /api/TdSettlementApprove | POST /api/TdSettlementPost */
export async function runSettlementAction(
  input: unknown,
  scope: Scope,
): Promise<{ item: SettlementRequest; message: string }> {
  const validated = settlementActionSchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);
  const action = validated.data;
  return withToken(async (token) => {
    const branch = scope.branchId != null ? { branch_id: scope.branchId } : {};
    const payload =
      action.action === "post"
        ? await api.post<LaravelResponse<unknown>>(
            endpoints.tdSettlement.post,
            { settlement_id: action.settlementId, ...branch },
            { accessToken: token, expectEnvelope: false },
          )
        : await api.post<LaravelResponse<unknown>>(
            endpoints.tdSettlement.approve,
            {
              settlement_id: action.settlementId,
              approve: action.action === "approve" ? 1 : 0,
              remarks: action.action === "reject" ? action.reason : undefined,
              ...branch,
            },
            { accessToken: token, expectEnvelope: false },
          );
    const result = ensureSuccess(payload, "Settlement could not be updated");
    return { item: parseRequest(result.data), message: result.message ?? "" };
  });
}
