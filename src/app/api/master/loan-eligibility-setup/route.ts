import { NextResponse } from "next/server";
import {
  listLoanEligibilityParameters,
  toggleLoanEligibilityStatus,
  updateLoanEligibilityParameter,
} from "@/features/master/loan-eligibility-setup/services/loan-eligibility.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { assertHeadOffice, requireSessionUser } from "@/lib/auth/bff-scope";

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

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const search =
      readOptionalText(searchParams.get("search")) ??
      readOptionalText(searchParams.get("keyword")) ??
      readOptionalText(searchParams.get("parameter_name"));
    const isActiveRaw =
      searchParams.get("is_active") ?? searchParams.get("status");

    const result = await listLoanEligibilityParameters({
      page: readOptionalNumber(searchParams.get("page")),
      perPage: readOptionalNumber(searchParams.get("per_page")),
      paramId:
        readOptionalNumber(searchParams.get("param_id")) ??
        readOptionalNumber(searchParams.get("id")),
      search,
      dataType: readOptionalText(searchParams.get("data_type")),
      isMandatory: readOptionalNumber(searchParams.get("is_mandatory")),
      isActive: readOptionalNumber(isActiveRaw),
    });

    return NextResponse.json({
      success: true,
      message: "Loan eligibility parameters retrieved successfully",
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

    if (body.action === "status") {
      const paramId =
        typeof body.paramId === "number"
          ? body.paramId
          : typeof body.param_id === "number"
            ? body.param_id
            : undefined;
      const isActive =
        typeof body.isActive === "boolean"
          ? body.isActive
          : typeof body.is_active === "boolean"
            ? body.is_active
            : false;

      if (!paramId) {
        return NextResponse.json(
          { success: false, message: "paramId is required" },
          { status: 422 },
        );
      }

      const item = await toggleLoanEligibilityStatus(paramId, isActive);
      return NextResponse.json({
        success: true,
        message: isActive
          ? "Loan eligibility parameter activated successfully"
          : "Loan eligibility parameter deactivated successfully",
        data: item,
      });
    }

    const payload = { ...body };
    delete payload.action;
    const item = await updateLoanEligibilityParameter(payload);
    return NextResponse.json({
      success: true,
      message: "Loan eligibility parameter updated successfully",
      data: item,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
