import { endpoints } from "@/lib/api/endpoints";
import { dedupeRequest } from "@/lib/client/request-dedupe";
import type { DashboardQuery, DashboardSnapshot } from "../types/dashboard.types";

type Envelope<T> = { success?: boolean; message?: string; data?: T };

export type DashboardClientError = { status: number; message: string };

export function isDashboardClientError(value: unknown): value is DashboardClientError {
  return typeof value === "object" && value !== null && "status" in value && "message" in value;
}

async function parse<T>(response: Response, fallback: string): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as Envelope<T>;
  if (!response.ok || payload.success === false || payload.data == null) {
    throw { status: response.status || 500, message: payload.message || fallback } satisfies DashboardClientError;
  }
  return payload.data;
}

/** Same query and generation share one request; bump `generation` to reload. */
export function fetchDashboard(query: DashboardQuery, generation = 0): Promise<DashboardSnapshot> {
  const params = new URLSearchParams({ from_date: query.fromDate, to_date: query.toDate });
  if (query.branchId != null) params.set("branch_id", String(query.branchId));
  return dedupeRequest(
    `dashboard:${params}#${generation}`,
    async () => {
      const response = await fetch(`${endpoints.bff.dashboard}?${params}`, {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      return parse<DashboardSnapshot>(response, "Dashboard could not be loaded");
    },
    0,
  );
}
