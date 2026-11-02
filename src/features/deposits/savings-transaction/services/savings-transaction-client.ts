import { endpoints } from "@/lib/api/endpoints";
import type {
  SavingsAccountBalance,
  SavingsCustomerListResult,
  SavingsTransaction,
  SavingsTransactionAddInput,
  SavingsTransactionApproveInput,
  SavingsTransactionListQuery,
  SavingsTransactionListResult,
  SavingsTransactionResult,
} from "../types/savings-transaction.types";

export type SavingsTransactionClientError = {
  status: number;
  message: string;
};

type Envelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

async function readEnvelope<T>(response: Response): Promise<Envelope<T>> {
  let payload: Envelope<T> = {};
  try {
    payload = (await response.json()) as Envelope<T>;
  } catch {
    payload = {};
  }
  if (!response.ok || payload.success === false) {
    const error: SavingsTransactionClientError = {
      status: response.status || 500,
      message: payload.message || `Request failed (${response.status})`,
    };
    throw error;
  }
  return payload;
}

export function isSavingsTransactionClientError(
  value: unknown,
): value is SavingsTransactionClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof (value as SavingsTransactionClientError).message === "string"
  );
}

function queryString(query: SavingsTransactionListQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
<<<<<<< Updated upstream
  if (query.transId != null) params.set("trans_id", String(query.transId));
  if (query.accountId != null) params.set("account_id", String(query.accountId));
  if (query.memberId != null) params.set("member_id", String(query.memberId));
  if (query.groupId != null) params.set("group_id", String(query.groupId));
  if (query.branchId != null) params.set("branch_id", String(query.branchId));
  if (query.foId != null) params.set("fo_id", String(query.foId));
=======
  if (query.accountId != null) params.set("account_id", String(query.accountId));
>>>>>>> Stashed changes
  if (query.transTypeCd != null) params.set("trans_type_cd", String(query.transTypeCd));
  if (query.transMode) params.set("trans_mode", query.transMode);
  if (query.statusCd != null) params.set("status_cd", String(query.statusCd));
  if (query.fromDate) params.set("from_date", query.fromDate);
  if (query.toDate) params.set("to_date", query.toDate);
  if (query.search) params.set("search", query.search);
  if (query.depositTypeCd != null) {
    params.set("deposit_type_cd", String(query.depositTypeCd));
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

export async function fetchSavingsTransactions(
  query: SavingsTransactionListQuery = {},
): Promise<SavingsTransactionListResult> {
  const response = await fetch(
    `${endpoints.bff.savingsTransactions}${queryString(query)}`,
    { method: "GET", headers: { Accept: "application/json" }, credentials: "same-origin" },
  );
  const payload = await readEnvelope<SavingsTransactionListResult>(response);
  return payload.data ?? { items: [], meta: null };
}

export async function addSavingsTransaction(
  input: SavingsTransactionAddInput,
): Promise<SavingsTransactionResult> {
  const response = await fetch(endpoints.bff.savingsTransactions, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ action: "add", ...input }),
  });
  const payload = await readEnvelope<SavingsTransaction>(response);
  if (!payload.data) {
    throw { status: 500, message: payload.message || "Transaction could not be saved" };
  }
  return { item: payload.data, message: payload.message || "" };
}

export async function fetchSavingsCustomers(query: {
  keyword?: string;
  page?: number;
  perPage?: number;
} = {}): Promise<SavingsCustomerListResult> {
  const params = new URLSearchParams();
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.page != null) params.set("page", String(query.page));
  params.set("per_page", String(query.perPage ?? 20));
  const text = params.toString();
  const response = await fetch(
    `${endpoints.bff.savingsTransactionCustomers}${text ? `?${text}` : ""}`,
    { method: "GET", headers: { Accept: "application/json" }, credentials: "same-origin" },
  );
  const payload = await readEnvelope<SavingsCustomerListResult>(response);
  return payload.data ?? { items: [], meta: null };
}

export async function fetchSavingsAccountBalance(
  accountId: number,
): Promise<SavingsAccountBalance> {
  const params = new URLSearchParams({ account_id: String(accountId) });
  const response = await fetch(
    `${endpoints.bff.savingsTransactionBalance}?${params.toString()}`,
    { method: "GET", headers: { Accept: "application/json" }, credentials: "same-origin" },
  );
  const payload = await readEnvelope<SavingsAccountBalance>(response);
  if (!payload.data) {
    throw { status: 500, message: payload.message || "Balance could not be loaded" };
  }
  return payload.data;
}

export async function postMissingVouchers(accountId: number): Promise<string> {
  const response = await fetch(endpoints.bff.savingsTransactionVouchers, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ accountId }),
  });
  const payload = await readEnvelope<null>(response);
  return payload.message || "Vouchers posted";
}

export async function approveSavingsTransaction(
  input: SavingsTransactionApproveInput,
): Promise<SavingsTransactionResult> {
  const response = await fetch(endpoints.bff.savingsTransactions, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ action: "approve", ...input }),
  });
  const payload = await readEnvelope<SavingsTransaction>(response);
  if (!payload.data) {
    throw { status: 500, message: payload.message || "Transaction could not be updated" };
  }
  return { item: payload.data, message: payload.message || "" };
}
