import { endpoints } from "@/lib/api/endpoints";

export type Row = Record<string, unknown>;

async function request(url: string, init?: RequestInit) {
  const response = await fetch(url, { credentials: "same-origin", cache: "no-store", ...init });
  const json = await response.json();
  if (!response.ok || !json.success) throw new Error(typeof json.message === "string" ? json.message : "Request failed");
  return json.data;
}

export async function listVirtualBank(kind: "banks" | "configs" | "mappings"): Promise<Row[]> {
  const rows: Row[] = [];
  let page = 1;
  while (true) {
    const result = await request(`${endpoints.bff.virtualBank}?kind=${kind}&page=${page}`) as { items: Row[]; hasMore: boolean };
    rows.push(...result.items);
    if (!result.hasMore) break;
    if (result.items.length === 0) throw new Error("Incomplete list");
    page++;
  }
  return rows;
}

export async function fetchConfigEditDetails(id: number): Promise<Row> {
  const data: unknown = await request(`${endpoints.bff.virtualBank}/edit-details?id=${encodeURIComponent(id)}`);
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Unexpected configuration response");
  const row = data as Row;
  const textFields = ["config_name", "branch_code", "ifsc_code", "account_no", "cif_no", "tender_id", "maker_id", "checker_id", "client_id", "upi_id", "secret_id", "hex_key", "hex_iv_key"];
  const otherFields = ["purpose_cd", "max_amount", "is_active", "has_qr_image", "has_hex_key", "has_hex_iv_key", "has_secret_id"];
  if (Number(row.id) !== id || !Number.isSafeInteger(Number(row.bank_id)) || Number(row.bank_id) < 1 || textFields.some((key) => !Object.hasOwn(row, key) || (row[key] !== null && typeof row[key] !== "string")) || otherFields.some((key) => !Object.hasOwn(row, key))) {
    throw new Error("Unexpected configuration response");
  }
  return row;
}

export async function saveMapping(data: { id?: number; virtual_id: number; org_branch_id: number; is_active: boolean }) {
  return request(endpoints.bff.virtualBank, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
}

export async function saveConfiguration(data: Record<string, unknown>, image: File | null) {
  const form = new FormData();
  form.set("payload", JSON.stringify(data));
  if (image) form.set("qr_image", image);
  return request(`${endpoints.bff.virtualBank}?kind=config`, { method: "POST", body: form });
}
