import { NextResponse } from "next/server";
import { viewDepositAccount } from "@/features/deposits/savings/services/deposit-account.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const accountId = Number(searchParams.get("account_id"));
    if (!Number.isFinite(accountId) || accountId < 1) {
      return NextResponse.json(
        { success: false, message: "Valid account_id is required" },
        { status: 400 },
      );
    }
    const txnLimit = Number(searchParams.get("txn_limit")) || 10;
    const item = await viewDepositAccount(accountId, txnLimit);

    return NextResponse.json({
      success: true,
      message: "Deposit account retrieved successfully",
      data: item,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

