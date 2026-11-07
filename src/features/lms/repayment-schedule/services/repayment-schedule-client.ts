/**
 * Browser-safe repayment schedule helpers — BFF only.
 */

import { endpoints } from "@/lib/api/endpoints";
import type {
  LoanScheduleListQuery,
  LoanScheduleListResult,
  LoanScheduleRow,
} from "../types/repayment-schedule.types";

export type RepaymentScheduleClientError = {
  status: number;
  message: string;
  code?: string;
  details?: unknown;
};

type Envelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  meta?: unknown;
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
    const error: RepaymentScheduleClientError = {
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

export function isRepaymentScheduleClientError(
  value: unknown,
): value is RepaymentScheduleClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as RepaymentScheduleClientError).message === "string"
  );
}

export async function fetchRepaymentSchedule(
  query: LoanScheduleListQuery,
): Promise<LoanScheduleListResult> {
  const params = new URLSearchParams();
  params.set("loan_account_id", String(query.loanAccountId));
  if (query.asOn) params.set("as_on", query.asOn);

  const response = await fetch(
    `${endpoints.bff.loanRepaymentSchedule}?${params.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
      cache: "no-store",
    },
  );

  const data = await parseEnvelope<{
    items?: LoanScheduleRow[];
    asOn?: string | null;
  }>(response);

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    asOn: data?.asOn ?? query.asOn ?? null,
  };
}
