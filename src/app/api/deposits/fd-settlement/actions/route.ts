import { NextResponse } from "next/server";
import { runSettlementAction } from "@/features/deposits/fd-settlement/services/fd-settlement.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser, resolveBranchFilter } from "@/lib/auth/bff-scope";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body: unknown = await request.json();
    const result = await runSettlementAction(body, {
      branchId: resolveBranchFilter(user, undefined),
    });
    return NextResponse.json({ success: true, message: result.message, data: result.item });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
