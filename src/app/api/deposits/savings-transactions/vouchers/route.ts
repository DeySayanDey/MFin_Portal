import { NextResponse } from "next/server";
import { postSavingsTransactionVouchers } from "@/features/deposits/savings-transaction/services/savings-transaction.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

/** Laravel: POST /api/SavingsTransactionVoucherPost */
export async function POST(request: Request) {
  try {
    await requireSessionUser();
    const body = (await request.json()) as { accountId?: unknown };
    const accountId = Number(body.accountId);
    if (!Number.isInteger(accountId) || accountId <= 0) {
      return NextResponse.json(
        { success: false, message: "A valid account is required" },
        { status: 422 },
      );
    }
    const message = await postSavingsTransactionVouchers(accountId);
    return NextResponse.json({ success: true, message, data: null });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
