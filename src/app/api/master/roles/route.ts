import { NextResponse } from "next/server";
import {
  createRole,
  listRoles,
  updateRole,
} from "@/features/master/roles/services/role.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { assertHeadOffice, requireSessionUser } from "@/lib/auth/bff-scope";

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page");
    const perPage = searchParams.get("per_page");
    const roleId = searchParams.get("role_id");
    const keyword = searchParams.get("keyword");
    const isAdmin = searchParams.get("is_admin");
    const status = searchParams.get("status");

    const result = await listRoles({
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
      roleId: roleId ? Number(roleId) : undefined,
      keyword: keyword ?? undefined,
      isAdmin:
        isAdmin != null && isAdmin !== "" ? Number(isAdmin) : undefined,
      status: status != null && status !== "" ? Number(status) : undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Roles retrieved successfully",
      data: result,
      meta: result.meta,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    assertHeadOffice(user);
    const body = (await request.json()) as Record<string, unknown>;
    const action = body.action === "update" ? "update" : "create";

    if (action === "update") {
      const { action: _a, ...rest } = body;
      const result = await updateRole(rest);
      return NextResponse.json({
        success: true,
        message: "Role updated successfully",
        data: result,
      });
    }

    const { action: _a, ...rest } = body;
    const result = await createRole(rest);
    return NextResponse.json(
      {
        success: true,
        message: "Role created successfully",
        data: result,
      },
      { status: 201 },
    );
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
