import { endpoints } from "@/lib/api/endpoints";
import { dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  InterestCalcQuery,
  InterestCalcResult,
  InterestPostInput,
  InterestPostResult,
} from "../types/interest-posting.types";

type Envelope<T> = { success?: boolean; message?: string; data?: T };

export type InterestClientError = { status: number; message: string };

export function isInterestClientError(value: unknown): value is InterestClientError {
  return typeof value === "object" && value !== null && "status" in value && "message" in value;
}

async function parse<T>(response: Response, fallback: string): Promise<{ data: T; message: string }> {
  const payload = (await response.json().catch(() => ({}))) as Envelope<T>;
  if (!response.ok || payload.success === false || payload.data == null) {
    throw { status: response.status || 500, message: payload.message || fallback } satisfies InterestClientError;
  }
  return { data: payload.data, message: payload.message ?? "" };
}

/** Same query and generation share one request; bump `generation` to recalculate. */
export function fetchInterestCalculation(query: InterestCalcQuery, generation = 0): Promise<InterestCalcResult> {
  const params = new URLSearchParams({ mode: query.mode, as_on_date: query.asOnDate });
  if (query.accountId != null) params.set("account_id", String(query.accountId));
  if (query.schemeId != null) params.set("scheme_id", String(query.schemeId));
  if (query.branchId != null) params.set("branch_id", String(query.branchId));
  if (query.keyword) params.set("keyword", query.keyword);
  return dedupeRequest(
    `savings-interest:${params}#${generation}`,
    async () => {
      const response = await fetch(`${endpoints.bff.savingsInterest}?${params}`, {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      return (await parse<InterestCalcResult>(response, "Interest could not be calculated")).data;
    },
    0,
  );
}

export async function postInterest(input: InterestPostInput): Promise<InterestPostResult> {
  const response = await fetch(endpoints.bff.savingsInterest, {
    method: "POST",
    credentials: "same-origin",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return (await parse<InterestPostResult>(response, "Interest could not be posted")).data;
}
