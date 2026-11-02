import { NextResponse } from "next/server";
<<<<<<< Updated upstream
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
=======
import { getDepositAccountView } from "@/features/deposits/savings/services/deposit-account.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { ApiError } from "@/lib/api/errors";
import { requireSessionUser } from "@/lib/auth/bff-scope";

const MAX_TXN_LIMIT = 200;

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const accountId = Number(searchParams.get("account_id"));
    if (!Number.isInteger(accountId) || accountId <= 0) {
      return NextResponse.json(
        { success: false, message: "Validation failed" },
        { status: 422 },
      );
    }
    const limitRaw = Number(searchParams.get("txn_limit"));
    const txnLimit =
      Number.isInteger(limitRaw) && limitRaw > 0
        ? Math.min(limitRaw, MAX_TXN_LIMIT)
        : undefined;

    const data = await getDepositAccountView(accountId, txnLimit);
    if (!user.isHead && data.branchId !== user.branchId) {
      throw new ApiError({
        message: "Deposit account not found",
        status: 404,
        code: "NOT_FOUND",
      });
    }
    return NextResponse.json({
      success: true,
      message: "Deposit account retrieved successfully",
      data,
>>>>>>> Stashed changes
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
