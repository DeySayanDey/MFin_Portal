import { NextResponse } from "next/server";
import { syncTermDepositSchedule } from "@/features/deposits/savings/services/deposit-account.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

export async function POST(request: Request) {
  try {
    await requireSessionUser();
    const body = (await request.json()) as { accountId?: unknown };
    const accountId = Number(body.accountId);
    if (!Number.isInteger(accountId) || accountId <= 0) {
      return NextResponse.json(
        { success: false, message: "Validation failed" },
        { status: 422 },
      );
    }
    const message = await syncTermDepositSchedule(accountId);
    return NextResponse.json({ success: true, message, data: null });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
