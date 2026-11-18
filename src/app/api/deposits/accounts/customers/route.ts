import { NextResponse } from "next/server";
import { listDepositCustomers } from "@/features/deposits/savings/services/deposit-account.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

function readOptionalNumber(raw: string | null): number | undefined {
  if (raw == null || raw === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const kind = searchParams.get("kind") === "group" ? "group" : "member";
    const keyword = searchParams.get("keyword")?.trim() || undefined;

    const items = await listDepositCustomers({
      kind,
      keyword,
      branchId: readOptionalNumber(searchParams.get("branch_id")),
      page: readOptionalNumber(searchParams.get("page")),
      perPage: readOptionalNumber(searchParams.get("per_page")) ?? 50,
    });

    return NextResponse.json({
      success: true,
      message: "Customers retrieved successfully",
      data: items,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
