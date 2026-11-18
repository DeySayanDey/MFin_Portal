import { NextResponse } from "next/server";
import { listApplOptions } from "@/features/master/appl-options/services/appl-options.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const { searchParams } = new URL(request.url);

    const optGrpIdRaw = searchParams.get("opt_grp_id");
    if (!optGrpIdRaw) {
      return NextResponse.json(
        {
          success: false,
          message: "opt_grp_id is required",
        },
        { status: 422 },
      );
    }

    const optGrpId = Number(optGrpIdRaw);
    if (!Number.isInteger(optGrpId) || optGrpId < 1) {
      return NextResponse.json(
        {
          success: false,
          message: "opt_grp_id must be a positive integer",
        },
        { status: 422 },
      );
    }

    const includeInactiveRaw = searchParams.get("include_inactive");
    if (includeInactiveRaw != null && !["true", "false", "1", "0"].includes(includeInactiveRaw)) {
      return NextResponse.json(
        { success: false, message: "include_inactive must be a boolean" },
        { status: 422 },
      );
    }
    const includeInactive = includeInactiveRaw === "true" || includeInactiveRaw === "1";

    const options = await listApplOptions({
      optGrpId,
      includeInactive,
    });

    return NextResponse.json({
      success: true,
      message: "Application options retrieved successfully",
      data: options,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
