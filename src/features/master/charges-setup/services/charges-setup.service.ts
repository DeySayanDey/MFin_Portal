import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import {
  mapChargeSetupDto,
  mapChargeSetupSaveToDto,
} from "../mappers/charges-setup.mapper";
import {
  chargeSetupSaveInputSchema,
  paginationMetaDtoSchema,
} from "../schemas/charges-setup.schema";
import type {
  ChargeKind,
  ChargeSetup,
  ChargeSetupDto,
  ChargeSetupListQuery,
  ChargeSetupListResult,
  ChargeSetupPagination,
} from "../types/charges-setup.types";

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

function pathsFor(kind: ChargeKind) {
  return kind === "deposit" ? endpoints.depositCharges : endpoints.loanCharges;
}

function resourceLabel(kind: ChargeKind): string {
  return kind === "deposit" ? "Deposit charge" : "Loan charge";
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

function parseRow(kind: ChargeKind, row: unknown): ChargeSetup | null {
  if (!row || typeof row !== "object") return null;
  return mapChargeSetupDto(row as ChargeSetupDto, kind);
}

function readMeta(
  meta: LaravelResponse<unknown>["meta"],
  itemCount: number,
): ChargeSetupPagination | null {
  if (!meta) return null;
  const parsed = paginationMetaDtoSchema.safeParse(meta);
  if (!parsed.success) return null;
  const page = Number(parsed.data.page ?? 1);
  const perPage = Number(parsed.data.per_page ?? DEFAULT_PER_PAGE);
  const total = Number(parsed.data.total ?? itemCount);
  const lastPage = Number(
    parsed.data.last_page ?? Math.max(1, Math.ceil(total / perPage)),
  );
  return {
    total,
    page,
    perPage,
    lastPage,
    hasMore: Boolean(parsed.data.has_more),
  };
}

/** Laravel: GET /api/DepositChargesList or /api/LoanChargesList */
export async function listCharges(
  kind: ChargeKind,
  query: ChargeSetupListQuery = {},
): Promise<ChargeSetupListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const duringKey =
      kind === "deposit" ? "charges_during_cd" : "deduct_during_cd";
    const payload = await api.get<LaravelResponse<ChargeSetupDto[]>>(
      pathsFor(kind).list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: clampPerPage(query.perPage),
          charge_id: query.chargeId,
          keyword: query.search,
          figure_cd: query.figureCd,
          [duringKey]: query.duringCd,
          is_refundable:
            kind === "loan" && query.isRefundable != null
              ? query.isRefundable
                ? 1
                : 0
              : undefined,
          is_active: query.isActive,
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
          : `Failed to load ${resourceLabel(kind).toLowerCase()}s`;
      throw new ApiError({
        message,
        status: 500,
        code: "UNEXPECTED",
        details: payload,
      });
    }

    const rows = Array.isArray(payload.data) ? payload.data : [];
    const items = rows.flatMap((row) => {
      const item = parseRow(kind, row);
      return item ? [item] : [];
    });

    return { items, meta: readMeta(payload.meta, items.length) };
  });
}

function requireSavedRow(kind: ChargeKind, data: unknown, action: string): ChargeSetup {
  const item = parseRow(kind, data);
  if (!item) {
    throw new ApiError({
      message: `${resourceLabel(kind)} ${action} response shape was unexpected`,
      status: 500,
      code: "UNEXPECTED",
    });
  }
  return item;
}

/** Laravel: POST /api/DepositChargesAdd or /api/LoanChargesAdd */
export async function createCharge(
  kind: ChargeKind,
  input: unknown,
): Promise<ChargeSetup> {
  const validated = chargeSetupSaveInputSchema.safeParse(input);
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
    const data = await api.post<ChargeSetupDto>(
      pathsFor(kind).add,
      mapChargeSetupSaveToDto(kind, validated.data),
      { accessToken: token, expectEnvelope: true },
    );
    if (!data) {
      throw new ApiError({
        message: `${resourceLabel(kind)} creation returned no data`,
        status: 500,
        code: "UNEXPECTED",
      });
    }
    return requireSavedRow(kind, data, "creation");
  });
}

/** Laravel: POST /api/DepositChargesEdit or /api/LoanChargesEdit */
export async function updateCharge(
  kind: ChargeKind,
  input: unknown,
): Promise<ChargeSetup> {
  const validated = chargeSetupSaveInputSchema.safeParse(input);
  if (!validated.success) {
    throw new ApiError({
      message: "Validation failed",
      status: 422,
      code: "VALIDATION",
      details: validated.error.flatten(),
    });
  }
  if (!validated.data.chargeId) {
    throw new ApiError({
      message: "charge_id is required",
      status: 422,
      code: "VALIDATION",
    });
  }

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.post<ChargeSetupDto>(
      pathsFor(kind).edit,
      mapChargeSetupSaveToDto(kind, validated.data),
      { accessToken: token, expectEnvelope: true },
    );
    if (!data) {
      throw new ApiError({
        message: `${resourceLabel(kind)} update returned no data`,
        status: 500,
        code: "UNEXPECTED",
      });
    }
    return requireSavedRow(kind, data, "update");
  });
}

/** Laravel: POST /api/DepositChargesStatus or /api/LoanChargesStatus */
export async function toggleChargeStatus(
  kind: ChargeKind,
  chargeId: number,
  isActive: boolean,
): Promise<ChargeSetup> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.post<ChargeSetupDto>(
      pathsFor(kind).status,
      { charge_id: chargeId, is_active: isActive },
      { accessToken: token, expectEnvelope: true },
    );
    if (!data) {
      throw new ApiError({
        message: `${resourceLabel(kind)} status update returned no data`,
        status: 500,
        code: "UNEXPECTED",
      });
    }
    return requireSavedRow(kind, data, "status");
  });
}
