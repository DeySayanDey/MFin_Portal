import { NextResponse } from "next/server";
import { listAuditLogs } from "@/features/security/audit-log/services/audit-log.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import {
  requireSessionUser,
  resolveAuditUserFilter,
} from "@/lib/auth/bff-scope";

function readOptionalNumber(raw: string | null): number | undefined {
  if (raw == null || raw === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function readOptionalText(raw: string | null): string | undefined {
  if (raw == null) return undefined;
  const trimmed = raw.trim();
  return trimmed === "" ? undefined : trimmed;
}

/**
 * BFF → Laravel GET /api/AuditLogList
 * Accepts documented query names; `keyword` aliases `search`.
 * Date aliases: `from_date`/`to_date` (docs) and legacy `date_from`/`date_to`.
 */
export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const { searchParams } = new URL(request.url);

    const search =
      readOptionalText(searchParams.get("search")) ??
      readOptionalText(searchParams.get("keyword"));

    const fromDate =
      readOptionalText(searchParams.get("from_date")) ??
      readOptionalText(searchParams.get("date_from"));
    const toDate =
      readOptionalText(searchParams.get("to_date")) ??
      readOptionalText(searchParams.get("date_to"));

    const requestedUserId = readOptionalNumber(searchParams.get("user_id"));

    const result = await listAuditLogs({
      page: readOptionalNumber(searchParams.get("page")),
      perPage: readOptionalNumber(searchParams.get("per_page")),
      auditId: readOptionalNumber(searchParams.get("audit_id")),
      userId: resolveAuditUserFilter(user, requestedUserId),
      menuName: readOptionalText(searchParams.get("menu_name")),
      tableName: readOptionalText(searchParams.get("table_name")),
      recordId: readOptionalNumber(searchParams.get("record_id")),
      action: readOptionalNumber(searchParams.get("action")),
      search,
      fromDate,
      toDate,
    });

    return NextResponse.json({
      success: true,
      message: "Audit logs retrieved successfully",
      data: result,
      meta: result.meta,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
