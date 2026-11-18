import { NextResponse } from "next/server";
import {
  createLoanApproval,
  listLoanApprovals,
} from "@/features/los/services/los.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser, resolveBranchFilter } from "@/lib/auth/bff-scope";

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
    const user = await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const search =
      readOptionalText(searchParams.get("search")) ??
      readOptionalText(searchParams.get("keyword"));

    const pendingOnlyRaw = searchParams.get("pending_only");
    const pendingOnly =
      pendingOnlyRaw === "1" || pendingOnlyRaw === "true" ? true : undefined;

    const result = await listLoanApprovals({
      pending_only: pendingOnly,
      approval_status_cd: readOptionalNumber(
        searchParams.get("approval_status_cd"),
      ),
      application_id: readOptionalNumber(
        searchParams.get("application_id") ??
          searchParams.get("loan_application_id"),
      ),
      loan_approval_id: readOptionalNumber(searchParams.get("loan_approval_id")),
      branch_id: resolveBranchFilter(
        user,
        readOptionalNumber(searchParams.get("branch_id")),
      ),
      from_date: readOptionalText(searchParams.get("from_date")),
      to_date: readOptionalText(searchParams.get("to_date")),
      keyword: search,
      page: readOptionalNumber(searchParams.get("page")),
      per_page: readOptionalNumber(searchParams.get("per_page")),
    });

    return NextResponse.json({
      success: true,
      message: "Loan approvals retrieved successfully",
      data: result,
      meta: { total: result.total },
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireSessionUser();
    const body = (await request.json()) as Record<string, unknown>;
    const result = await createLoanApproval(body as any);
    return NextResponse.json(
      {
        success: true,
        message:
          result.approval_status_cd === 1
            ? `Loan sanctioned for ${result.sanctioned_amount ?? ""}`
            : "Loan decision recorded",
        data: result,
      },
      { status: 201 },
    );
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
