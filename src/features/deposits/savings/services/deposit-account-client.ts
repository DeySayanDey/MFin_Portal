/**
 * Browser-safe savings deposit account helpers — BFF only.
 */

import { endpoints } from "@/lib/api/endpoints";
import { dedupeRequest } from "@/lib/client/request-dedupe";
import { SAVINGS_DEPOSIT_TYPE } from "../deposit-account.constants";
import type {
  DepositAccount,
  DepositAccountCloseInput,
  DepositAccountCreateInput,
  DepositAccountDetail,
  DepositAccountEditInput,
  DepositAccountListQuery,
  DepositAccountListResult,
  DepositAccountMemberSyncResult,
  DepositAccountSaveResult,
  DepositAccountStatusInput,
  DepositProductQuery,
  DepositProductType,
  DepositCustomer,
  DepositCustomerQuery,
  DepositNominee,
  DepositNomineeAddInput,
  DepositNomineeEditInput,
  DepositNomineeStatusInput,
  DepositSignatory,
  DepositSignatoryAddInput,
  DepositSignatoryEditInput,
  DepositSignatoryStatusInput,
  SignatoryCandidate,
  DepositProductScheme,
  DepositAccountMember,
  DepositAccountViewData,
} from "../types/deposit-account.types";

export type DepositAccountClientError = {
  status: number;
  message: string;
  code?: string;
  details?: unknown;
};

type Envelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
};

async function parseEnvelope<T>(response: Response): Promise<T> {
  let payload: Envelope<T> = {};
  try {
    payload = (await response.json()) as Envelope<T>;
  } catch {
    payload = {};
  }

  if (!response.ok || payload.success === false) {
    const error: DepositAccountClientError = {
      status: response.status || 500,
      message: payload.message || `Request failed (${response.status})`,
      details: payload.errors ?? null,
      code:
        response.status === 401
          ? "UNAUTHORIZED"
          : response.status === 422
            ? "VALIDATION"
            : response.status === 404
              ? "NOT_FOUND"
              : "UNEXPECTED",
    };
    throw error;
  }

  return payload.data as T;
}

export function isDepositAccountClientError(
  value: unknown,
): value is DepositAccountClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as DepositAccountClientError).message === "string"
  );
}

function listQueryKey(query: DepositAccountListQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
  if (query.accountId != null) params.set("account_id", String(query.accountId));
  if (query.branchId != null) params.set("branch_id", String(query.branchId));
  if (query.foId != null) params.set("fo_id", String(query.foId));
  if (query.prodTypeCd != null) params.set("prod_type_cd", String(query.prodTypeCd));
  if (query.schemeId != null) params.set("scheme_id", String(query.schemeId));
  if (query.prodTypeCd != null) params.set("prod_type_cd", String(query.prodTypeCd));
  if (query.depositTypeCd != null) {
    params.set("deposit_type_cd", String(query.depositTypeCd));
  }
  if (query.custTypeCd != null) {
    params.set("cust_type_cd", String(query.custTypeCd));
  }
  if (query.memberId != null) params.set("member_id", String(query.memberId));
  if (query.groupId != null) params.set("group_id", String(query.groupId));
  if (query.opModeCd != null) params.set("op_mode_cd", String(query.opModeCd));
  if (query.statusCd != null) params.set("status_cd", String(query.statusCd));
  if (query.isClosed != null) params.set("is_closed", query.isClosed ? "1" : "0");
  if (query.fromDate) params.set("from_date", query.fromDate);
  if (query.toDate) params.set("to_date", query.toDate);
  if (query.search) params.set("search", query.search);
  if (query.allTypes) params.set("all_types", "1");
  return params.toString() || "default";
}

export async function fetchDepositAccounts(
  query: DepositAccountListQuery = {},
): Promise<DepositAccountListResult> {
  const qs = listQueryKey(query);
  return dedupeRequest(
    `deposits:accounts:${qs}`,
    async () => {
      const response = await fetch(
        `${endpoints.bff.depositAccounts}${qs === "default" ? "" : `?${qs}`}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      return parseEnvelope<DepositAccountListResult>(response);
    },
    0,
  );
}

async function postAccount<T>(body: unknown): Promise<T> {
  const response = await fetch(endpoints.bff.depositAccounts, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  return parseEnvelope<T>(response);
}

export async function createDepositAccount(
  input: DepositAccountCreateInput,
): Promise<DepositAccountSaveResult> {
  return postAccount<DepositAccountSaveResult>({ action: "create", ...input });
}

export async function updateDepositAccount(
  input: DepositAccountEditInput,
): Promise<DepositAccountSaveResult> {
  return postAccount<DepositAccountSaveResult>({ action: "update", ...input });
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
    cache: "no-store",
  });
  return parseEnvelope<T>(response);
}

export async function fetchDepositProducts(
  query: DepositProductQuery = {},
): Promise<DepositProductType[]> {
  const params = new URLSearchParams();
  params.set("deposit_type_cd", String(query.depositTypeCd ?? SAVINGS_DEPOSIT_TYPE));
  if (query.prodTypeCd != null) params.set("prod_type_cd", String(query.prodTypeCd));
  if (query.isActive != null) params.set("is_active", String(query.isActive));
  const qs = params.toString();
  return dedupeRequest(
    `deposits:products:${qs}`,
    () => getJson<DepositProductType[]>(`${endpoints.bff.depositAccountProducts}?${qs}`),
    0,
  );
}

export async function fetchDepositAccountView(
  accountId: number,
  txnLimit?: number,
): Promise<DepositAccountDetail> {
  const params = new URLSearchParams();
  params.set("account_id", String(accountId));
  if (txnLimit != null) params.set("txn_limit", String(txnLimit));
  const qs = params.toString();
  return dedupeRequest(
    `deposits:view:${qs}`,
    () => getJson<DepositAccountDetail>(`${endpoints.bff.depositAccountView}?${qs}`),
    0,
  );
}

export async function syncDepositAccountMembers(
  accountId: number,
): Promise<DepositAccountMemberSyncResult> {
  const response = await fetch(endpoints.bff.depositAccountMembers, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ accountId }),
  });
  return parseEnvelope<DepositAccountMemberSyncResult>(response);
}

export async function changeDepositAccountStatus(
  input: DepositAccountStatusInput,
): Promise<DepositAccount> {
  return postAccount<DepositAccount>({ action: "status", ...input });
}

export async function closeDepositAccount(
  input: DepositAccountCloseInput,
): Promise<DepositAccount> {
  return postAccount<DepositAccount>({ action: "close", ...input });
}

export async function fetchDepositNominees(
  accountId: number,
): Promise<DepositNominee[]> {
  const params = new URLSearchParams();
  params.set("account_id", String(accountId));
  return dedupeRequest(
    `deposits:nominees:${accountId}`,
    async () => {
      const response = await fetch(
        `${endpoints.bff.depositAccountNominees}?${params.toString()}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      return parseEnvelope<DepositNominee[]>(response);
    },
    0,
  );
}

async function postNominee(body: unknown): Promise<void> {
  const response = await fetch(endpoints.bff.depositAccountNominees, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  await parseEnvelope<unknown>(response);
}

export async function addDepositNominees(
  input: DepositNomineeAddInput,
): Promise<void> {
  await postNominee({ action: "add", ...input });
}

export async function editDepositNominee(
  input: DepositNomineeEditInput,
): Promise<void> {
  await postNominee({ action: "edit", ...input });
}

export async function changeDepositNomineeStatus(
  input: DepositNomineeStatusInput,
): Promise<void> {
  await postNominee({ action: "status", ...input });
}

export async function fetchDepositSignatories(
  accountId: number,
): Promise<DepositSignatory[]> {
  const params = new URLSearchParams();
  params.set("account_id", String(accountId));
  return dedupeRequest(
    `deposits:signatories:${accountId}`,
    async () => {
      const response = await fetch(
        `${endpoints.bff.depositAccountSignatories}?${params.toString()}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      return parseEnvelope<DepositSignatory[]>(response);
    },
    0,
  );
}

export async function fetchGroupSignatoryMembers(
  groupId: number,
): Promise<SignatoryCandidate[]> {
  const params = new URLSearchParams();
  params.set("group_id", String(groupId));
  return dedupeRequest(
    `deposits:group-members:${groupId}`,
    async () => {
      const response = await fetch(
        `${endpoints.bff.depositAccountSignatories}?${params.toString()}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      return parseEnvelope<SignatoryCandidate[]>(response);
    },
    0,
  );
}

async function postSignatory(body: unknown): Promise<void> {
  const response = await fetch(endpoints.bff.depositAccountSignatories, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  await parseEnvelope<unknown>(response);
}

export async function addDepositSignatories(
  input: DepositSignatoryAddInput,
): Promise<void> {
  await postSignatory({ action: "add", ...input });
}

export async function editDepositSignatory(
  input: DepositSignatoryEditInput,
): Promise<void> {
  await postSignatory({ action: "edit", ...input });
}

export async function changeDepositSignatoryStatus(
  input: DepositSignatoryStatusInput,
): Promise<void> {
  await postSignatory({ action: "status", ...input });
}

export async function fetchDepositCustomers(
  query: DepositCustomerQuery,
): Promise<DepositCustomer[]> {
  const params = new URLSearchParams();
  params.set("kind", query.kind);
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.branchId != null) params.set("branch_id", String(query.branchId));
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
  const qs = params.toString();
  return dedupeRequest(
    `deposits:customers:${qs}`,
    async () => {
      const response = await fetch(
        `${endpoints.bff.depositAccountCustomers}?${qs}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      return parseEnvelope<DepositCustomer[]>(response);
    },
    0,
  );
}

export async function fetchDepositProductSchemes(
  depositTypeCd = 1,
): Promise<DepositProductScheme[]> {
  return dedupeRequest(
    `deposits:product-schemes:${depositTypeCd}`,
    async () => {
      const response = await fetch(
        `${endpoints.bff.depositProductSchemes}?deposit_type_cd=${depositTypeCd}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
        },
      );
      return parseEnvelope<DepositProductScheme[]>(response);
    },
    0,
  );
}

export async function syncTermDepositSchedule(accountId: number): Promise<void> {
  const response = await fetch(endpoints.bff.termDepositSchedule, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ accountId }),
  });
  await parseEnvelope<unknown>(response);
}

export async function fetchDepositAccountView(
  accountId: number,
  txnLimit = 10,
): Promise<DepositAccountViewData> {
  const response = await fetch(
    `${endpoints.bff.depositAccountView}?account_id=${accountId}&txn_limit=${txnLimit}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    },
  );
  return parseEnvelope<DepositAccountViewData>(response);
}

export async function syncDepositAccountMembers(
  accountId: number,
): Promise<{ message: string; members: DepositAccountMember[] }> {
  const response = await fetch(endpoints.bff.depositAccounts, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({
      action: "sync-members",
      accountId,
    }),
  });
  const data = await parseEnvelope<DepositAccountMember[]>(response);
  return {
    message: "Members synced successfully",
    members: Array.isArray(data) ? data : [],
  };
}
