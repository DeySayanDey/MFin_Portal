import "server-only";
import { z } from "zod";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import { batchInputSchema, customerSchema, draftInputSchema, draftRowSchema, metaSchema } from "./opening-deposit.schemas";

async function auth<T>(run: (token: string) => Promise<T>): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new ApiError({ message: "Unauthorized", status: 401, code: "UNAUTHORIZED" });
  try { return await run(token); } catch (error) { if (error instanceof ApiError && error.isUnauthorized) await clearAuthSession(); throw error; }
}
function invalid(message: string): never { throw new ApiError({ message, status: 422, code: "VALIDATION" }); }
const querySchema = z.object({ page: z.coerce.number().int().positive().default(1), per_page: z.coerce.number().int().min(1).max(200).default(20), deposit_type_cd: z.coerce.number().int().refine((value) => [1, 2, 3, 4, 5].includes(value)).optional(), branch_id: z.coerce.number().int().positive().max(32767).optional() });
const draftQuerySchema = querySchema.extend({ "opening_ids[]": z.array(z.coerce.number().int().positive()).min(1).max(200).refine((items) => new Set(items).size === items.length).optional() });
const customerQuerySchema = querySchema.omit({ deposit_type_cd: true }).extend({ cust_type_cd: z.coerce.number().int().min(1).max(2), keyword: z.string().trim().max(150).optional() });
const envelope = <T extends z.ZodType>(schema: T) => z.object({ success: z.literal(true), data: z.array(schema), meta: metaSchema });

export async function listOpeningDrafts(raw: unknown) {
  const query = draftQuerySchema.safeParse(raw); if (!query.success) return invalid("Invalid draft filters");
  return auth(async (token) => {
    const payload = await api.get<unknown>(endpoints.openingDeposit.list, { accessToken: token, expectEnvelope: false, searchParams: query.data });
    const parsed = envelope(draftRowSchema).safeParse(payload);
    if (!parsed.success) throw new ApiError({ message: "Unexpected opening draft response", status: 500, code: "UNEXPECTED" });
    return parsed.data;
  });
}
export async function listOpeningCustomers(raw: unknown) {
  const query = customerQuerySchema.safeParse(raw); if (!query.success) return invalid("Invalid customer filters");
  return auth(async (token) => {
    const payload = await api.get<unknown>(endpoints.openingDeposit.customers, { accessToken: token, expectEnvelope: false, searchParams: query.data });
    const parsed = envelope(customerSchema).safeParse(payload);
    if (!parsed.success) throw new ApiError({ message: "Unexpected opening customer response", status: 500, code: "UNEXPECTED" });
    return parsed.data;
  });
}
export async function saveOpeningDraft(raw: unknown) {
  const parsed = draftInputSchema.safeParse(raw); if (!parsed.success) throw new ApiError({ message: "Invalid opening draft", status: 422, code: "VALIDATION", details: parsed.error.flatten() });
  return auth(async (token) => {
    const result = await api.post<unknown>(parsed.data.opening_id ? endpoints.openingDeposit.edit : endpoints.openingDeposit.add, parsed.data, { accessToken: token });
    const saved = z.object({ opening_id: z.number().int().positive() }).safeParse(result);
    if (!saved.success || (parsed.data.opening_id && saved.data.opening_id !== parsed.data.opening_id)) throw new ApiError({ message: "Unexpected opening save response", status: 500, code: "UNEXPECTED" });
    return saved.data;
  });
}
export async function changeOpeningBatch(action: "delete" | "finalize", raw: unknown) {
  const parsed = batchInputSchema.safeParse(raw); if (!parsed.success) return invalid("Select 1 to 200 distinct drafts");
  return auth(async (token) => {
    const data = await api.post<unknown>(action === "delete" ? endpoints.openingDeposit.delete : endpoints.openingDeposit.finalize, parsed.data, { accessToken: token });
    const schema = action === "delete" ? z.object({ opening_ids: z.array(z.number().int().positive()), deleted_count: z.number().int() }) : z.object({ items: z.array(z.object({ opening_id: positiveNumber, account_id: positiveNumber, already_finalized: z.boolean(), subscription_id: positiveNumber.optional() }).refine((item) => item.subscription_id == null || item.subscription_id === item.account_id)), count: z.number().int() });
    const result = schema.safeParse(data);
    if (!result.success) throw new ApiError({ message: "Unexpected opening batch response", status: 500, code: "UNEXPECTED" });
    const returnedIds = "opening_ids" in result.data ? result.data.opening_ids : result.data.items.map((item) => item.opening_id);
    const count = "deleted_count" in result.data ? result.data.deleted_count : result.data.count;
    if (count !== parsed.data.opening_ids.length || returnedIds.length !== count || new Set(returnedIds).size !== count || returnedIds.some((id) => !parsed.data.opening_ids.includes(id))) throw new ApiError({ message: "The batch response could not be reconciled. Refresh drafts before retrying.", status: 500, code: "UNEXPECTED" });
    return result.data;
  });
}
const positiveNumber = z.number().int().positive();
export async function exportOpeningDrafts(raw: unknown) {
  const query = draftQuerySchema.safeParse(raw); if (!query.success) return invalid("Invalid export filters");
  return auth((token) => api.get<{ data: ArrayBuffer; contentDisposition: string | null }>(endpoints.openingDeposit.export, { accessToken: token, responseType: "binary", headers: { Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }, searchParams: { deposit_type_cd: query.data.deposit_type_cd, branch_id: query.data.branch_id, "opening_ids[]": query.data["opening_ids[]"] } }));
}
