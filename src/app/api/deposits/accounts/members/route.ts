import { NextResponse } from "next/server";
import {
  assertDepositAccountInScope,
  listDepositAccountMembers,
  syncDepositAccountMembers,
} from "@/features/deposits/savings/services/deposit-account.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

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
    await assertDepositAccountInScope(
      accountId,
      user.isHead ? undefined : user.branchId ?? undefined,
    );
    const data = await listDepositAccountMembers(accountId);
    return NextResponse.json({
      success: true,
      message: "Account members retrieved successfully",
      data,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json()) as Record<string, unknown>;
    const accountId = body.accountId;
    if (typeof accountId !== "number" || !Number.isInteger(accountId) || accountId <= 0) {
      return NextResponse.json(
        { success: false, message: "Validation failed" },
        { status: 422 },
      );
    }
    await assertDepositAccountInScope(
      accountId,
      user.isHead ? undefined : user.branchId ?? undefined,
    );
    const result = await syncDepositAccountMembers(accountId);
    return NextResponse.json({
      success: true,
      message: result.message || "Account synced",
      data: result,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
