import { NextResponse } from "next/server";
import { listStates } from "@/features/master/organization/services/organization.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page");
    const perPage = searchParams.get("per_page");
    const stateCd = searchParams.get("state_cd");
    const keyword = searchParams.get("keyword");

    const result = await listStates({
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
      stateCd: stateCd ? Number(stateCd) : undefined,
      keyword: keyword ?? undefined,
    });

    return NextResponse.json({
      success: true,
      message: "States retrieved successfully",
      data: result,
      meta: result.meta,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
