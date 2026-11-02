import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import {
  mapSavingsAccountBalanceDto,
  mapSavingsCustomerDto,
  mapSavingsTransactionAddToDto,
  mapSavingsTransactionApproveToDto,
  mapSavingsTransactionDto,
} from "../mappers/savings-transaction.mapper";
import {
  paginationMetaDtoSchema,
  savingsAccountBalanceSchema,
  savingsCustomerDtoSchema,
  savingsTransactionAddSchema,
  savingsTransactionApproveSchema,
  savingsTransactionDtoSchema,
} from "../schemas/savings-transaction.schema";
import type {
  SavingsAccountBalance,
  SavingsCustomer,
  SavingsCustomerListResult,
  SavingsCustomerQuery,
  SavingsTransaction,
  SavingsTransactionListQuery,
  SavingsTransactionListResult,
  SavingsTransactionResult,
} from "../types/savings-transaction.types";
import type { LaravelResponse } from "@/types/api";

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

function parseItem(row: unknown, fallback: string): SavingsTransaction {
  const parsed = savingsTransactionDtoSchema.safeParse(row);
  if (!parsed.success) {
    throw new ApiError({ message: fallback, status: 500, code: "UNEXPECTED" });
  }
  return mapSavingsTransactionDto(parsed.data);
}

/** Laravel: GET /api/SavingsTransactionList */
export async function listSavingsTransactions(
  query: SavingsTransactionListQuery = {},
): Promise<SavingsTransactionListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<unknown[]>>(
      endpoints.savingsTransaction.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: clampPerPage(query.perPage),
          trans_id: query.transId,
          account_id: query.accountId,
          member_id: query.memberId,
          group_id: query.groupId,
          branch_id: query.branchId,
          fo_id: query.foId,
          deposit_type_cd: query.depositTypeCd,
          trans_type_cd: query.transTypeCd,
          trans_mode: query.transMode,
          status_cd: query.statusCd,
          from_date: query.fromDate,
          to_date: query.toDate,
          keyword: query.search,
        },
      },
    );

    if (!payload || payload.success !== true) {
      throw new ApiError({
        message:
          payload && "message" in payload && typeof payload.message === "string"
            ? payload.message
            : "Failed to load transactions",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    const rows = Array.isArray(payload.data)
      ? payload.data
      : payload.data &&
          typeof payload.data === "object" &&
          "data" in payload.data &&
          Array.isArray(payload.data.data)
        ? payload.data.data
        : payload.data &&
            typeof payload.data === "object" &&
            "items" in payload.data &&
            Array.isArray(payload.data.items)
          ? payload.data.items
          : [];
    const items = rows.flatMap((row) => {
      const parsed = savingsTransactionDtoSchema.safeParse(row);
      return parsed.success ? [mapSavingsTransactionDto(parsed.data)] : [];
    });
    const metaParsed = paginationMetaDtoSchema.safeParse(
      "meta" in payload ? payload.meta : null,
    );

    return {
      items,
      meta: metaParsed.success
        ? {
            total: metaParsed.data.total,
            page: metaParsed.data.page ?? 1,
            perPage: metaParsed.data.per_page ?? DEFAULT_PER_PAGE,
            lastPage: metaParsed.data.last_page ?? 1,
          }
        : null,
    };
  });
}

/** Laravel: POST /api/SavingsTransactionAdd */
export async function addSavingsTransaction(
  input: unknown,
): Promise<SavingsTransactionResult> {
  const validated = savingsTransactionAddSchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<unknown>>(
      endpoints.savingsTransaction.add,
      mapSavingsTransactionAddToDto(validated.data),
      { accessToken: token, expectEnvelope: false },
    );
    if (!payload || payload.success !== true) {
      throw new ApiError({
        message:
          payload && typeof payload.message === "string"
            ? payload.message
            : "Transaction could not be saved",
        status: 422,
        code: "VALIDATION",
      });
    }
    return {
      item: parseItem(payload.data, "Transaction response was unexpected"),
      message: payload.message,
    };
  });
}

/** Laravel: POST /api/SavingsTransactionApprove */
export async function approveSavingsTransaction(
  input: unknown,
): Promise<SavingsTransactionResult> {
  const validated = savingsTransactionApproveSchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<unknown>>(
      endpoints.savingsTransaction.approve,
      mapSavingsTransactionApproveToDto(validated.data),
      { accessToken: token, expectEnvelope: false },
    );
    if (!payload || payload.success !== true) {
      throw new ApiError({
        message:
          payload && typeof payload.message === "string"
            ? payload.message
            : "Transaction could not be updated",
        status: 422,
        code: "VALIDATION",
      });
    }
    return {
      item: parseItem(payload.data, "Transaction response was unexpected"),
      message: payload.message,
    };
  });
}

/** Laravel: GET /api/SavingsCustomerList */
export async function listSavingsCustomers(
  query: SavingsCustomerQuery = {},
): Promise<SavingsCustomerListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<unknown[]>>(
      endpoints.savingsTransaction.customerList,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: clampPerPage(query.perPage),
          keyword: query.keyword,
          cust_type_cd: query.custTypeCd,
          deposit_type_cd: query.depositTypeCd,
          branch_id: query.branchId,
        },
      },
    );
    if (!payload || payload.success !== true) {
      throw new ApiError({
        message:
          payload && typeof payload.message === "string"
            ? payload.message
            : "Failed to load customers",
        status: 500,
        code: "UNEXPECTED",
      });
    }
    const rows = Array.isArray(payload.data) ? payload.data : [];
    const items = rows.flatMap((row) => {
      const parsed = savingsCustomerDtoSchema.safeParse(row);
      return parsed.success ? [mapSavingsCustomerDto(parsed.data)] : [];
    });
    const metaParsed = paginationMetaDtoSchema.safeParse(
      payload && typeof payload === "object" && "meta" in payload ? payload.meta : null,
    );
    return {
      items,
      meta: metaParsed.success
        ? {
            total: metaParsed.data.total,
            page: metaParsed.data.page ?? query.page ?? 1,
            perPage: metaParsed.data.per_page ?? clampPerPage(query.perPage),
            lastPage: metaParsed.data.last_page ?? 1,
          }
        : null,
    };
  });
}

/** Laravel: GET /api/SavingsAccountBalance */
export async function getSavingsAccountBalance(
  accountId: number,
): Promise<SavingsAccountBalance> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<unknown>>(
      endpoints.savingsTransaction.balance,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: { account_id: accountId },
      },
    );
    if (!payload || payload.success !== true) {
      throw new ApiError({
        message:
          payload && typeof payload.message === "string"
            ? payload.message
            : "Failed to load account balance",
        status: 422,
        code: "VALIDATION",
      });
    }
    const parsed = savingsAccountBalanceSchema.safeParse(payload.data);
    if (!parsed.success) {
      throw new ApiError({
        message: "Balance response was unexpected",
        status: 500,
        code: "UNEXPECTED",
      });
    }
    return mapSavingsAccountBalanceDto(parsed.data);
  });
}

/** Laravel: POST /api/SavingsTransactionVoucherPost */
export async function postSavingsTransactionVouchers(accountId: number): Promise<string> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<unknown>>(
      endpoints.savingsTransaction.voucherPost,
      { account_id: accountId },
      { accessToken: token, expectEnvelope: false },
    );
    if (!payload || payload.success !== true) {
      throw new ApiError({
        message:
          payload && typeof payload.message === "string"
            ? payload.message
            : "Vouchers could not be posted",
        status: 422,
        code: "VALIDATION",
      });
    }
    return payload.message ?? "Vouchers posted";
  });
}
