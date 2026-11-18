import { NextResponse } from "next/server";
import {
  listHolidays,
  saveHoliday,
} from "@/features/master/holiday/services/holiday.service";
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

    const result = await listHolidays({
      page: readOptionalNumber(searchParams.get("page")),
      perPage: readOptionalNumber(searchParams.get("per_page")),
      id: readOptionalNumber(searchParams.get("id")),
      yearSl: readOptionalNumber(searchParams.get("year_sl")),
      holiType: readOptionalNumber(searchParams.get("holi_type")),
      search,
      fromDate: readOptionalText(searchParams.get("from_date")),
      toDate: readOptionalText(searchParams.get("to_date")),
    });

    return NextResponse.json({
      success: true,
      message: "Holidays retrieved successfully",
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
    const holiday = await saveHoliday(body);
    const isUpdate =
      typeof body === "object" &&
      body !== null &&
      "id" in body &&
      typeof (body as { id?: unknown }).id === "number";

    return NextResponse.json({
      success: true,
      message: isUpdate
        ? "Holiday updated successfully"
        : "Holiday created successfully",
      data: holiday,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
