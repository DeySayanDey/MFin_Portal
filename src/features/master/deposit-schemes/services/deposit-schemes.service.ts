import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import {
  mapDepositSchemeChargeSaveToDto,
  mapDepositSchemeDto,
  mapDepositSchemeSaveToDto,
  mapPaginationMetaDto,
  parseDepositSchemeChargeAssignResult,
  parseDepositSchemeChargeRow,
} from "../mappers/deposit-schemes.mapper";
import {
  depositSchemeChargeSaveInputSchema,
  depositSchemeDtoSchema,
  depositSchemeSetupSaveInputSchema,
  paginationMetaDtoSchema,
} from "../schemas/deposit-schemes.schema";
import type {
  DepositSchemeCharge,
  DepositSchemeChargeAssignResult,
  DepositSchemeChargeListQuery,
  DepositSchemeChargeListResult,
  DepositSchemeDto,
  DepositSchemeListQuery,
  DepositSchemeListResult,
  DepositSchemeSetup,
  PaginationMetaDto,
} from "../types/deposit-schemes.types";
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

function parseDepositSchemeRow(row: unknown): DepositSchemeSetup | null {
  const parsed = depositSchemeDtoSchema.safeParse(row);
  if (!parsed.success) return null;
  return mapDepositSchemeDto(parsed.data);
}

/** Laravel: GET /api/DepositSchemeList */
export async function listDepositSchemes(
  query: DepositSchemeListQuery = {},
): Promise<DepositSchemeListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<DepositSchemeDto[]>>(
      endpoints.depositScheme.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: clampPerPage(query.perPage),
          scheme_id: query.schemeId,
          keyword: query.search,
          deposit_type_cd: query.depositTypeCd,
          prod_type_cd: query.prodTypeCd,
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
          : "Failed to load deposit schemes";
      throw new ApiError({
        message,
        status: 500,
        code: "UNEXPECTED",
        details: payload,
      });
    }

    const rows = Array.isArray(payload.data) ? payload.data : [];
    const items = rows.flatMap((row) => {
      const item = parseDepositSchemeRow(row);
      return item ? [item] : [];
    });

    let meta: DepositSchemeListResult["meta"] = null;
    if (payload.meta) {
      const metaParsed = paginationMetaDtoSchema.safeParse(payload.meta);
      if (metaParsed.success) {
        meta = mapPaginationMetaDto(metaParsed.data as PaginationMetaDto);
      }
    }

    return { items, meta };
  });
}

/** Laravel: POST /api/DepositSchemeAdd */
export async function createDepositScheme(
  input: unknown,
): Promise<DepositSchemeSetup> {
  const validated = depositSchemeSetupSaveInputSchema.safeParse(input);
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
    const body = mapDepositSchemeSaveToDto(validated.data);
    const data = await api.post<DepositSchemeDto>(
      endpoints.depositScheme.add,
      body,
      {
        accessToken: token,
        expectEnvelope: true,
      },
    );

    if (!data) {
      throw new ApiError({
        message: "Deposit scheme creation returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    const item = parseDepositSchemeRow(data);
    if (!item) {
      throw new ApiError({
        message: "Deposit scheme response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    return item;
  });
}

/** Laravel: POST /api/DepositSchemeEdit */
export async function updateDepositScheme(
  input: unknown,
): Promise<DepositSchemeSetup> {
  const validated = depositSchemeSetupSaveInputSchema.safeParse(input);
  if (!validated.success) {
    throw new ApiError({
      message: "Validation failed",
      status: 422,
      code: "VALIDATION",
      details: validated.error.flatten(),
    });
  }

  if (!validated.data.schemeId) {
    throw new ApiError({
      message: "Scheme ID is required for update",
      status: 422,
      code: "VALIDATION",
    });
  }

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const body = mapDepositSchemeSaveToDto(validated.data);
    const data = await api.post<DepositSchemeDto>(
      endpoints.depositScheme.edit,
      body,
      {
        accessToken: token,
        expectEnvelope: true,
      },
    );

    if (!data) {
      throw new ApiError({
        message: "Deposit scheme update returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    const item = parseDepositSchemeRow(data);
    if (!item) {
      throw new ApiError({
        message: "Deposit scheme response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    return item;
  });
}

/** Laravel: POST /api/DepositSchemeStatus */
export async function toggleDepositSchemeStatus(
  schemeId: number,
  isActive: boolean,
): Promise<DepositSchemeSetup> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.post<DepositSchemeDto>(
      endpoints.depositScheme.status,
      {
        scheme_id: schemeId,
        is_active: isActive,
      },
      {
        accessToken: token,
        expectEnvelope: true,
      },
    );

    if (!data) {
      throw new ApiError({
        message: "Deposit scheme status update returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    const item = parseDepositSchemeRow(data);
    if (!item) {
      throw new ApiError({
        message: "Deposit scheme response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    return item;
  });
}

/** Laravel: GET /api/DepositSchemeChargesList */
export async function listDepositSchemeCharges(
  query: DepositSchemeChargeListQuery = {},
): Promise<DepositSchemeChargeListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<unknown[]>>(
      endpoints.depositSchemeCharges.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: clampPerPage(query.perPage),
          id: query.id,
          scheme_id: query.schemeId,
          charges_id: query.chargesId,
          is_active: query.isActive,
          include_details: query.includeDetails ? 1 : undefined,
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
          : "Failed to load deposit scheme charges";
      throw new ApiError({
        message,
        status: 500,
        code: "UNEXPECTED",
        details: payload,
      });
    }

    const rows = Array.isArray(payload.data) ? payload.data : [];
    const items = rows.flatMap((row) => {
      const item = parseDepositSchemeChargeRow(row);
      return item ? [item] : [];
    });

    let meta: DepositSchemeChargeListResult["meta"] = null;
    if (payload.meta) {
      const metaParsed = paginationMetaDtoSchema.safeParse(payload.meta);
      if (metaParsed.success) {
        meta = mapPaginationMetaDto(metaParsed.data as PaginationMetaDto);
      }
    }

    return { items, meta };
  });
}

function parseAssignResult(data: unknown): DepositSchemeChargeAssignResult {
  const result = parseDepositSchemeChargeAssignResult(data);
  if (!result) {
    throw new ApiError({
      message: "Deposit scheme charge response shape was unexpected",
      status: 500,
      code: "UNEXPECTED",
    });
  }
  return result;
}

/** Laravel: POST /api/DepositSchemeChargesAdd */
export async function createDepositSchemeCharge(
  input: unknown,
): Promise<DepositSchemeChargeAssignResult> {
  const validated = depositSchemeChargeSaveInputSchema.safeParse({
    ...(input as object),
    mode: "create",
  });
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
    const body = mapDepositSchemeChargeSaveToDto(validated.data);
    const data = await api.post<unknown>(
      endpoints.depositSchemeCharges.add,
      body,
      {
        accessToken: token,
        expectEnvelope: true,
      },
    );

    if (!data) {
      throw new ApiError({
        message: "Deposit scheme charge creation returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    return parseAssignResult(data);
  });
}

/** Laravel: POST /api/DepositSchemeChargesEdit */
export async function updateDepositSchemeCharge(
  input: unknown,
): Promise<DepositSchemeChargeAssignResult> {
  const validated = depositSchemeChargeSaveInputSchema.safeParse({
    ...(input as object),
    mode: "edit",
  });
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
    const body = mapDepositSchemeChargeSaveToDto(validated.data);
    const data = await api.post<unknown>(
      endpoints.depositSchemeCharges.edit,
      body,
      {
        accessToken: token,
        expectEnvelope: true,
      },
    );

    if (!data) {
      throw new ApiError({
        message: "Deposit scheme charge update returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    return parseAssignResult(data);
  });
}

/** Laravel: POST /api/DepositSchemeChargesStatus */
export async function toggleDepositSchemeChargeStatus(
  id: number,
  isActive: boolean,
): Promise<DepositSchemeCharge> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.post<unknown>(
      endpoints.depositSchemeCharges.status,
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
        message: "Deposit scheme charge status update returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    const item = parseDepositSchemeChargeRow(data);
    if (!item) {
      throw new ApiError({
        message: "Deposit scheme charge response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    return item;
  });
}
