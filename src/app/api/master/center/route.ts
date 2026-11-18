import { NextResponse } from "next/server";
import {
  createCenter,
  listCenters,
  updateCenter,
} from "@/features/master/center/services/center.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import {
  applyStaffBranchScope,
  requireSessionUser,
  resolveBranchFilter,
} from "@/lib/auth/bff-scope";
import { ApiError } from "@/lib/api/errors";
import type { AuthUser } from "@/features/auth/types/auth";

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

/** Non–head-office users may only mutate centers for their own branch. */
function assertCenterMutationScope(user: AuthUser, branchId: number | undefined) {
  if (user.isHead || user.isAdmin) return;
  if (branchId == null || branchId !== user.branchId) {
    throw new ApiError({
      message: "Forbidden",
      status: 403,
      code: "FORBIDDEN",
    });
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const { searchParams } = new URL(request.url);

    const search =
      readOptionalText(searchParams.get("search")) ??
      readOptionalText(searchParams.get("keyword"));

    const isActiveRaw =
      searchParams.get("is_active") ?? searchParams.get("status");

    const result = await listCenters({
      page: readOptionalNumber(searchParams.get("page")),
      perPage: readOptionalNumber(searchParams.get("per_page")),
      centerId: readOptionalNumber(searchParams.get("center_id")),
      branchId: resolveBranchFilter(
        user,
        readOptionalNumber(searchParams.get("branch_id")),
      ),
      search,
      isActive: readOptionalNumber(isActiveRaw),
    });

    return NextResponse.json({
      success: true,
      message: "Centers retrieved successfully",
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

    const branchId =
      typeof scoped.branchId === "number"
        ? scoped.branchId
        : typeof scoped.branch_id === "number"
          ? scoped.branch_id
          : undefined;

    assertCenterMutationScope(user, branchId);

    if (action === "update") {
      const { action: _a, ...rest } = scoped;
      const center = await updateCenter(rest);
      return NextResponse.json({
        success: true,
        message: "Center updated successfully",
        data: center,
      });
    }

    const { action: _a, ...rest } = scoped;
    const center = await createCenter(rest);
    return NextResponse.json(
      {
        success: true,
        message: "Center created successfully",
        data: center,
      },
      { status: 201 },
    );
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
