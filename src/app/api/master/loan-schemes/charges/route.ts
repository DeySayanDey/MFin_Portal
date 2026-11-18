import { NextResponse } from "next/server";
import {
  createLoanSchemeCharge,
  listLoanSchemeCharges,
  toggleLoanSchemeChargeStatus,
  updateLoanSchemeCharge,
} from "@/features/master/loan-schemes/services/loan-schemes.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { assertHeadOffice, requireSessionUser } from "@/lib/auth/bff-scope";

function readOptionalNumber(raw: string | null): number | undefined {
  if (raw == null || raw === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const isActiveRaw =
      searchParams.get("is_active") ?? searchParams.get("status");

    const result = await listLoanSchemeCharges({
      page: readOptionalNumber(searchParams.get("page")),
      perPage: readOptionalNumber(searchParams.get("per_page")),
      id: readOptionalNumber(searchParams.get("id")),
      schemeId:
        readOptionalNumber(searchParams.get("scheme_id")) ??
        readOptionalNumber(searchParams.get("schemeId")),
      chargeId:
        readOptionalNumber(searchParams.get("charge_id")) ??
        readOptionalNumber(searchParams.get("chargeId")),
      isActive: readOptionalNumber(isActiveRaw),
    });

    return NextResponse.json({
      success: true,
      message: "Loan scheme charges retrieved successfully",
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
      const id = typeof body.id === "number" ? body.id : undefined;
      const isActive =
        typeof body.isActive === "boolean"
          ? body.isActive
          : typeof body.is_active === "boolean"
            ? body.is_active
            : false;

      if (!id) {
        return NextResponse.json(
          { success: false, message: "id is required" },
          { status: 422 },
        );
      }

      const item = await toggleLoanSchemeChargeStatus(id, isActive);
      return NextResponse.json({
        success: true,
        message: isActive
          ? "Loan scheme charge activated successfully"
          : "Loan scheme charge deactivated successfully",
        data: item,
      });
    }

    const isUpdate = body.action === "update";
    const payload = { ...body };
    delete payload.action;

    if (isUpdate) {
      const item = await updateLoanSchemeCharge(payload);
      return NextResponse.json({
        success: true,
        message: "Loan scheme charges updated successfully",
        data: item,
      });
    }

    const item = await createLoanSchemeCharge(payload);
    return NextResponse.json(
      {
        success: true,
        message: "Loan scheme charges assigned successfully",
        data: item,
      },
      { status: 201 },
    );
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
