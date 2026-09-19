import { NextResponse } from "next/server";
import {
  createStaff,
  listStaff,
  updateStaff,
} from "@/features/master/staff/services/staff.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import {
  applyStaffBranchScope,
  requireSessionUser,
  resolveBranchFilter,
} from "@/lib/auth/bff-scope";

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page");
    const perPage = searchParams.get("per_page");
    const staffId = searchParams.get("staff_id");
    const branchIdParam = searchParams.get("branch_id");
    const designationId = searchParams.get("designation_id");
    const keyword = searchParams.get("keyword");
    const status = searchParams.get("status");
    const includeModules = searchParams.get("include_modules");

    const requestedBranchId =
      branchIdParam != null && branchIdParam !== ""
        ? Number(branchIdParam)
        : undefined;

    const result = await listStaff({
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
      staffId: staffId ? Number(staffId) : undefined,
      branchId: resolveBranchFilter(user, requestedBranchId),
      designationId: designationId ? Number(designationId) : undefined,
      keyword: keyword ?? undefined,
      status: status != null && status !== "" ? Number(status) : undefined,
      includeModules:
        includeModules === "1" || includeModules === "true" ? true : undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Staff retrieved successfully",
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
    const body = (await request.json()) as Record<string, unknown>;
    const action = body.action === "update" ? "update" : "create";
    const scoped = applyStaffBranchScope(user, body);

    if (action === "update") {
      const { action: _a, ...rest } = scoped;
      const result = await updateStaff(rest);
      return NextResponse.json({
        success: true,
        message: "Staff updated successfully",
        data: result,
      });
    }

    const { action: _a, ...rest } = scoped;
    const result = await createStaff(rest);
    return NextResponse.json(
      {
        success: true,
        message: "Staff created successfully",
        data: result,
      },
      { status: 201 },
    );
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
