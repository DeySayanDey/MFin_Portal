/**
 * Browser-safe Working Hours helpers.
 * Calls Next.js BFF only — never Laravel and never the Bearer token.
 */

import { clearDedupe, dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  WorkingHours,
  WorkingHoursUpdateInput,
} from "@/features/master/working-hours/types/working-hours.types";

export type WorkingHoursClientError = {
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
    const error: WorkingHoursClientError = {
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

export function isWorkingHoursClientError(
  value: unknown,
): value is WorkingHoursClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as WorkingHoursClientError).message === "string"
  );
}

export async function fetchWorkingHours(): Promise<WorkingHours> {
  return dedupeRequest("master:working-hours", async () => {
    const response = await fetch("/api/master/working-hours", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    return parseEnvelope<WorkingHours>(response);
  });
}

export async function saveWorkingHours(
  input: WorkingHoursUpdateInput,
): Promise<WorkingHours> {
  const response = await fetch("/api/master/working-hours", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
  const data = await parseEnvelope<WorkingHours>(response);
  clearDedupe("master:working-hours");
  return data;
}
