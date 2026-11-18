import { NextResponse } from "next/server";
import {
  createDepositScheme,
  listDepositSchemes,
  toggleDepositSchemeStatus,
  updateDepositScheme,
} from "@/features/master/deposit-schemes/services/deposit-schemes.service";
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
      readOptionalText(searchParams.get("keyword"));

    const isActiveRaw =
      searchParams.get("is_active") ?? searchParams.get("status");

    const result = await listDepositSchemes({
      page: readOptionalNumber(searchParams.get("page")),
      perPage: readOptionalNumber(searchParams.get("per_page")),
      schemeId: readOptionalNumber(searchParams.get("scheme_id")),
      depositTypeCd: readOptionalNumber(searchParams.get("deposit_type_cd")),
      prodTypeCd: readOptionalNumber(searchParams.get("prod_type_cd")),
      isActive: readOptionalNumber(isActiveRaw),
      search,
    });

    return NextResponse.json({
      success: true,
      message: "Deposit schemes retrieved successfully",
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
          {
            success: false,
            message: "schemeId is required",
          },
          { status: 422 },
        );
      }

      const item = await toggleDepositSchemeStatus(schemeId, isActive);
      return NextResponse.json({
        success: true,
        message: isActive
          ? "Deposit scheme activated successfully"
          : "Deposit scheme deactivated successfully",
        data: item,
      });
    }

    const isUpdate =
      body.action === "update" ||
      (typeof body.schemeId === "number" && body.schemeId > 0) ||
      (typeof body.scheme_id === "number" && (body.scheme_id as number) > 0);

    if (isUpdate) {
      const payload = { ...body };
      delete payload.action;
      const item = await updateDepositScheme(payload);
      return NextResponse.json({
        success: true,
        message: "Deposit scheme updated successfully",
        data: item,
      });
    }

    const payload = { ...body };
    delete payload.action;
    const item = await createDepositScheme(payload);
    return NextResponse.json(
      {
        success: true,
        message: "Deposit scheme created successfully",
        data: item,
      },
      { status: 201 },
    );
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
