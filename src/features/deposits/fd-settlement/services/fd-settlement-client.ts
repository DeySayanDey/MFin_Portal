import { endpoints } from "@/lib/api/endpoints";
import type {
  ListResult,
  SettlementAccount,
  SettlementAccountDetail,
  SettlementAccountQuery,
  SettlementActionInput,
  SettlementCalculateInput,
  SettlementQuote,
  SettlementRequest,
  SettlementRequestQuery,
  SettlementSaveInput,
} from "../types/fd-settlement.types";

export type FdSettlementClientError = {
  status: number;
  message: string;
};

type Envelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

const GET_INIT: RequestInit = {
  method: "GET",
  headers: { Accept: "application/json" },
  credentials: "same-origin",
};

async function readEnvelope<T>(response: Response): Promise<Envelope<T>> {
  let payload: Envelope<T> = {};
  try {
    payload = (await response.json()) as Envelope<T>;
  } catch {
    payload = {};
  }
  if (!response.ok || payload.success === false) {
    const error: FdSettlementClientError = {
      status: response.status || 500,
      message: payload.message || `Request failed (${response.status})`,
    };
    throw error;
  }
  return payload;
}

async function readData<T>(response: Response, fallback: string): Promise<{ data: T; message: string }> {
  const payload = await readEnvelope<T>(response);
  if (payload.data == null) {
    const error: FdSettlementClientError = { status: 500, message: payload.message || fallback };
    throw error;
  }
  return { data: payload.data, message: payload.message || "" };
}

export function isFdSettlementClientError(value: unknown): value is FdSettlementClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof (value as FdSettlementClientError).message === "string"
  );
}

function withQuery(path: string, values: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value != null && value !== "") params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `${path}?${text}` : path;
}

export async function fetchSettlementAccounts(
  query: SettlementAccountQuery,
): Promise<ListResult<SettlementAccount>> {
  const response = await fetch(
    withQuery(endpoints.bff.fdSettlementAccounts, {
      page: query.page,
      per_page: query.perPage,
      scheme: query.scheme,
      keyword: query.keyword,
      branch_id: query.branchId,
      status: query.status,
    }),
    GET_INIT,
  );
  const payload = await readEnvelope<ListResult<SettlementAccount>>(response);
  return payload.data ?? { items: [], meta: null };
}

export async function fetchSettlementAccount(accountId: number): Promise<SettlementAccountDetail> {
  const response = await fetch(withQuery(endpoints.bff.fdSettlementAccount, { account_id: accountId }), GET_INIT);
  return (await readData<SettlementAccountDetail>(response, "Deposit account could not be loaded")).data;
}

export async function calculateSettlement(input: SettlementCalculateInput): Promise<SettlementQuote> {
  const response = await fetch(
    withQuery(endpoints.bff.fdSettlementCalculate, {
      account_id: input.accountId,
      settlement_type: input.settlementType,
      settlement_date: input.settlementDate,
    }),
    GET_INIT,
  );
  return (await readData<SettlementQuote>(response, "Settlement could not be calculated")).data;
}

export async function fetchSettlementRequests(
  query: SettlementRequestQuery,
): Promise<ListResult<SettlementRequest>> {
  const response = await fetch(
    withQuery(endpoints.bff.fdSettlements, {
      page: query.page,
      per_page: query.perPage,
      view: query.view,
      branch_id: query.branchId,
    }),
    GET_INIT,
  );
  const payload = await readEnvelope<ListResult<SettlementRequest>>(response);
  return payload.data ?? { items: [], meta: null };
}

export async function saveSettlement(
  input: SettlementSaveInput,
  document: File | null,
): Promise<{ item: SettlementRequest; message: string }> {
  const body = new FormData();
  body.set("payload", JSON.stringify(input));
  if (document) body.set("document", document, document.name);
  const response = await fetch(endpoints.bff.fdSettlements, {
    method: "POST",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
    body,
  });
  const { data, message } = await readData<SettlementRequest>(response, "Settlement could not be saved");
  return { item: data, message };
}

export async function runSettlementAction(
  input: SettlementActionInput,
): Promise<{ item: SettlementRequest; message: string }> {
  const response = await fetch(endpoints.bff.fdSettlementActions, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
  const { data, message } = await readData<SettlementRequest>(response, "Settlement could not be updated");
  return { item: data, message };
}
