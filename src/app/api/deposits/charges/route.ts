import { NextResponse } from "next/server";
import {
  calculateSavingsCharges,
  postSavingsCharges,
} from "@/features/deposits/charge-posting/services/charge-posting.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser, resolveBranchFilter } from "@/lib/auth/bff-scope";

function readNumber(raw: string | null): number | undefined {
  if (raw == null || raw === "") return undefined;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

/** Laravel: GET /api/SavingsChargeCalculate */
export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const params = new URL(request.url).searchParams;
    const result = await calculateSavingsCharges({
      mode: params.get("mode"),
      chargeDate: params.get("charge_date") ?? "",
      accountId: readNumber(params.get("account_id")),
      chargeId: readNumber(params.get("charge_id")),
      schemeId: readNumber(params.get("scheme_id")),
      branchId: resolveBranchFilter(user, readNumber(params.get("branch_id"))),
      keyword: params.get("keyword")?.trim() || undefined,
    });
    return NextResponse.json({ success: true, message: "Charges calculated", data: result });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

/** Laravel: POST /api/SavingsChargePost */
export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json().catch(() => null)) as unknown;
    const result = await postSavingsCharges(body, resolveBranchFilter(user, undefined));
    return NextResponse.json({ success: true, message: result.message, data: result }, { status: 201 });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
