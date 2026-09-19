/**
 * Browser-safe Staff helpers — BFF only, never Laravel token.
 */

import { clearDedupe, dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  Staff,
  StaffCreateInput,
  StaffListQuery,
  StaffListResult,
  StaffLookups,
  StaffMutationResult,
  StaffUpdateInput,
} from "@/features/master/staff/types/staff.types";

export type StaffClientError = {
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
    const error: StaffClientError = {
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

export function isStaffClientError(value: unknown): value is StaffClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as StaffClientError).message === "string"
  );
}

function listQueryKey(query: StaffListQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
  if (query.staffId != null) params.set("staff_id", String(query.staffId));
  if (query.branchId != null) params.set("branch_id", String(query.branchId));
  if (query.designationId != null) {
    params.set("designation_id", String(query.designationId));
  }
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.status != null) params.set("status", String(query.status));
  if (query.includeModules) params.set("include_modules", "1");
  return params.toString() || "default";
}

export async function fetchStaffList(
  query: StaffListQuery = {},
): Promise<StaffListResult> {
  const qs = listQueryKey(query);
  return dedupeRequest(
    `master:staff:${qs}`,
    async () => {
      const response = await fetch(
        `/api/master/staff${qs === "default" ? "" : `?${qs}`}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
        },
      );
      return parseEnvelope<StaffListResult>(response);
    },
    0,
  );
}

export async function fetchStaffLookups(): Promise<StaffLookups> {
  return dedupeRequest(
    "master:staff:lookups",
    async () => {
      const response = await fetch("/api/master/staff/lookups", {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      return parseEnvelope<StaffLookups>(response);
    },
    0,
  );
}

export async function createStaff(
  input: StaffCreateInput,
): Promise<StaffMutationResult> {
  const response = await fetch("/api/master/staff", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ action: "create", ...input }),
  });
  const data = await parseEnvelope<StaffMutationResult>(response);
  clearDedupe();
  return data;
}

export async function updateStaff(
  input: StaffUpdateInput,
): Promise<StaffMutationResult> {
  const response = await fetch("/api/master/staff", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ action: "update", ...input }),
  });
  const data = await parseEnvelope<StaffMutationResult>(response);
  clearDedupe();
  return data;
}

export async function fetchStaff(staffId: number): Promise<Staff | null> {
  const result = await fetchStaffList({
    staffId,
    page: 1,
    perPage: 1,
    includeModules: true,
  });
  return result.items[0] ?? null;
}
