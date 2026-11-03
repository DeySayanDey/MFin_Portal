import { NextResponse } from "next/server";
import { getSettlementAccount } from "@/features/deposits/fd-settlement/services/fd-settlement.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser, resolveBranchFilter } from "@/lib/auth/bff-scope";

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const accountId = Number(new URL(request.url).searchParams.get("account_id"));
    const result = await getSettlementAccount(accountId, {
      branchId: resolveBranchFilter(user, undefined),
    });
    return NextResponse.json({ success: true, message: "Account retrieved", data: result });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
