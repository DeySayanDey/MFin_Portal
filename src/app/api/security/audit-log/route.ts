import { NextResponse } from "next/server";
import { listAuditLogs } from "@/features/security/audit-log/services/audit-log.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import {
  requireSessionUser,
  resolveAuditUserFilter,
} from "@/lib/auth/bff-scope";

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page");
    const perPage = searchParams.get("per_page");
    const auditId = searchParams.get("audit_id");
    const userIdParam = searchParams.get("user_id");
    const search = searchParams.get("search");
    const action = searchParams.get("action");
    const menuName = searchParams.get("menu_name");
    const tableName = searchParams.get("table_name");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    const requestedUserId =
      userIdParam != null && userIdParam !== ""
        ? Number(userIdParam)
        : undefined;

    const result = await listAuditLogs({
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
      auditId: auditId ? Number(auditId) : undefined,
      userId: resolveAuditUserFilter(user, requestedUserId),
      search: search ?? undefined,
      action: action != null && action !== "" ? Number(action) : undefined,
      menuName: menuName ?? undefined,
      tableName: tableName ?? undefined,
      dateFrom: dateFrom ?? undefined,
      dateTo: dateTo ?? undefined,
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
