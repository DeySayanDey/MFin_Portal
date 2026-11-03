import { NextResponse } from "next/server";
import { listSettlementAccounts } from "@/features/deposits/fd-settlement/services/fd-settlement.service";
import type {
  AccountStatusFilter,
  SchemeCode,
} from "@/features/deposits/fd-settlement/types/fd-settlement.types";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser, resolveBranchFilter } from "@/lib/auth/bff-scope";

const SCHEMES: readonly SchemeCode[] = ["FD", "MIS", "OTHER"];
const STATUSES: readonly AccountStatusFilter[] = ["activeMatured", "active", "matured", "closed", "settled", "all"];

function readOptionalNumber(raw: string | null): number | undefined {
  if (raw == null || raw === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const scheme = searchParams.get("scheme") as SchemeCode | null;
    const status = searchParams.get("status") as AccountStatusFilter | null;
    const keyword = searchParams.get("keyword")?.trim().slice(0, 50);
    const result = await listSettlementAccounts({
      page: readOptionalNumber(searchParams.get("page")),
      perPage: readOptionalNumber(searchParams.get("per_page")),
      scheme: scheme && SCHEMES.includes(scheme) ? scheme : undefined,
      status: status && STATUSES.includes(status) ? status : "activeMatured",
      keyword: keyword || undefined,
      branchId: resolveBranchFilter(user, readOptionalNumber(searchParams.get("branch_id"))),
    });
    return NextResponse.json({ success: true, message: "Accounts retrieved", data: result });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
