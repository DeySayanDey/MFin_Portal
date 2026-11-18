import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import {
  mapShareHoldingDto,
  mapShareSubscriptionAddToDto,
  mapShareSubscriptionApproveToDto,
  mapShareSubscriptionDto,
  mapShareSubscriptionEditToDto,
} from "../mappers/share-subscription.mapper";
import {
  paginationMetaDtoSchema,
  shareHoldingDtoSchema,
  shareHoldingQuerySchema,
  shareSubscriptionAddSchema,
  shareSubscriptionApproveSchema,
  shareSubscriptionDtoSchema,
  shareSubscriptionEditSchema,
} from "../schemas/share-subscription.schema";
import type {
  ShareHolding,
  ShareSubscription,
  ShareSubscriptionListQuery,
  ShareSubscriptionListResult,
  ShareSubscriptionResult,
} from "../types/share-subscription.types";
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

function failure(payload: unknown, fallback: string, status: number): ApiError {
  const message =
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
      ? payload.message
      : fallback;
  return new ApiError({
    message,
    status,
    code: status === 422 ? "VALIDATION" : "UNEXPECTED",
    details:
      payload && typeof payload === "object" && "errors" in payload
        ? payload.errors
        : undefined,
  });
}

function parseItem(row: unknown, fallback: string): ShareSubscription {
  const parsed = shareSubscriptionDtoSchema.safeParse(row);
  if (!parsed.success) {
    throw new ApiError({ message: fallback, status: 500, code: "UNEXPECTED" });
  }
  return mapShareSubscriptionDto(parsed.data);
}

/** Laravel: GET /api/ShareSubscriptionList */
export async function listShareSubscriptions(
  query: ShareSubscriptionListQuery = {},
): Promise<ShareSubscriptionListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<unknown[]>>(
      endpoints.shareSubscription.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: clampPerPage(query.perPage),
          subscription_id: query.subscriptionId,
          cust_type_cd: query.custTypeCd,
          customer_id: query.customerId,
          branch_id: query.branchId,
          tr_status_cd: query.statusCd,
          from_date: query.fromDate,
          to_date: query.toDate,
          keyword: query.search,
        },
      },
    );

    if (!payload || payload.success !== true) {
      throw failure(payload, "Failed to load share subscriptions", 500);
    }

    const rows = Array.isArray(payload.data) ? payload.data : [];
    const items = rows.flatMap((row) => {
      const parsed = shareSubscriptionDtoSchema.safeParse(row);
      return parsed.success ? [mapShareSubscriptionDto(parsed.data)] : [];
    });
    const metaParsed = paginationMetaDtoSchema.safeParse(payload.meta ?? null);

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

/** Laravel: GET /api/ShareHoldingGet */
export async function getShareHolding(input: unknown): Promise<ShareHolding> {
  const validated = shareHoldingQuerySchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<unknown>>(
      endpoints.shareSubscription.holding,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          cust_type_cd: validated.data.custTypeCd,
          customer_id: validated.data.customerId,
        },
      },
    );
    if (!payload || payload.success !== true) {
      throw failure(payload, "Share holding could not be loaded", 500);
    }
    const parsed = shareHoldingDtoSchema.safeParse(payload.data);
    if (!parsed.success) {
      throw new ApiError({
        message: "Share holding response was unexpected",
        status: 500,
        code: "UNEXPECTED",
      });
    }
    return mapShareHoldingDto(parsed.data);
  });
}

/** Laravel: POST /api/ShareSubscriptionAdd */
export async function addShareSubscription(
  input: unknown,
): Promise<ShareSubscriptionResult> {
  const validated = shareSubscriptionAddSchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<unknown>>(
      endpoints.shareSubscription.add,
      mapShareSubscriptionAddToDto(validated.data),
      { accessToken: token, expectEnvelope: false },
    );
    if (!payload || payload.success !== true) {
      throw failure(payload, "Share subscription could not be saved", 422);
    }
    return {
      item: parseItem(payload.data, "Share subscription response was unexpected"),
      message: payload.message,
    };
  });
}

/** Laravel: POST /api/ShareSubscriptionEdit */
export async function editShareSubscription(
  input: unknown,
): Promise<ShareSubscriptionResult> {
  const validated = shareSubscriptionEditSchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<unknown>>(
      endpoints.shareSubscription.edit,
      mapShareSubscriptionEditToDto(validated.data),
      { accessToken: token, expectEnvelope: false },
    );
    if (!payload || payload.success !== true) {
      throw failure(payload, "Share subscription could not be updated", 422);
    }
    return {
      item: parseItem(payload.data, "Share subscription response was unexpected"),
      message: payload.message,
    };
  });
}

/** Laravel: POST /api/ShareSubscriptionApprove */
export async function approveShareSubscription(
  input: unknown,
): Promise<ShareSubscriptionResult> {
  const validated = shareSubscriptionApproveSchema.safeParse(input);
  if (!validated.success) throw validationError(validated.error);

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.post<LaravelResponse<unknown>>(
      endpoints.shareSubscription.approve,
      mapShareSubscriptionApproveToDto(validated.data),
      { accessToken: token, expectEnvelope: false },
    );
    if (!payload || payload.success !== true) {
      throw failure(payload, "Share subscription could not be updated", 422);
    }
    return {
      item: parseItem(payload.data, "Share subscription response was unexpected"),
      message: payload.message,
    };
  });
}
