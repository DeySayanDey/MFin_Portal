import { NextResponse } from "next/server";
import {
  createDisbursement,
  fetchDisbursementList,
} from "@/features/lms/disbursement/services/disbursement.service";
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

    const approval = searchParams.get("approval");
    const isFinalRaw = searchParams.get("is_final");
    const isFinal =
      isFinalRaw === "1" || isFinalRaw === "true"
        ? true
        : isFinalRaw === "0" || isFinalRaw === "false"
          ? false
          : undefined;

    const result = await fetchDisbursementList({
      disbursement_id: readOptionalNumber(searchParams.get("disbursement_id")),
      loan_account_id: readOptionalNumber(searchParams.get("loan_account_id")),
      branch_id: resolveBranchFilter(
        user,
        readOptionalNumber(searchParams.get("branch_id")),
      ),
      approval: approval === "pending" || approval === "approved" ? approval : undefined,
      is_final: isFinal,
      payment_mode_cd: readOptionalNumber(searchParams.get("payment_mode_cd")),
      from_date: readOptionalText(searchParams.get("from_date")),
      to_date: readOptionalText(searchParams.get("to_date")),
      keyword: search,
      page: readOptionalNumber(searchParams.get("page")),
      per_page: readOptionalNumber(searchParams.get("per_page")),
    });

    return NextResponse.json({
      success: true,
      message: "Disbursements retrieved successfully",
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

    const result = await createDisbursement({
      loan_account_id: Number(body.loan_account_id),
      disbursement_date: typeof body.disbursement_date === "string" ? body.disbursement_date : undefined,
      gross_amount: Number(body.gross_amount),
      other_deduction: body.other_deduction != null ? Number(body.other_deduction) : undefined,
      payment_mode_cd: Number(body.payment_mode_cd),
      cheque_no: typeof body.cheque_no === "string" ? body.cheque_no : undefined,
      reference_no: typeof body.reference_no === "string" ? body.reference_no : undefined,
      sb_account_id: body.sb_account_id != null ? Number(body.sb_account_id) : undefined,
      is_final: typeof body.is_final === "boolean" ? body.is_final : undefined,
      remarks: typeof body.remarks === "string" ? body.remarks : undefined,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Disbursement recorded successfully",
        data: result,
      },
      { status: 201 },
    );
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
