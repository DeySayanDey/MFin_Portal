import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import {
  mapMakerCheckerCreateToDto,
  mapMakerCheckerDto,
  mapMakerCheckerUpdateToDto,
  mapPaginationMetaDto,
} from "@/features/master/maker-checker/mappers/maker-checker.mapper";
import {
  makerCheckerCreateInputSchema,
  makerCheckerDtoSchema,
  makerCheckerUpdateInputSchema,
  paginationMetaDtoSchema,
} from "@/features/master/maker-checker/schemas/maker-checker.schema";
import type {
  MakerCheckerDto,
  MakerCheckerListQuery,
  MakerCheckerListResult,
  MakerCheckerRule,
} from "@/features/master/maker-checker/types/maker-checker.types";
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

function parseRuleRow(row: unknown): MakerCheckerRule | null {
  const parsed = makerCheckerDtoSchema.safeParse(row);
  if (!parsed.success) return null;
  return mapMakerCheckerDto({
    ...parsed.data,
    created_by: parsed.data.created_by ?? null,
  });
}

export async function listMakerCheckerRules(
  query: MakerCheckerListQuery = {},
): Promise<MakerCheckerListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<MakerCheckerDto[]>>(
      endpoints.makerChecker.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: query.perPage ?? 50,
          id: query.id,
          voucher_type: query.voucherType,
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
          : "Failed to load maker-checker rules";
      throw new ApiError({
        message,
        status: 500,
        code: "UNEXPECTED",
        details: payload,
      });
    }

    const rows = Array.isArray(payload.data) ? payload.data : [];
    const items = rows.flatMap((row) => {
      const rule = parseRuleRow(row);
      return rule ? [rule] : [];
    });

    let meta: MakerCheckerListResult["meta"] = null;
    if (payload.meta) {
      const metaParsed = paginationMetaDtoSchema.safeParse(payload.meta);
      if (metaParsed.success) {
        meta = mapPaginationMetaDto(metaParsed.data);
      }
    }

    return { items, meta };
  });
}

export async function createMakerCheckerRule(
  input: unknown,
): Promise<MakerCheckerRule> {
  const validated = makerCheckerCreateInputSchema.safeParse(input);
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
    const body = mapMakerCheckerCreateToDto(validated.data);
    const data = await api.post<MakerCheckerDto>(
      endpoints.makerChecker.add,
      body,
      {
        accessToken: token,
        expectEnvelope: true,
      },
    );

    const rule = parseRuleRow(data);
    if (!rule) {
      throw new ApiError({
        message: "Maker-checker create response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
        details: data,
      });
    }
    return rule;
  });
}

export async function updateMakerCheckerRule(
  input: unknown,
): Promise<MakerCheckerRule> {
  const validated = makerCheckerUpdateInputSchema.safeParse(input);
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
    const body = mapMakerCheckerUpdateToDto(validated.data);
    const data = await api.post<MakerCheckerDto>(
      endpoints.makerChecker.edit,
      body,
      {
        accessToken: token,
        expectEnvelope: true,
      },
    );

    const rule = parseRuleRow(data);
    if (!rule) {
      throw new ApiError({
        message: "Maker-checker update response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
        details: data,
      });
    }
    return rule;
  });
}
