import { NextResponse } from "next/server";
import {
  addSavingsTransaction,
  approveSavingsTransaction,
  listSavingsTransactions,
} from "@/features/deposits/savings-transaction/services/savings-transaction.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser, resolveBranchFilter } from "@/lib/auth/bff-scope";

function readOptionalNumber(raw: string | null): number | undefined {
  if (raw == null || raw === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function readOptionalText(raw: string | null): string | undefined {
  const trimmed = raw?.trim() ?? "";
  return trimmed === "" ? undefined : trimmed;
}

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const result = await listSavingsTransactions({
      page: readOptionalNumber(searchParams.get("page")),
      perPage: readOptionalNumber(searchParams.get("per_page")),
      transId: readOptionalNumber(searchParams.get("trans_id")),
      accountId: readOptionalNumber(searchParams.get("account_id")),
      memberId: readOptionalNumber(searchParams.get("member_id")),
      groupId: readOptionalNumber(searchParams.get("group_id")),
      branchId: resolveBranchFilter(
        user,
        readOptionalNumber(searchParams.get("branch_id")),
      ),
      foId: readOptionalNumber(searchParams.get("fo_id")),
      depositTypeCd: readOptionalNumber(searchParams.get("deposit_type_cd")),
      transTypeCd: readOptionalNumber(searchParams.get("trans_type_cd")),
      transMode: readOptionalText(searchParams.get("trans_mode")),
      statusCd: readOptionalNumber(
        searchParams.get("status_cd") ?? searchParams.get("status"),
      ),
      fromDate: readOptionalText(searchParams.get("from_date")),
      toDate: readOptionalText(searchParams.get("to_date")),
      search:
        readOptionalText(searchParams.get("search")) ??
        readOptionalText(searchParams.get("keyword")),
    });
    return NextResponse.json({
      success: true,
      message: "Transactions retrieved successfully",
      data: result,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireSessionUser();
    const body = (await request.json()) as Record<string, unknown>;
    const { action, ...payload } = body;
    const result =
      action === "approve"
        ? await approveSavingsTransaction(payload)
        : await addSavingsTransaction(payload);
    return NextResponse.json(
      { success: true, message: result.message, data: result.item },
      { status: action === "approve" ? 200 : 201 },
    );
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
