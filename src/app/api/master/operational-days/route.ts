import { NextResponse } from "next/server";
import {
  createOperationalDay,
  listOperationalDays,
  updateOperationalDay,
  saveOperationalDaysBulk,
} from "@/features/master/operational-days/services/operational-days.service";
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

function assertMutationScope(user: AuthUser, branchId: number | undefined) {
  if (user.isHead) return;
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
    const isActiveRaw =
      searchParams.get("is_active") ?? searchParams.get("status");

    const result = await listOperationalDays({
      page: readOptionalNumber(searchParams.get("page")),
      perPage: readOptionalNumber(searchParams.get("per_page")),
      recId: readOptionalNumber(searchParams.get("rec_id")),
      branchId: resolveBranchFilter(
        user,
        readOptionalNumber(searchParams.get("branch_id")),
      ),
      dayOfWeek: readOptionalNumber(searchParams.get("day_of_week")),
      isOperational: readOptionalNumber(searchParams.get("is_operational")),
      isActive: readOptionalNumber(isActiveRaw),
    });

    return NextResponse.json({
      success: true,
      message: "Operational days retrieved successfully",
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
    const action = body.action === "bulk" ? "bulk" : body.action === "update" ? "update" : "create";
    const scoped = applyStaffBranchScope(user, body);

    const branchId =
      typeof scoped.branchId === "number"
        ? scoped.branchId
        : typeof scoped.branch_id === "number"
          ? scoped.branch_id
          : undefined;

    assertMutationScope(user, branchId);

    if (action === "bulk") {
      const { action: _a, ...rest } = scoped;
      const result = await saveOperationalDaysBulk(rest);
      return NextResponse.json({ success: true, message: "Operational days saved successfully", data: result });
    }

    if (action === "update") {
      const { action: _a, ...rest } = scoped;
      const day = await updateOperationalDay(rest);
      return NextResponse.json({
        success: true,
        message: "Operational day updated successfully",
        data: day,
      });
    }

    const { action: _a, ...rest } = scoped;
    const day = await createOperationalDay(rest);
    return NextResponse.json(
      {
        success: true,
        message: "Operational day created successfully",
        data: day,
      },
      { status: 201 },
    );
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
