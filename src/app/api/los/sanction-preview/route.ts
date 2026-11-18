import { NextResponse } from "next/server";
import { previewLoanSanction } from "@/features/los/services/los.service";
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
    const applicationId = readOptionalNumber(searchParams.get("application_id"));
    if (!applicationId) {
      return NextResponse.json(
        { success: false, message: "application_id is required", data: null },
        { status: 422 },
      );
    }

    const preview = await previewLoanSanction({
      application_id: applicationId,
      sanctioned_amount: readOptionalNumber(searchParams.get("sanctioned_amount")),
      interest_rate: readOptionalNumber(searchParams.get("interest_rate")),
      loan_duration: readOptionalNumber(searchParams.get("loan_duration")),
      repay_schedule_cd: readOptionalNumber(searchParams.get("repay_schedule_cd")),
      moratorium_days: readOptionalNumber(searchParams.get("moratorium_days")),
      first_due_date: readOptionalText(searchParams.get("first_due_date")),
    });

    return NextResponse.json({
      success: true,
      message: "Sanction preview generated",
      data: preview,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
