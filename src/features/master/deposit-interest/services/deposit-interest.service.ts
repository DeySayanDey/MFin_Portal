import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import {
  mapDepositSchemeSlabSaveToDto,
  parseDepositSchemeSlabRow,
} from "../mappers/deposit-interest.mapper";
import {
  depositSchemeSlabSaveInputSchema,
} from "../schemas/deposit-interest.schema";
import type {
  DepositSchemeSlab,
  DepositSchemeSlabDto,
  DepositSchemeSlabListQuery,
  DepositSchemeSlabListResult,
  PaginationMeta,
} from "../types/deposit-interest.types";

type LaravelResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    per_page?: number;
    last_page?: number;
    has_more?: boolean;
  };
};

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

/** Laravel: GET /api/DepositSchemeSlabList */
export async function listDepositSchemeSlabs(
  query: DepositSchemeSlabListQuery = {},
): Promise<DepositSchemeSlabListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<DepositSchemeSlabDto[]>>(
      endpoints.depositSchemeSlab.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: clampPerPage(query.perPage),
          id: query.id,
          scheme_id: query.schemeId,
          term_cd: query.termCd,
          duration: query.duration,
          effective_on: query.effectiveOn,
          is_active: query.isActive,
          search: query.search,
        },
      },
    );

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
          : "Failed to load deposit interest slabs";
      throw new ApiError({
        message,
        status: 500,
        code: "UNEXPECTED",
        details: payload,
      });
    }

    const rows = Array.isArray(payload.data) ? payload.data : [];
    const items = rows.flatMap((row) => {
      const item = parseDepositSchemeSlabRow(row);
      return item ? [item] : [];
    });

    let meta: PaginationMeta | null = null;
    if (payload.meta) {
      meta = {
        total: Number(payload.meta.total ?? items.length),
        page: Number(payload.meta.page ?? 1),
        perPage: Number(payload.meta.per_page ?? 50),
        lastPage: Number(payload.meta.last_page ?? 1),
        hasMore: Boolean(payload.meta.has_more),
      };
    }

    return { items, meta };
  });
}

/** Laravel: POST /api/DepositSchemeSlabAdd */
export async function createDepositSchemeSlab(
  input: unknown,
): Promise<DepositSchemeSlab> {
  const validated = depositSchemeSlabSaveInputSchema.safeParse(input);
  if (!validated.success) {
    throw new ApiError({
      message: "Validation failed",
      status: 422,
      code: "VALIDATION",
      details: validated.error.flatten(),
    });
  }

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const body = mapDepositSchemeSlabSaveToDto(validated.data);
    const data = await api.post<DepositSchemeSlabDto>(
      endpoints.depositSchemeSlab.add,
      body,
      {
        accessToken: token,
        expectEnvelope: true,
      },
    );

    if (!data) {
      throw new ApiError({
        message: "Deposit scheme slab creation returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    const item = parseDepositSchemeSlabRow(data);
    if (!item) {
      throw new ApiError({
        message: "Deposit scheme slab response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    return item;
  });
}

/** Laravel: POST /api/DepositSchemeSlabStatus */
export async function toggleDepositSchemeSlabStatus(
  id: number,
  isActive: boolean,
): Promise<DepositSchemeSlab> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.post<DepositSchemeSlabDto>(
      endpoints.depositSchemeSlab.status,
      {
        id,
        is_active: isActive,
      },
      {
        accessToken: token,
        expectEnvelope: true,
      },
    );

    if (!data) {
      throw new ApiError({
        message: "Deposit scheme slab status update returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    const item = parseDepositSchemeSlabRow(data);
    if (!item) {
      throw new ApiError({
        message: "Deposit scheme slab status response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    return item;
  });
}
