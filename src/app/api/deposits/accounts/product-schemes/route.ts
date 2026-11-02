import { NextResponse } from "next/server";
import { listDepositProductSchemes } from "@/features/deposits/savings/services/deposit-account.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const depositTypeCd = Number(searchParams.get("deposit_type_cd")) || 1;
    const items = await listDepositProductSchemes(depositTypeCd);

    return NextResponse.json({
      success: true,
      message: "Deposit products retrieved successfully",
      data: items,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

