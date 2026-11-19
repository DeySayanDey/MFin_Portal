import { endpoints } from "@/lib/api/endpoints";
import { dedupeRequest } from "@/lib/client/request-dedupe";
import { downloadWorkbook } from "./opening-download";
import type { OpeningCustomer, OpeningDraft, OpeningDraftInput } from "./opening-deposit.schemas";

type Meta = { total: number; page: number; per_page: number; last_page: number; has_more?: boolean; opening_balance_total?: string };
export type OpeningList<T> = { data: T[]; meta: Meta };
async function request<T>(url: string, init?: RequestInit, savingDraft = false): Promise<T> {
  const response = await fetch(url, { credentials: "same-origin", cache: "no-store", ...init });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.success) {
    if (savingDraft && body?.code === "TIMEOUT") {
      throw new Error("The request timed out and may still complete. Refresh the draft list and check the account reference before trying again.");
    }
    throw new Error(body?.message || `Request failed (${response.status})`);
  }
  return body.data as T;
}
export function fetchDrafts(type: 1 | 2 | 3 | 4 | 5, page: number, perPage: number, branchId?: number, generation = "") {
  const params = new URLSearchParams({ deposit_type_cd: String(type), page: String(page), per_page: String(perPage) });
  if (branchId != null) params.set("branch_id", String(branchId));
  const url = `${endpoints.bff.openingDeposits}?${params}`;
  return dedupeRequest(`opening-drafts:${params}:${generation}`, () => request<OpeningList<OpeningDraft>>(url), 0);
}
export function fetchOpeningCustomers(type: 1 | 2, keyword: string, page: number, branchId?: number) {
  const params = new URLSearchParams({ cust_type_cd: String(type), keyword, page: String(page), per_page: "20" });
  if (branchId != null) params.set("branch_id", String(branchId));
  return request<OpeningList<OpeningCustomer>>(`${endpoints.bff.openingDepositCustomers}?${params}`);
}
async function post<T>(action: string, data: object) {
  return request<T>(endpoints.bff.openingDeposits, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ action, ...data }) }, action === "save");
}
export const saveDraft = (input: OpeningDraftInput) => post<{ opening_id: number }>("save", input);
export const deleteDrafts = (ids: number[]) => post("delete", { opening_ids: ids });
export const finalizeDrafts = (ids: number[]) => post("finalize", { opening_ids: ids });
export async function downloadDrafts(type: 1 | 2 | 3 | 4 | 5, branchId?: number) {
  const params = new URLSearchParams({ deposit_type_cd: String(type) });
  if (branchId != null) params.set("branch_id", String(branchId));
  const response = await fetch(`${endpoints.bff.openingDepositExport}?${params}`, { credentials: "same-origin" });
  if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(body?.message || "Unable to export drafts"); }
  await downloadWorkbook(response, "opening-deposit-drafts.xlsx");
}
