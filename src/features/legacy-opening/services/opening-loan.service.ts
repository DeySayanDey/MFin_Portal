import "server-only";
import { z } from "zod";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import { loanIdsSchema, loanInputSchema, loanListSchema } from "./opening-loan.schemas";

const querySchema = z.object({ page: z.coerce.number().int().positive().default(1), per_page: z.coerce.number().int().min(1).max(200).default(50), branch_id: z.coerce.number().int().min(1).max(32767).optional(), "opening_ids[]": z.array(z.coerce.number().int().positive()).min(1).max(200).refine((v) => new Set(v).size === v.length).optional() });
function invalid(message: string): never { throw new ApiError({ message, status: 422, code: "VALIDATION" }); }
async function auth<T>(run: (token: string) => Promise<T>): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new ApiError({ message: "Unauthorized", status: 401, code: "UNAUTHORIZED" });
  try { return await run(token); } catch (error) { if (error instanceof ApiError && error.isUnauthorized) await clearAuthSession(); throw error; }
}
export async function listLoans(raw: unknown) {
  const query = querySchema.safeParse(raw); if (!query.success) return invalid("Invalid loan draft filters");
  return auth(async (token) => {
    const data = await api.get<unknown>(endpoints.openingLoan.list, { accessToken: token, expectEnvelope: false, searchParams: query.data });
    const result = loanListSchema.safeParse(data); if (!result.success) throw new ApiError({ message: "Unexpected loan draft response", status: 500, code: "UNEXPECTED" });
    return result.data;
  });
}
export async function saveLoan(raw: unknown) {
  const input = loanInputSchema.safeParse(raw); if (!input.success) return invalid(input.error.issues[0]?.message || "Invalid loan draft");
  return auth(async (token) => {
    const data = await api.post<unknown>(input.data.opening_id ? endpoints.openingLoan.edit : endpoints.openingLoan.add, input.data, { accessToken: token });
    const result = z.object({ opening_id: z.number().int().positive() }).safeParse(data);
    if (!result.success || (input.data.opening_id && result.data.opening_id !== input.data.opening_id)) throw new ApiError({ message: "Unexpected loan save response", status: 500, code: "UNEXPECTED" });
    return result.data;
  });
}
export async function deleteLoans(raw: unknown) {
  const input = z.object({ opening_ids: loanIdsSchema }).safeParse(raw); if (!input.success) return invalid("Select 1 to 200 distinct drafts");
  return auth(async (token) => {
    const data = await api.post<unknown>(endpoints.openingLoan.delete, input.data, { accessToken: token });
    const result = z.object({ opening_ids: loanIdsSchema, deleted_count: z.number().int() }).safeParse(data);
    if (!result.success || result.data.deleted_count !== input.data.opening_ids.length || result.data.opening_ids.length !== input.data.opening_ids.length || result.data.opening_ids.some((id) => !input.data.opening_ids.includes(id))) throw new ApiError({ message: "Could not reconcile the delete response. Refresh drafts before retrying.", status: 500, code: "UNEXPECTED" });
    return result.data;
  });
}
export async function exportLoans(raw: unknown) {
  const query = querySchema.safeParse(raw); if (!query.success) return invalid("Invalid export filters");
  return auth((token) => api.get<{ data: ArrayBuffer; contentDisposition: string | null }>(endpoints.openingLoan.export, { accessToken: token, responseType: "binary", headers: { Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }, searchParams: { branch_id: query.data.branch_id, "opening_ids[]": query.data["opening_ids[]"] } }));
}
