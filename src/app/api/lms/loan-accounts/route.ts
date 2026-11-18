import { NextResponse } from "next/server";
import {
  changeLoanAccountStatus,
  createLoanAccount,
  listLoanAccounts,
  updateLoanAccount,
} from "@/features/lms/loan-accounts/services/loan-account.service";
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

function readOptionalBool(raw: string | null): boolean | undefined {
  if (raw == null || raw === "") return undefined;
  if (raw === "1" || raw === "true") return true;
  if (raw === "0" || raw === "false") return false;
  return undefined;
}

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const search =
      readOptionalText(searchParams.get("search")) ??
      readOptionalText(searchParams.get("keyword"));

    const result = await listLoanAccounts({
      page: readOptionalNumber(searchParams.get("page")),
      perPage: readOptionalNumber(searchParams.get("per_page")),
      loanAccountId: readOptionalNumber(searchParams.get("loan_account_id")),
      applicationId: readOptionalNumber(searchParams.get("application_id")),
      branchId: resolveBranchFilter(
        user,
        readOptionalNumber(searchParams.get("branch_id")),
      ),
      foId: readOptionalNumber(searchParams.get("fo_id")),
      schemeId: readOptionalNumber(searchParams.get("scheme_id")),
      custTypeCd: readOptionalNumber(searchParams.get("cust_type_cd")),
      memberId: readOptionalNumber(searchParams.get("member_id")),
      groupId: readOptionalNumber(searchParams.get("group_id")),
      statusCd: readOptionalNumber(
        searchParams.get("status_cd") ?? searchParams.get("status"),
      ),
      isDefaulter: readOptionalBool(searchParams.get("is_defaulter")),
      isNpa: readOptionalBool(searchParams.get("is_npa")),
      fromDate: readOptionalText(searchParams.get("from_date")),
      toDate: readOptionalText(searchParams.get("to_date")),
      search,
    });

    return NextResponse.json({
      success: true,
      message: "Loan accounts retrieved successfully",
      data: result,
      meta: result.meta,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireSessionUser();
    const body = (await request.json()) as Record<string, unknown>;
    const payload = { ...body };
    delete payload.action;

    if (body.action === "status") {
      const item = await changeLoanAccountStatus(payload);
      return NextResponse.json({
        success: true,
        message: "Loan account status updated",
        data: item,
      });
    }

    if (body.action === "update" || typeof payload.loanAccountId === "number") {
      const item = await updateLoanAccount(payload);
      return NextResponse.json({
        success: true,
        message: "Loan account updated",
        data: item,
      });
    }

    const item = await createLoanAccount(payload);
    return NextResponse.json(
      {
        success: true,
        message: "Loan account created",
        data: item,
      },
      { status: 201 },
    );
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
