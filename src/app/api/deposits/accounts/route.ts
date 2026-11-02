import { NextResponse } from "next/server";
import { SAVINGS_DEPOSIT_TYPE } from "@/features/deposits/savings/deposit-account.constants";
import {
  changeDepositAccountStatus,
  closeDepositAccount,
  createDepositAccount,
  listDepositAccounts,
  updateDepositAccount,
  syncDepositAccountMembers,
} from "@/features/deposits/savings/services/deposit-account.service";
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

function readClosed(raw: string | null): boolean | undefined {
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

    const requestedType = readOptionalNumber(searchParams.get("deposit_type_cd"));
    const allTypes = searchParams.get("all_types") === "1";
    const result = await listDepositAccounts({
      page: readOptionalNumber(searchParams.get("page")),
      perPage: readOptionalNumber(searchParams.get("per_page")),
      accountId: readOptionalNumber(searchParams.get("account_id")),
      branchId: resolveBranchFilter(
        user,
        readOptionalNumber(searchParams.get("branch_id")),
      ),
      foId: readOptionalNumber(searchParams.get("fo_id")),
      schemeId: readOptionalNumber(searchParams.get("scheme_id")),
      depositTypeCd:
        requestedType ?? (allTypes ? undefined : SAVINGS_DEPOSIT_TYPE),
      prodTypeCd: readOptionalNumber(searchParams.get("prod_type_cd")),
      custTypeCd: readOptionalNumber(searchParams.get("cust_type_cd")),
      memberId: readOptionalNumber(searchParams.get("member_id")),
      groupId: readOptionalNumber(searchParams.get("group_id")),
      opModeCd: readOptionalNumber(searchParams.get("op_mode_cd")),
      statusCd: readOptionalNumber(
        searchParams.get("status_cd") ?? searchParams.get("status"),
      ),
      isClosed: readClosed(searchParams.get("is_closed")),
      fromDate: readOptionalText(searchParams.get("from_date")),
      toDate: readOptionalText(searchParams.get("to_date")),
      search,
    });

    return NextResponse.json({
      success: true,
      message: "Deposit accounts retrieved successfully",
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
      const item = await changeDepositAccountStatus(payload);
      return NextResponse.json({
        success: true,
        message: "Deposit account status updated",
        data: item,
      });
    }

    if (body.action === "sync-members") {
      const res = await syncDepositAccountMembers(Number(payload.accountId));
      return NextResponse.json({
        success: true,
        message: res.message,
        data: res.members,
      });
    }

    if (body.action === "close") {
      const item = await closeDepositAccount(payload);
      return NextResponse.json({
        success: true,
        message: "Deposit account closed",
        data: item,
      });
    }

    if (body.action === "update" || typeof payload.accountId === "number") {
      const item = await updateDepositAccount(payload);
      return NextResponse.json({
        success: true,
        message: "Deposit account updated",
        data: item,
      });
    }

    const item = await createDepositAccount(payload);
    return NextResponse.json(
      {
        success: true,
        message: "Deposit account created",
        data: item,
      },
      { status: 201 },
    );
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
