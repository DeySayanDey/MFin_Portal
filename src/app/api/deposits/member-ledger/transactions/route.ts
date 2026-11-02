import { NextResponse } from "next/server";
import { getMemberLedgerTransactions } from "@/features/deposits/member-ledger/services/member-ledger.service";
import { listMembers } from "@/features/onboarding/member-registration/services/member.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { ApiError } from "@/lib/api/errors";
import { requireSessionUser, resolveBranchFilter } from "@/lib/auth/bff-scope";
import type { MemberLedgerSectionKey } from "@/features/deposits/member-ledger/types/member-ledger.types";

async function assertMember(memberId: number) {
  const user = await requireSessionUser();
  const result = await listMembers({
    memberId,
    branchId: resolveBranchFilter(user, undefined),
    page: 1,
    perPage: 1,
  });
  if (!result.items.some((member) => member.memberId === memberId)) {
    throw new ApiError({ message: "Forbidden", status: 403, code: "FORBIDDEN" });
  }
}

/** Laravel: GET MemberLedgerSavingsTransactions or MemberLedgerTermTransactions */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = Number(searchParams.get("member_id"));
    const accountId = Number(searchParams.get("account_id"));
    const section = searchParams.get("section");
    if (!Number.isInteger(memberId) || memberId <= 0 || !Number.isInteger(accountId) || accountId <= 0) {
      return NextResponse.json(
        { success: false, message: "A member and account are required" },
        { status: 422 },
      );
    }
    if (section !== "savings" && section !== "term") {
      return NextResponse.json(
        { success: false, message: "A ledger section is required" },
        { status: 422 },
      );
    }
    const fromDate = searchParams.get("from_date")?.trim() || undefined;
    const toDate = searchParams.get("to_date")?.trim() || undefined;
    if (fromDate && toDate && toDate < fromDate) {
      return NextResponse.json(
        { success: false, message: "The end date cannot be before the start date" },
        { status: 422 },
      );
    }
    const sort = searchParams.get("sort") === "asc" ? "asc" : "desc";
    const page = Number(searchParams.get("page"));
    const perPage = Number(searchParams.get("per_page"));
    await assertMember(memberId);
    const data = await getMemberLedgerTransactions({
      memberId,
      accountId,
      section: section as MemberLedgerSectionKey,
      fromDate,
      toDate,
      includePending: searchParams.get("include_pending") === "1",
      sort,
      page: Number.isInteger(page) && page > 0 ? page : 1,
      perPage: Number.isInteger(perPage) && perPage > 0 ? Math.min(perPage, 200) : 20,
    });
    return NextResponse.json({ success: true, data, meta: data.meta });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
