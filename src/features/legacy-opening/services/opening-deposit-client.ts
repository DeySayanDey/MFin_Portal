import { endpoints } from "@/lib/api/endpoints";
import type { OpeningCustomer, OpeningDraft, OpeningDraftInput } from "./opening-deposit.schemas";

type Meta = { total: number; page: number; per_page: number; last_page: number; has_more?: boolean; opening_balance_total?: string };
export type OpeningList<T> = { data: T[]; meta: Meta };
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "same-origin", cache: "no-store", ...init });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.success) throw new Error(body?.message || `Request failed (${response.status})`);
  return body.data as T;
}
export function fetchDrafts(type: 1 | 2 | 3 | 4 | 5, page: number, perPage: number, branchId?: number) {
  const params = new URLSearchParams({ deposit_type_cd: String(type), page: String(page), per_page: String(perPage) });
  if (branchId != null) params.set("branch_id", String(branchId));
  return request<OpeningList<OpeningDraft>>(`${endpoints.bff.openingDeposits}?${params}`);
}
export function fetchOpeningCustomers(type: 1 | 2, keyword: string, page: number, branchId?: number) {
  const params = new URLSearchParams({ cust_type_cd: String(type), keyword, page: String(page), per_page: "20" });
  if (branchId != null) params.set("branch_id", String(branchId));
  return request<OpeningList<OpeningCustomer>>(`${endpoints.bff.openingDepositCustomers}?${params}`);
}
async function post<T>(action: string, data: object) {
  return request<T>(endpoints.bff.openingDeposits, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ action, ...data }) });
}
export const saveDraft = (input: OpeningDraftInput) => post<{ opening_id: number }>("save", input);
export const deleteDrafts = (ids: number[]) => post("delete", { opening_ids: ids });
export const finalizeDrafts = (ids: number[]) => post("finalize", { opening_ids: ids });
export async function downloadDrafts(type: 1 | 2 | 3 | 4 | 5, branchId?: number) {
  const params = new URLSearchParams({ deposit_type_cd: String(type) });
  if (branchId != null) params.set("branch_id", String(branchId));
  const response = await fetch(`${endpoints.bff.openingDepositExport}?${params}`, { credentials: "same-origin" });
  if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(body?.message || "Unable to export drafts"); }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = "opening-deposit-drafts.csv"; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
