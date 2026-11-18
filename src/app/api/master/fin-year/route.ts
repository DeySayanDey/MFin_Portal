import { NextResponse } from "next/server";
import {
  listFinYears,
  saveFinYear,
} from "@/features/master/fin-year/services/fin-year.service";
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

    const result = await listFinYears({
      page: readOptionalNumber(searchParams.get("page")),
      perPage: readOptionalNumber(searchParams.get("per_page")),
      yearId: readOptionalNumber(searchParams.get("year_id")),
      isActive: readOptionalNumber(searchParams.get("is_active")),
      search,
    });

    return NextResponse.json({
      success: true,
      message: "Financial years retrieved successfully",
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
    const body: unknown = await request.json();
    const year = await saveFinYear(body);
    const isUpdate =
      typeof body === "object" &&
      body !== null &&
      "yearId" in body &&
      typeof (body as { yearId?: unknown }).yearId === "number";

    return NextResponse.json({
      success: true,
      message: isUpdate
        ? "Financial year updated successfully"
        : "Financial year created successfully",
      data: year,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
