import { endpoints } from "@/lib/api/endpoints";
import { downloadWorkbook } from "./opening-download";
import type { LoanDraft, LoanInput } from "./opening-loan.schemas";

type List = { data: LoanDraft[]; meta: { total: number; page: number; per_page: number; last_page: number; total_outstanding?: string | null } };
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "same-origin", cache: "no-store", ...init });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.success) throw new Error(body?.message || `Request failed (${response.status})`);
  return body.data as T;
}
export function fetchLoans(page: number, perPage: number) {
  return request<List>(`${endpoints.bff.openingLoans}?${new URLSearchParams({ page: String(page), per_page: String(perPage) })}`);
}
function post<T>(action: string, data: object) {
  return request<T>(endpoints.bff.openingLoans, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ action, ...data }) });
}
export const saveLoanDraft = (data: LoanInput) => post<{ opening_id: number }>("save", data);
export const deleteLoanDrafts = (ids: number[]) => post("delete", { opening_ids: ids });
export async function downloadLoanDrafts(ids: number[] = []) {
  const params = new URLSearchParams(); ids.forEach((id) => params.append("opening_ids[]", String(id)));
  const response = await fetch(`${endpoints.bff.openingLoanExport}?${params}`, { credentials: "same-origin" });
  if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(body?.message || "Unable to export loan drafts"); }
  await downloadWorkbook(response, "opening-loan-drafts.xlsx");
}
