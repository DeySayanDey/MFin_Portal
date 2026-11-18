import { NextResponse } from "next/server";
import { getDashboard } from "@/features/dashboard/services/dashboard.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser, resolveBranchFilter } from "@/lib/auth/bff-scope";

function readNumber(raw: string | null): number | undefined {
  if (raw == null || raw === "") return undefined;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

/** Laravel: GET /api/DashboardGet */
export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const params = new URL(request.url).searchParams;
    const result = await getDashboard({
      fromDate: params.get("from_date") ?? "",
      toDate: params.get("to_date") ?? "",
      branchId: resolveBranchFilter(user, readNumber(params.get("branch_id"))),
    });
    return NextResponse.json({ success: true, message: "Dashboard loaded", data: result });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
