import { NextResponse } from "next/server";
import {
  calculateSavingsInterest,
  postSavingsInterest,
} from "@/features/deposits/interest-posting/services/interest-posting.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser, resolveBranchFilter } from "@/lib/auth/bff-scope";

function readNumber(raw: string | null): number | undefined {
  if (raw == null || raw === "") return undefined;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

/** Laravel: GET /api/SavingsInterestCalculate */
export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const params = new URL(request.url).searchParams;
    const result = await calculateSavingsInterest({
      mode: params.get("mode"),
      asOnDate: params.get("as_on_date") ?? "",
      accountId: readNumber(params.get("account_id")),
      schemeId: readNumber(params.get("scheme_id")),
      branchId: resolveBranchFilter(user, readNumber(params.get("branch_id"))),
      keyword: params.get("keyword")?.trim() || undefined,
    });
    return NextResponse.json({ success: true, message: "Interest calculated", data: result });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

/** Laravel: POST /api/SavingsInterestPost */
export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json().catch(() => null)) as unknown;
    const result = await postSavingsInterest(body, resolveBranchFilter(user, undefined));
    return NextResponse.json({ success: true, message: result.message, data: result }, { status: 201 });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
