import { NextResponse } from "next/server";
import { fetchLoanScheduleList } from "@/features/lms/repayment-schedule/services/repayment-schedule.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

function readOptionalNumber(raw: string | null): number | undefined {
  if (raw == null || raw === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function readOptionalText(raw: string | null): string | undefined {
  if (raw == null) return undefined;
  const trimmed = raw.trim();
  return trimmed === "" ? undefined : trimmed;
}

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const loanAccountId = readOptionalNumber(
      searchParams.get("loan_account_id"),
    );

    if (!loanAccountId) {
      return NextResponse.json(
        {
          success: false,
          message: "loan_account_id is required",
          errors: { loan_account_id: ["Required"] },
        },
        { status: 422 },
      );
    }

    const result = await fetchLoanScheduleList({
      loanAccountId,
      asOn: readOptionalText(searchParams.get("as_on")),
    });

    return NextResponse.json({
      success: true,
      message: "Repayment schedule retrieved successfully",
      data: result,
      meta: {
        total: result.items.length,
        as_on: result.asOn,
      },
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
