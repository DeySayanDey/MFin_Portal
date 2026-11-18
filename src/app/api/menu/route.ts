import { NextResponse } from "next/server";
import { getLocale } from "next-intl/server";
import { fetchMenuTree } from "@/features/navigation/services/menu-service";
import {
  normalizeMenuLang,
  toMenuLang,
} from "@/features/navigation/utils/menu-lang";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

/**
 * Resolve MenuTree `role_id` for Laravel.
 * Prefer the requested query value only when it is one of the user's roles;
 * otherwise use the primary role from the login session.
 */
function resolveMenuRoleId(
  user: Awaited<ReturnType<typeof requireSessionUser>>,
  requestedRaw: string | null,
): number | undefined {
  const roleIds = [
    user.roleId,
    ...(Array.isArray(user.roles) ? user.roles.map((role) => role.roleId) : []),
  ].filter((id): id is number => typeof id === "number");

  const assigned = new Set(roleIds);

  if (requestedRaw != null && requestedRaw !== "") {
    const requested = Number(requestedRaw);
    if (Number.isFinite(requested) && assigned.has(requested)) {
      return requested;
    }
  }

  return user.roleId ?? roleIds[0];
}

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const roleId = resolveMenuRoleId(user, searchParams.get("role_id"));

    const langParam = searchParams.get("lang");
    const lang =
      langParam != null && langParam.trim() !== ""
        ? normalizeMenuLang(langParam)
        : toMenuLang(await getLocale());

    // Laravel: GET /api/MenuTree?status=1&role_id=…&lang=HI
    const menu = await fetchMenuTree({
      status: statusParam ? Number(statusParam) : 1,
      roleId,
      lang,
    });

    return NextResponse.json({
      success: true,
      message: "Menu tree retrieved successfully",
      data: menu,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
