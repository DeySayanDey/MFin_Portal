import { NextResponse } from "next/server";
import {
  createDepositSchemeSlab,
  listDepositSchemeSlabs,
  toggleDepositSchemeSlabStatus,
} from "@/features/master/deposit-interest/services/deposit-interest.service";
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

    const result = await listDepositSchemeSlabs({
      page: readOptionalNumber(searchParams.get("page")),
      perPage: readOptionalNumber(searchParams.get("per_page")),
      id: readOptionalNumber(searchParams.get("id")),
      schemeId:
        readOptionalNumber(searchParams.get("scheme_id")) ??
        readOptionalNumber(searchParams.get("schemeId")),
      termCd:
        readOptionalNumber(searchParams.get("term_cd")) ??
        readOptionalNumber(searchParams.get("termCd")),
      duration: readOptionalNumber(searchParams.get("duration")),
      effectiveOn:
        readOptionalText(searchParams.get("effective_on")) ??
        readOptionalText(searchParams.get("effectiveOn")),
      isActive: readOptionalNumber(isActiveRaw),
      search,
    });

    return NextResponse.json({
      success: true,
      message: "Deposit scheme slabs retrieved successfully",
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
      const id =
        typeof body.id === "number"
          ? body.id
          : typeof body.slabId === "number"
            ? body.slabId
            : undefined;
      const isActive =
        typeof body.isActive === "boolean"
          ? body.isActive
          : typeof body.is_active === "boolean"
            ? body.is_active
            : false;

      if (!id) {
        return NextResponse.json(
          {
            success: false,
            message: "id is required",
          },
          { status: 422 },
        );
      }

      const item = await toggleDepositSchemeSlabStatus(id, isActive);
      return NextResponse.json({
        success: true,
        message: isActive
          ? "Deposit scheme slab activated successfully"
          : "Deposit scheme slab deactivated successfully",
        data: item,
      });
    }

    const payload = { ...body };
    delete payload.action;
    const item = await createDepositSchemeSlab(payload);
    return NextResponse.json(
      {
        success: true,
        message: "Deposit scheme slab created successfully",
        data: item,
      },
      { status: 201 },
    );
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
