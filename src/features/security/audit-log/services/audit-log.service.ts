import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import {
  mapAuditLogDto,
  mapPaginationMetaDto,
} from "@/features/security/audit-log/mappers/audit-log.mapper";
import {
  auditLogDtoSchema,
  paginationMetaDtoSchema,
} from "@/features/security/audit-log/schemas/audit-log.schema";
import type {
  AuditLogDto,
  AuditLogListQuery,
  AuditLogListResult,
} from "@/features/security/audit-log/types/audit-log.types";
import type { LaravelResponse } from "@/types/api";

/** Live-verified search param (preferred over `keyword`). */
export const AUDIT_LOG_SEARCH_PARAM = "search" as const;
/** Live-verified date range aliases (`date_from` / `date_to`). */
export const AUDIT_LOG_DATE_FROM_PARAM = "date_from" as const;
export const AUDIT_LOG_DATE_TO_PARAM = "date_to" as const;

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

export async function listAuditLogs(
  query: AuditLogListQuery = {},
): Promise<AuditLogListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<AuditLogDto[]>>(
      endpoints.auditLog.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: query.perPage ?? 20,
          audit_id: query.auditId,
          user_id: query.userId,
          [AUDIT_LOG_SEARCH_PARAM]: query.search,
          action: query.action,
          menu_name: query.menuName,
          table_name: query.tableName,
          [AUDIT_LOG_DATE_FROM_PARAM]: query.dateFrom,
          [AUDIT_LOG_DATE_TO_PARAM]: query.dateTo,
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
          : "Failed to load audit logs";
      throw new ApiError({
        message,
        status: 500,
        code: "UNEXPECTED",
        details: payload,
      });
    }

    const rows = Array.isArray(payload.data) ? payload.data : [];
    const items = rows.flatMap((row) => {
      const parsed = auditLogDtoSchema.safeParse(row);
      return parsed.success ? [mapAuditLogDto(parsed.data)] : [];
    });

    let meta: AuditLogListResult["meta"] = null;
    if (payload.meta) {
      const metaParsed = paginationMetaDtoSchema.safeParse(payload.meta);
      if (metaParsed.success) {
        meta = mapPaginationMetaDto(metaParsed.data);
      }
    }

    return { items, meta };
  });
}
