import { endpoints } from "@/lib/api/endpoints";
import { dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  ChargeCalcQuery,
  ChargeCalcResult,
  ChargePostInput,
  ChargePostResult,
} from "../types/charge-posting.types";

type Envelope<T> = { success?: boolean; message?: string; data?: T };

export type ChargeClientError = { status: number; message: string };

export function isChargeClientError(value: unknown): value is ChargeClientError {
  return typeof value === "object" && value !== null && "status" in value && "message" in value;
}

async function parse<T>(response: Response, fallback: string): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as Envelope<T>;
  if (!response.ok || payload.success === false || payload.data == null) {
    throw { status: response.status || 500, message: payload.message || fallback } satisfies ChargeClientError;
  }
  return payload.data;
}

/** Same query and generation share one request; bump `generation` to recalculate. */
export function fetchChargeCalculation(query: ChargeCalcQuery, generation = 0): Promise<ChargeCalcResult> {
  const params = new URLSearchParams({ mode: query.mode, charge_date: query.chargeDate });
  if (query.accountId != null) params.set("account_id", String(query.accountId));
  if (query.chargeId != null) params.set("charge_id", String(query.chargeId));
  if (query.schemeId != null) params.set("scheme_id", String(query.schemeId));
  if (query.branchId != null) params.set("branch_id", String(query.branchId));
  if (query.keyword) params.set("keyword", query.keyword);
  return dedupeRequest(
    `savings-charges:${params}#${generation}`,
    async () => {
      const response = await fetch(`${endpoints.bff.savingsCharges}?${params}`, {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      return parse<ChargeCalcResult>(response, "Charges could not be calculated");
    },
    0,
  );
}

export async function postCharges(input: ChargePostInput): Promise<ChargePostResult> {
  const response = await fetch(endpoints.bff.savingsCharges, {
    method: "POST",
    credentials: "same-origin",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parse<ChargePostResult>(response, "Charges could not be posted");
}
