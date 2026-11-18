/**
 * Browser-safe Holiday helpers — BFF only.
 */

import { endpoints } from "@/lib/api/endpoints";
import { clearDedupe, dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  Holiday,
  HolidayListQuery,
  HolidayListResult,
  HolidaySaveInput,
} from "@/features/master/holiday/types/holiday.types";

export type HolidayClientError = {
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
    const error: HolidayClientError = {
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

export function isHolidayClientError(
  value: unknown,
): value is HolidayClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as HolidayClientError).message === "string"
  );
}

function listQueryKey(query: HolidayListQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
  if (query.id != null) params.set("id", String(query.id));
  if (query.yearSl != null) params.set("year_sl", String(query.yearSl));
  if (query.holiType != null) params.set("holi_type", String(query.holiType));
  if (query.search) params.set("search", query.search);
  if (query.fromDate) params.set("from_date", query.fromDate);
  if (query.toDate) params.set("to_date", query.toDate);
  return params.toString() || "default";
}

export async function fetchHolidayList(
  query: HolidayListQuery = {},
): Promise<HolidayListResult> {
  const qs = listQueryKey(query);
  return dedupeRequest(
    `master:holiday:${qs}`,
    async () => {
      const response = await fetch(
        `${endpoints.bff.holiday}${qs === "default" ? "" : `?${qs}`}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      return parseEnvelope<HolidayListResult>(response);
    },
    0,
  );
}

export async function saveHoliday(input: HolidaySaveInput): Promise<Holiday> {
  const response = await fetch(endpoints.bff.holiday, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
  const data = await parseEnvelope<Holiday>(response);
  clearDedupe();
  return data;
}
