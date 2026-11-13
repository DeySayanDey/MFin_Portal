/**
 * Browser-safe Operational Days helpers — BFF only.
 */

import { endpoints } from "@/lib/api/endpoints";
import { clearDedupe, dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  OperationalDay,
  OperationalDayCreateInput,
  OperationalDayListQuery,
  OperationalDayListResult,
  OperationalDayUpdateInput,
  OperationalDaysBulkInput,
  OperationalDaysBulkResult,
} from "@/features/master/operational-days/types/operational-days.types";

export type OperationalDaysClientError = {
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
    const error: OperationalDaysClientError = {
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

export function isOperationalDaysClientError(
  value: unknown,
): value is OperationalDaysClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as OperationalDaysClientError).message === "string"
  );
}

function listQueryKey(query: OperationalDayListQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
  if (query.recId != null) params.set("rec_id", String(query.recId));
  if (query.branchId != null) params.set("branch_id", String(query.branchId));
  if (query.dayOfWeek != null) {
    params.set("day_of_week", String(query.dayOfWeek));
  }
  if (query.isOperational != null) {
    params.set("is_operational", String(query.isOperational));
  }
  if (query.isActive != null) params.set("is_active", String(query.isActive));
  return params.toString() || "default";
}

export async function fetchOperationalDayList(
  query: OperationalDayListQuery = {},
): Promise<OperationalDayListResult> {
  const qs = listQueryKey(query);
  return dedupeRequest(
    `master:operational-days:${qs}`,
    async () => {
      const response = await fetch(
        `${endpoints.bff.operationalDays}${qs === "default" ? "" : `?${qs}`}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      return parseEnvelope<OperationalDayListResult>(response);
    },
    0,
  );
}

export async function createOperationalDay(
  input: OperationalDayCreateInput,
): Promise<OperationalDay> {
  const response = await fetch(endpoints.bff.operationalDays, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ action: "create", ...input }),
  });
  const data = await parseEnvelope<OperationalDay>(response);
  clearDedupe();
  return data;
}

export async function saveOperationalDaysBulk(input: OperationalDaysBulkInput): Promise<OperationalDaysBulkResult> {
  const response = await fetch(endpoints.bff.operationalDays, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ action: "bulk", ...input }),
  });
  const data = await parseEnvelope<OperationalDaysBulkResult>(response);
  clearDedupe();
  return data;
}

export async function updateOperationalDay(
  input: OperationalDayUpdateInput,
): Promise<OperationalDay> {
  const response = await fetch(endpoints.bff.operationalDays, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ action: "update", ...input }),
  });
  const data = await parseEnvelope<OperationalDay>(response);
  clearDedupe();
  return data;
}
