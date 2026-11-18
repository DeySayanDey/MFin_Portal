/**
 * Browser-safe support helpers.
 * Calls the Next.js BFF only. The support API secret and client token stay on the server.
 */

import { getStoredAuthUser } from "@/features/auth/utils/auth-user-storage";
import { endpoints } from "@/lib/api/endpoints";
import type {
  RaiseTicketInput,
  ReplyTicketInput,
  SupportTicket,
  SupportTicketDetail,
  SupportTicketListQuery,
  SupportTicketListResult,
  SupportTicketMessage,
} from "@/features/support/types/support-ticket.types";

export type SupportTicketClientError = {
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
    const error: SupportTicketClientError = {
      status: response.status || 500,
      message: payload.message || `Request failed (${response.status})`,
      details: payload.errors ?? null,
      code:
        response.status === 401
          ? "UNAUTHORIZED"
          : response.status === 403
            ? "FORBIDDEN"
            : response.status === 422
              ? "VALIDATION"
              : response.status === 404
                ? "NOT_FOUND"
                : response.status === 429
                  ? "UNEXPECTED"
                  : "UNEXPECTED",
    };
    throw error;
  }

  return payload.data as T;
}

export function isSupportTicketClientError(
  value: unknown,
): value is SupportTicketClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as SupportTicketClientError).message === "string"
  );
}

export async function fetchSupportTickets(
  query: SupportTicketListQuery = {},
): Promise<SupportTicketListResult> {
  const params = new URLSearchParams();
  const user = getStoredAuthUser();
  const phone = (user?.userPhone || user?.userMob || "").trim();
  if (phone) params.set("phone", phone);
  if (query.search) params.set("search", query.search);
  if (query.priority) params.set("priority", query.priority);
  if (query.status) params.set("status", query.status);
  if (query.fromDate) params.set("fromDate", query.fromDate);
  if (query.toDate) params.set("toDate", query.toDate);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 20));
  const response = await fetch(`${endpoints.bff.supportTickets}?${params}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
    cache: "no-store",
  });
  return parseEnvelope<SupportTicketListResult>(response);
}

export async function fetchSupportTicket(number: string): Promise<SupportTicketDetail> {
  const response = await fetch(
    `${endpoints.bff.supportTickets}/${encodeURIComponent(number)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
      cache: "no-store",
    },
  );
  return parseEnvelope<SupportTicketDetail>(response);
}

export async function raiseSupportTicket(input: RaiseTicketInput): Promise<SupportTicket> {
  const response = await fetch(endpoints.bff.supportTickets, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
  return parseEnvelope<SupportTicket>(response);
}

function messagesPath(number: string): string {
  return `${endpoints.bff.supportTickets}/${encodeURIComponent(number)}/messages`;
}

export async function fetchSupportTicketMessages(
  number: string,
): Promise<SupportTicketMessage[]> {
  const response = await fetch(messagesPath(number), {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
    cache: "no-store",
  });
  return parseEnvelope<SupportTicketMessage[]>(response);
}

export async function replySupportTicket(
  number: string,
  input: ReplyTicketInput,
): Promise<SupportTicketMessage> {
  const response = await fetch(messagesPath(number), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
  return parseEnvelope<SupportTicketMessage>(response);
}
