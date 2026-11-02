export type SavingsAccountFilters = {
  search: string;
  prodTypeCd: string;
  branchId: string;
  schemeId: string;
  custTypeCd: string;
  statusCd: string;
  isClosed: "" | "0" | "1";
  fromDate: string;
  toDate: string;
  memberId: string;
  groupId: string;
};

export const DEFAULT_SAVINGS_FILTERS: SavingsAccountFilters = {
  search: "",
  prodTypeCd: "",
  branchId: "",
  schemeId: "",
  custTypeCd: "",
  statusCd: "",
  isClosed: "0",
  fromDate: "",
  toDate: "",
  memberId: "",
  groupId: "",
};

export function savingsFiltersEqual(
  left: SavingsAccountFilters,
  right: SavingsAccountFilters,
): boolean {
  return (
    left.search === right.search &&
    left.prodTypeCd === right.prodTypeCd &&
    left.branchId === right.branchId &&
    left.schemeId === right.schemeId &&
    left.custTypeCd === right.custTypeCd &&
    left.statusCd === right.statusCd &&
    left.isClosed === right.isClosed &&
    left.fromDate === right.fromDate &&
    left.toDate === right.toDate &&
    left.memberId === right.memberId &&
    left.groupId === right.groupId
  );
}

function readParam(
  source: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const value = source[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function savingsFiltersFromQuery(
  source: Record<string, string | string[] | undefined>,
): SavingsAccountFilters {
  const closed = readParam(source, "is_closed");
  const hasClosed = Object.prototype.hasOwnProperty.call(source, "is_closed");
  return {
    search: readParam(source, "keyword") || readParam(source, "search"),
    prodTypeCd: readParam(source, "prod_type_cd"),
    branchId: readParam(source, "branch_id"),
    schemeId: readParam(source, "scheme_id"),
    custTypeCd: readParam(source, "cust_type_cd"),
    statusCd: readParam(source, "status_cd") || readParam(source, "status"),
    isClosed: !hasClosed ? "0" : closed === "1" ? "1" : closed === "0" ? "0" : "",
    fromDate: readParam(source, "from_date"),
    toDate: readParam(source, "to_date"),
    memberId: readParam(source, "member_id"),
    groupId: readParam(source, "group_id"),
  };
}

export function writeSavingsFilters(
  filters: SavingsAccountFilters,
  page: number,
  accountId: number | null,
) {
  const url = new URL(window.location.href);
  const set = (key: string, value: string) => {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  };
  set("keyword", filters.search.trim());
  set("prod_type_cd", filters.prodTypeCd);
  set("branch_id", filters.branchId);
  set("scheme_id", filters.schemeId);
  set("cust_type_cd", filters.custTypeCd);
  set("status_cd", filters.statusCd);
  url.searchParams.set("is_closed", filters.isClosed);
  set("from_date", filters.fromDate);
  set("to_date", filters.toDate);
  set("member_id", filters.memberId);
  set("group_id", filters.groupId);
  url.searchParams.delete("search");
  url.searchParams.delete("status");
  if (page > 1) url.searchParams.set("page", String(page));
  else url.searchParams.delete("page");
  if (accountId != null) url.searchParams.set("account_id", String(accountId));
  else url.searchParams.delete("account_id");
  window.history.replaceState(null, "", url.toString());
}
