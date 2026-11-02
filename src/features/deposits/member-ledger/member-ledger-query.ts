import { ApiError } from "@/lib/api/errors";
import type { MemberLedgerTxnQuery } from "./types/member-ledger.types";

export function memberLedgerBranchScope(user: {
  isHead: boolean;
  branchId: number | null;
}): number | undefined {
  if (user.isHead) return undefined;
  if (user.branchId == null) {
    throw new ApiError({ message: "Forbidden", status: 403, code: "FORBIDDEN" });
  }
  return user.branchId;
}

export function memberLedgerTxnQuery(request: Request): MemberLedgerTxnQuery {
  const params = new URL(request.url).searchParams;
  const memberId = Number(params.get("member_id"));
  const accountId = Number(params.get("account_id"));
  if (
    !Number.isInteger(memberId) ||
    memberId <= 0 ||
    !Number.isInteger(accountId) ||
    accountId <= 0
  ) {
    throw new ApiError({
      message: "A valid member and account are required",
      status: 422,
      code: "VALIDATION",
    });
  }
  const date = /^\d{4}-\d{2}-\d{2}$/;
  const fromDate = params.get("from_date")?.trim() || undefined;
  const toDate = params.get("to_date")?.trim() || undefined;
  if (
    (fromDate && !date.test(fromDate)) ||
    (toDate && !date.test(toDate)) ||
    (fromDate && toDate && toDate < fromDate)
  ) {
    throw new ApiError({
      message: "Enter a valid date range",
      status: 422,
      code: "VALIDATION",
    });
  }
  const sortRaw = params.get("sort");
  if (sortRaw && sortRaw !== "asc" && sortRaw !== "desc") {
    throw new ApiError({ message: "Sort must be asc or desc", status: 422, code: "VALIDATION" });
  }
  const page = Number(params.get("page") ?? 1);
  const perPage = Number(params.get("per_page") ?? 20);
  return {
    memberId,
    accountId,
    fromDate,
    toDate,
    includePending: params.get("include_pending") === "1",
    sort: sortRaw === "asc" ? "asc" : "desc",
    page: Number.isInteger(page) && page > 0 ? page : 1,
    perPage: Number.isInteger(perPage) ? Math.min(200, Math.max(1, perPage)) : 20,
  };
}
