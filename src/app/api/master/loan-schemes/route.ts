import { NextResponse } from "next/server";
import {
  createLoanScheme,
  listLoanSchemes,
  toggleLoanSchemeStatus,
  updateLoanScheme,
} from "@/features/master/loan-schemes/services/loan-schemes.service";
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
      readOptionalText(searchParams.get("scheme_name"));
    const isActiveRaw =
      searchParams.get("is_active") ?? searchParams.get("status");

    const result = await listLoanSchemes({
      page: readOptionalNumber(searchParams.get("page")),
      perPage: readOptionalNumber(searchParams.get("per_page")),
      schemeId: readOptionalNumber(searchParams.get("scheme_id")),
      productTypeCd: readOptionalNumber(searchParams.get("product_type_cd")),
      repayTypeCd: readOptionalNumber(searchParams.get("repay_type_cd")),
      isActive: readOptionalNumber(isActiveRaw),
      search,
    });

    return NextResponse.json({
      success: true,
      message: "Loan schemes retrieved successfully",
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
      const schemeId =
        typeof body.schemeId === "number"
          ? body.schemeId
          : typeof body.scheme_id === "number"
            ? body.scheme_id
            : undefined;
      const isActive =
        typeof body.isActive === "boolean"
          ? body.isActive
          : typeof body.is_active === "boolean"
            ? body.is_active
            : false;

      if (!schemeId) {
        return NextResponse.json(
          { success: false, message: "schemeId is required" },
          { status: 422 },
        );
      }

      const item = await toggleLoanSchemeStatus(schemeId, isActive);
      return NextResponse.json({
        success: true,
        message: isActive
          ? "Loan scheme activated successfully"
          : "Loan scheme deactivated successfully",
        data: item,
      });
    }

    const isUpdate =
      body.action === "update" ||
      (typeof body.schemeId === "number" && body.schemeId > 0) ||
      (typeof body.scheme_id === "number" && body.scheme_id > 0);

    const payload = { ...body };
    delete payload.action;

    if (isUpdate) {
      const item = await updateLoanScheme(payload);
      return NextResponse.json({
        success: true,
        message: "Loan scheme updated successfully",
        data: item,
      });
    }

    const item = await createLoanScheme(payload);
    return NextResponse.json(
      {
        success: true,
        message: "Loan scheme created successfully",
        data: item,
      },
      { status: 201 },
    );
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
