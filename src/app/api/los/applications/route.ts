import { NextResponse } from "next/server";
import {
  changeLoanApplicationStatus,
  createLoanApplication,
  createLoanApplicationBulk,
  editLoanApplication,
  listLoanApplications,
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

    const result = await listLoanApplications({
      page: readOptionalNumber(searchParams.get("page")),
      per_page: readOptionalNumber(searchParams.get("per_page")),
      keyword: search,
      stage: readOptionalText(searchParams.get("stage")),
      application_id: readOptionalNumber(searchParams.get("application_id")),
      scheme_id: readOptionalNumber(searchParams.get("scheme_id")),
      branch_id: resolveBranchFilter(
        user,
        readOptionalNumber(searchParams.get("branch_id")),
      ),
      fo_id: readOptionalNumber(searchParams.get("fo_id")),
      cust_type_cd: readOptionalNumber(searchParams.get("cust_type_cd")),
      appl_status_cd: readOptionalNumber(searchParams.get("appl_status_cd")),
      member_id: readOptionalNumber(searchParams.get("member_id")),
      group_id: readOptionalNumber(searchParams.get("group_id")),
      from_date: readOptionalText(searchParams.get("from_date")),
      to_date: readOptionalText(searchParams.get("to_date")),
    });

    return NextResponse.json({
      success: true,
      message: "Loan applications retrieved successfully",
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
    const action = body.action;
    delete body.action;

    if (action === "bulk_create") {
      const item = await createLoanApplicationBulk(body as any);
      return NextResponse.json(
        {
          success: true,
          message: "Loan application submitted successfully",
          data: item,
        },
        { status: 201 },
      );
    }

    if (action === "edit") {
      const item = await editLoanApplication(body as any);
      return NextResponse.json({
        success: true,
        message: "Loan application updated successfully",
        data: item,
      });
    }

    if (action === "status") {
      const item = await changeLoanApplicationStatus(body as any);
      return NextResponse.json({
        success: true,
        message: "Application status changed successfully",
        data: item,
      });
    }

    const item = await createLoanApplication(body as any);
    return NextResponse.json(
      {
        success: true,
        message: "Loan application submitted successfully",
        data: item,
      },
      { status: 201 },
    );
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
