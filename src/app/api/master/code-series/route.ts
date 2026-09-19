import { NextResponse } from "next/server";
import {
  listCodeSeries,
  updateCodeSeries,
} from "@/features/master/code-series/services/code-series.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { assertHeadOffice, requireSessionUser } from "@/lib/auth/bff-scope";

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page");
    const perPage = searchParams.get("per_page");
    const seriesId = searchParams.get("series_id");
    const moduleKey = searchParams.get("module_key");
    const keyword = searchParams.get("keyword");
    const status = searchParams.get("status");

    const result = await listCodeSeries({
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
      seriesId: seriesId ? Number(seriesId) : undefined,
      moduleKey: moduleKey ?? undefined,
      keyword: keyword ?? undefined,
      status: status != null && status !== "" ? Number(status) : undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Code series retrieved successfully",
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
    const series = await updateCodeSeries(body);
    return NextResponse.json({
      success: true,
      message: "Code series updated successfully",
      data: series,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
