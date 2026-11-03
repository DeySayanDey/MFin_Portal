import { NextResponse } from "next/server";
import { calculateSettlement } from "@/features/deposits/fd-settlement/services/fd-settlement.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser, resolveBranchFilter } from "@/lib/auth/bff-scope";

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const quote = await calculateSettlement(
      {
        accountId: Number(searchParams.get("account_id")),
        settlementType: searchParams.get("settlement_type"),
        settlementDate: searchParams.get("settlement_date"),
      },
      { branchId: resolveBranchFilter(user, undefined) },
    );
    return NextResponse.json({ success: true, message: "Settlement calculated", data: quote });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
