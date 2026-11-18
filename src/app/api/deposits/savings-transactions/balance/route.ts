import { NextResponse } from "next/server";
import { getSavingsAccountBalance } from "@/features/deposits/savings-transaction/services/savings-transaction.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

/** Laravel: GET /api/SavingsAccountBalance */
export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const accountId = Number(new URL(request.url).searchParams.get("account_id"));
    if (!Number.isInteger(accountId) || accountId <= 0) {
      return NextResponse.json(
        { success: false, message: "A valid account is required" },
        { status: 422 },
      );
    }
    const data = await getSavingsAccountBalance(accountId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
