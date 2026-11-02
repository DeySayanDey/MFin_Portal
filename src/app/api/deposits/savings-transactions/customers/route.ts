import { NextResponse } from "next/server";
import { listSavingsCustomers } from "@/features/deposits/savings-transaction/services/savings-transaction.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser, resolveBranchFilter } from "@/lib/auth/bff-scope";

function readOptionalNumber(raw: string | null): number | undefined {
  if (raw == null || raw === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

/** Laravel: GET /api/SavingsCustomerList */
export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword")?.trim() || undefined;
    const result = await listSavingsCustomers({
      page: readOptionalNumber(searchParams.get("page")),
      perPage: readOptionalNumber(searchParams.get("per_page")),
      keyword,
      custTypeCd: readOptionalNumber(searchParams.get("cust_type_cd")),
      depositTypeCd: readOptionalNumber(searchParams.get("deposit_type_cd")),
      branchId: resolveBranchFilter(
        user,
        readOptionalNumber(searchParams.get("branch_id")),
      ),
    });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
