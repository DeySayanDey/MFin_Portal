import { endpoints } from "@/lib/api/endpoints";
import type {
  ShareHolding,
  ShareHoldingQuery,
  ShareSubscription,
  ShareSubscriptionAddInput,
  ShareSubscriptionApproveInput,
  ShareSubscriptionEditInput,
  ShareSubscriptionListQuery,
  ShareSubscriptionListResult,
  ShareSubscriptionResult,
} from "../types/share-subscription.types";

export type ShareSubscriptionClientError = {
  status: number;
  message: string;
  details?: unknown;
};

type Envelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
};

async function readEnvelope<T>(response: Response): Promise<Envelope<T>> {
  let payload: Envelope<T> = {};
  try {
    payload = (await response.json()) as Envelope<T>;
  } catch {
    payload = {};
  }
  if (!response.ok || payload.success === false) {
    const error: ShareSubscriptionClientError = {
      status: response.status || 500,
      message: payload.message || `Request failed (${response.status})`,
      details: payload.errors,
    };
    throw error;
  }
  return payload;
}

export function isShareSubscriptionClientError(
  value: unknown,
): value is ShareSubscriptionClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof (value as ShareSubscriptionClientError).message === "string"
  );
}

function queryString(query: ShareSubscriptionListQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({
    page: query.page,
    per_page: query.perPage,
    subscription_id: query.subscriptionId,
    cust_type_cd: query.custTypeCd,
    customer_id: query.customerId,
    branch_id: query.branchId,
    tr_status_cd: query.statusCd,
    from_date: query.fromDate,
    to_date: query.toDate,
    keyword: query.search,
  })) {
    if (value != null && value !== "") params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

async function post<T>(body: Record<string, unknown>): Promise<Envelope<T>> {
  const response = await fetch(endpoints.bff.shareSubscription, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  return readEnvelope<T>(response);
}

export async function fetchShareSubscriptions(
  query: ShareSubscriptionListQuery = {},
): Promise<ShareSubscriptionListResult> {
  const response = await fetch(
    `${endpoints.bff.shareSubscription}${queryString(query)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
      cache: "no-store",
    },
  );
  const payload = await readEnvelope<ShareSubscriptionListResult>(response);
  return payload.data ?? { items: [], meta: null };
}

export async function fetchShareHolding(query: ShareHoldingQuery): Promise<ShareHolding> {
  const params = new URLSearchParams({
    view: "holding",
    cust_type_cd: String(query.custTypeCd),
    customer_id: String(query.customerId),
  });
  const response = await fetch(`${endpoints.bff.shareSubscription}?${params}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
    cache: "no-store",
  });
  const payload = await readEnvelope<ShareHolding>(response);
  if (!payload.data) {
    throw { status: 500, message: payload.message || "Share holding could not be loaded" };
  }
  return payload.data;
}

export async function addShareSubscription(
  input: ShareSubscriptionAddInput,
): Promise<ShareSubscriptionResult> {
  const payload = await post<ShareSubscription>({ action: "add", ...input });
  if (!payload.data) {
    throw { status: 500, message: payload.message || "Share subscription could not be saved" };
  }
  return { item: payload.data, message: payload.message || "" };
}

export async function editShareSubscription(
  input: ShareSubscriptionEditInput,
): Promise<ShareSubscriptionResult> {
  const payload = await post<ShareSubscription>({ action: "edit", ...input });
  if (!payload.data) {
    throw { status: 500, message: payload.message || "Share subscription could not be updated" };
  }
  return { item: payload.data, message: payload.message || "" };
}

export async function approveShareSubscription(
  input: ShareSubscriptionApproveInput,
): Promise<ShareSubscriptionResult> {
  const payload = await post<ShareSubscription>({ action: "approve", ...input });
  if (!payload.data) {
    throw { status: 500, message: payload.message || "Share subscription could not be updated" };
  }
  return { item: payload.data, message: payload.message || "" };
}
