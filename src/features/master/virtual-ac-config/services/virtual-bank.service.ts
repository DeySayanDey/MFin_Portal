import "server-only";
import { api } from "@/lib/api/client";
import { endpoints, joinApiUrl } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/session";
import { env } from "@/lib/config/env";

async function token() {
  const value = await getAccessToken();
  if (!value) throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Unauthorized" });
  return value;
}

export async function getVirtualConfigEditDetails(id: number) {
  const url = new URL(joinApiUrl(env.NEXT_PUBLIC_API_BASE_URL, endpoints.virtualBank.configEditDetails));
  url.searchParams.set("id", String(id));
  return fetch(url, {
    headers: { Authorization: `Bearer ${await token()}`, Accept: "application/json" },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(30000),
  });
}

export async function listVirtualBank(kind: "banks" | "configs" | "mappings", page: number) {
  const payload = await api.get<{ success: boolean; data: unknown[]; meta?: { has_more?: boolean } }>(endpoints.virtualBank[kind], {
    accessToken: await token(), expectEnvelope: false,
    searchParams: { page, per_page: 200 },
  });
  if (!payload?.success || !Array.isArray(payload.data)) throw new ApiError({ status: 502, code: "UNEXPECTED", message: "Unexpected response" });
  const allowed: Record<typeof kind, string[]> = {
    banks: ["bank_id", "bank_name", "bank_short_name"],
    configs: ["id", "bank_id", "bank_name", "config_name", "purpose_cd", "max_amount", "branch_code", "ifsc_code", "account_no", "cif_no", "tender_id", "maker_id", "checker_id", "client_id", "upi_id", "is_active", "has_qr_image", "has_hex_key", "has_hex_iv_key", "has_secret_id"],
    mappings: ["id", "virtual_id", "config_name", "org_branch_id", "branch_name", "branch_code", "bank_id", "bank_name", "is_active"],
  };
  const items = payload.data.map((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) throw new ApiError({ status: 502, code: "UNEXPECTED", message: "Unexpected response" });
    const record = row as Record<string, unknown>;
    const ids = kind === "banks" ? ["bank_id"] : kind === "configs" ? ["id", "bank_id"] : ["id", "virtual_id", "org_branch_id"];
    const requiredConfigFields = ["config_name", "purpose_cd", "max_amount", "branch_code", "ifsc_code", "account_no", "cif_no", "tender_id", "maker_id", "checker_id", "client_id", "upi_id", "is_active", "has_qr_image", "has_hex_key", "has_hex_iv_key", "has_secret_id"];
    const textFields = ["config_name", "branch_code", "ifsc_code", "account_no", "cif_no", "tender_id", "maker_id", "checker_id", "client_id", "upi_id"];
    const invalidConfig = kind === "configs" && (
      requiredConfigFields.some((key) => !Object.hasOwn(record, key)) ||
      textFields.some((key) => record[key] !== null && typeof record[key] !== "string") ||
      (record.max_amount !== null && (typeof record.max_amount !== "string" || !/^\d{1,16}(?:\.\d{1,2})?$/.test(record.max_amount))) ||
      (record.purpose_cd !== null && (typeof record.purpose_cd !== "number" || !Number.isInteger(record.purpose_cd) || record.purpose_cd < 0 || record.purpose_cd > 127))
    );
    if (ids.some((key) => !Number.isSafeInteger(Number(record[key])) || Number(record[key]) <= 0) || (kind === "banks" && typeof record.bank_name !== "string") || invalidConfig) {
      throw new ApiError({ status: 502, code: "UNEXPECTED", message: "Unexpected response" });
    }
    return Object.fromEntries(allowed[kind].filter((key) => Object.hasOwn(row, key)).map((key) => [key, record[key]]));
  });
  if (!payload.meta || typeof payload.meta.has_more !== "boolean") throw new ApiError({ status: 502, code: "UNEXPECTED", message: "Pagination response was unexpected" });
  return { items, hasMore: payload.meta.has_more };
}

export async function saveVirtualMapping(body: { id?: number; virtual_id: number; org_branch_id: number; is_active: boolean }) {
  const { id, ...rest } = body;
  return api.post(id ? endpoints.virtualBank.mappingEdit : endpoints.virtualBank.mappingAdd, id ? { ...rest, id } : rest, { accessToken: await token() });
}

export async function saveVirtualConfig(id: number | undefined, body: Record<string, unknown>, image: File | null) {
  let payload: Record<string, unknown> | FormData = id ? { ...body, id } : body;
  if (image) {
    const form = new FormData();
    for (const [key, value] of Object.entries(payload)) {
      if (value === undefined) continue;
      form.set(key, value === null ? "" : typeof value === "boolean" ? (value ? "1" : "0") : String(value));
    }
    form.set("qr_image", image);
    payload = form;
  }
  const data = await api.post(id ? endpoints.virtualBank.configEdit : endpoints.virtualBank.configAdd, payload, { accessToken: await token() });
  return data;
}
