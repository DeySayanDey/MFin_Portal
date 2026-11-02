import { endpoints } from "@/lib/api/endpoints";
import { dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  MemberLedger,
  MemberLedgerTransactionQuery,
  MemberLedgerTransactions,
} from "../types/member-ledger.types";

type Envelope<T> = { success?: boolean; message?: string; data?: T };

export type MemberLedgerClientError = { status: number; message: string };

async function parse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as Envelope<T>;
  if (!response.ok || payload.success === false || payload.data == null) {
    throw {
      status: response.status || 500,
      message: payload.message || "Member ledger request failed",
    } satisfies MemberLedgerClientError;
  }
  return payload.data;
}

export function isMemberLedgerClientError(value: unknown): value is MemberLedgerClientError {
  return typeof value === "object" && value !== null && "status" in value && "message" in value;
}

export function fetchMemberLedger(memberId: number): Promise<MemberLedger> {
  const params = new URLSearchParams({ member_id: String(memberId), include_closed: "1" });
  return dedupeRequest(`member-ledger:${params}`, () =>
    fetch(`${endpoints.bff.memberLedger}?${params}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      cache: "no-store",
    }).then(parse<MemberLedger>),
  0);
}

export function fetchMemberLedgerTransactions(
  query: MemberLedgerTransactionQuery,
): Promise<MemberLedgerTransactions> {
  const params = new URLSearchParams({
    member_id: String(query.memberId),
    account_id: String(query.accountId),
    section: query.section,
    include_pending: query.includePending ? "1" : "0",
    sort: query.sort === "asc" ? "asc" : "desc",
    page: String(query.page ?? 1),
    per_page: String(query.perPage ?? 20),
  });
  if (query.fromDate) params.set("from_date", query.fromDate);
  if (query.toDate) params.set("to_date", query.toDate);
  return dedupeRequest(`member-ledger-txn:${params}`, () =>
    fetch(`${endpoints.bff.memberLedgerTransactions}?${params}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      cache: "no-store",
    }).then(parse<MemberLedgerTransactions>),
  0);
}
