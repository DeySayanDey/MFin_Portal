import { NextResponse } from "next/server";
import {
  assignRoleMenu,
  getRoleMenu,
} from "@/features/master/role-menu/services/role-menu.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { assertHeadOffice, requireSessionUser } from "@/lib/auth/bff-scope";

function readOptionalNumber(raw: string | null): number | undefined {
  if (raw == null || raw === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function readOptionalBool(raw: string | null): boolean | undefined {
  if (raw == null || raw === "") return undefined;
  if (raw === "1" || raw.toLowerCase() === "true") return true;
  if (raw === "0" || raw.toLowerCase() === "false") return false;
  return undefined;
}

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const roleId = readOptionalNumber(searchParams.get("role_id"));
    if (roleId == null) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: { role_id: ["Role is required"] },
        },
        { status: 422 },
      );
    }

    const matrix = await getRoleMenu({
      roleId,
      status: readOptionalNumber(searchParams.get("status")),
      assignedOnly: readOptionalBool(searchParams.get("assigned_only")),
    });

    return NextResponse.json({
      success: true,
      message: "Role menu permissions retrieved successfully",
      data: matrix,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    assertHeadOffice(user);
    const body = (await request.json()) as unknown;
    const matrix = await assignRoleMenu(body);
    return NextResponse.json({
      success: true,
      message: "Role menu permissions assigned successfully",
      data: matrix,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
