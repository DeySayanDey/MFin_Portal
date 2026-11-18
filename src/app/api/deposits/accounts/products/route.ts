import { NextResponse } from "next/server";
import { listDepositProducts } from "@/features/deposits/savings/services/deposit-account.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

function readOptionalNumber(raw: string | null): number | undefined {
  if (raw == null || raw === "") return undefined;
  const value = Number(raw);
  return Number.isInteger(value) ? value : undefined;
}

function readIsActive(raw: string | null): 1 | 0 | -1 | undefined {
  if (raw === "1") return 1;
  if (raw === "0") return 0;
  if (raw === "-1") return -1;
  return undefined;
}

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const data = await listDepositProducts({
      depositTypeCd: readOptionalNumber(searchParams.get("deposit_type_cd")),
      prodTypeCd: readOptionalNumber(searchParams.get("prod_type_cd")),
      isActive: readIsActive(searchParams.get("is_active")),
    });
    return NextResponse.json({
      success: true,
      message: "Deposit products retrieved successfully",
      data,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
