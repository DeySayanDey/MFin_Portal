import { NextResponse } from "next/server";
import { fetchDisbursementPreview } from "@/features/lms/disbursement/services/disbursement.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

function readOptionalNumber(raw: string | null): number | undefined {
  if (raw == null || raw === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const { searchParams } = new URL(request.url);

    const loanAccountId = readOptionalNumber(searchParams.get("loan_account_id"));
    if (!loanAccountId) {
      return NextResponse.json(
        { success: false, message: "loan_account_id is required" },
        { status: 422 },
      );
    }

    const result = await fetchDisbursementPreview({
      loan_account_id: loanAccountId,
      gross_amount: readOptionalNumber(searchParams.get("gross_amount")),
      other_deduction: readOptionalNumber(searchParams.get("other_deduction")),
    });

    return NextResponse.json({
      success: true,
      message: "Preview generated",
      data: result,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
