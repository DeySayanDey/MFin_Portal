import { NextResponse } from "next/server";
import {
  createBranch,
  listBranches,
  updateBranch,
} from "@/features/master/branch/services/branch.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import {
  assertBranchMutationScope,
  requireSessionUser,
  resolveBranchFilter,
} from "@/lib/auth/bff-scope";

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page");
    const perPage = searchParams.get("per_page");
    const branchIdParam = searchParams.get("branch_id");
    const keyword = searchParams.get("keyword");
    const isHead = searchParams.get("is_head");
    const isActive = searchParams.get("is_active");

    const requestedBranchId =
      branchIdParam != null && branchIdParam !== ""
        ? Number(branchIdParam)
        : undefined;

    const result = await listBranches({
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
      branchId: resolveBranchFilter(user, requestedBranchId),
      keyword: keyword ?? undefined,
      isHead: isHead != null && isHead !== "" ? Number(isHead) : undefined,
      isActive:
        isActive != null && isActive !== "" ? Number(isActive) : undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Branches retrieved successfully",
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

    if (action === "update") {
      const branchId =
        typeof body.branchId === "number"
          ? body.branchId
          : typeof body.branch_id === "number"
            ? body.branch_id
            : undefined;
      assertBranchMutationScope(user, branchId, "update");
      const { action: _a, ...rest } = body;
      const result = await updateBranch(rest);
      return NextResponse.json({
        success: true,
        message: "Branch updated successfully",
        data: result,
      });
    }

    assertBranchMutationScope(user, undefined, "create");
    const { action: _a, ...rest } = body;
    const result = await createBranch(rest);
    return NextResponse.json(
      {
        success: true,
        message: "Branch created successfully",
        data: result,
      },
      { status: 201 },
    );
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
