import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSessionUser, assertHeadOffice } from "@/lib/auth/bff-scope";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { listVirtualBank, saveVirtualConfig, saveVirtualMapping } from "@/features/master/virtual-ac-config/services/virtual-bank.service";

const mappingSchema = z.object({ id: z.number().int().positive().optional(), virtual_id: z.number().int().positive(), org_branch_id: z.number().int().positive(), is_active: z.boolean() }).strict();
const text50 = z.string().max(50).nullable();
const hex = z.string().max(255).regex(/^(?:[0-9a-fA-F]{2})+$/).nullable().optional();
const configSchema = z.object({
  id: z.number().int().positive().optional(), bank_id: z.number().int().positive(), is_active: z.boolean(),
  config_name: text50.optional(), purpose_cd: z.number().int().min(0).max(127).nullable().optional(), max_amount: z.string().regex(/^\d{1,16}(?:\.\d{1,2})?$/).nullable().optional(),
  branch_code: text50, ifsc_code: text50, account_no: text50, cif_no: text50, tender_id: text50, maker_id: text50, checker_id: text50, client_id: text50, upi_id: text50,
  hex_key: hex, hex_iv_key: hex, secret_id: text50.optional(), remove_qr: z.boolean().optional(),
}).strict();

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const query = new URL(request.url).searchParams;
    const kind = query.get("kind");
    const page = Number(query.get("page") ?? 1);
    if ((kind !== "banks" && kind !== "configs" && kind !== "mappings") || !Number.isInteger(page) || page < 1) return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
    return NextResponse.json({ success: true, data: await listVirtualBank(kind, page) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return toBffErrorResponse(error); }
}

export async function POST(request: Request) {
  try {
    assertHeadOffice(await requireSessionUser());
    if (new URL(request.url).searchParams.get("kind") === "config") {
      const form = await request.formData();
      const raw = form.get("payload");
      if (typeof raw !== "string") return NextResponse.json({ success: false, message: "Invalid configuration" }, { status: 422 });
      let input: unknown;
      try { input = JSON.parse(raw); } catch { return NextResponse.json({ success: false, message: "Invalid configuration" }, { status: 422 }); }
      const parsed = configSchema.safeParse(input);
      const image = form.get("qr_image");
      if (!parsed.success || (image != null && (!(image instanceof File) || !["image/png", "image/jpeg", "image/webp"].includes(image.type) || image.size === 0 || image.size > 2 * 1024 * 1024))) return NextResponse.json({ success: false, message: "Invalid configuration or QR image" }, { status: 422 });
      if (image && [parsed.data.branch_code, parsed.data.ifsc_code, parsed.data.account_no, parsed.data.cif_no, parsed.data.tender_id, parsed.data.maker_id, parsed.data.checker_id, parsed.data.client_id, parsed.data.upi_id].some((value) => value === null || value === "")) return NextResponse.json({ success: false, message: "QR upload requires a documented multipart representation for null and empty fields." }, { status: 422 });
      if (image && (parsed.data.remove_qr || [parsed.data.hex_key, parsed.data.hex_iv_key, parsed.data.secret_id, parsed.data.config_name, parsed.data.purpose_cd, parsed.data.max_amount].some((value) => value === null))) return NextResponse.json({ success: false, message: "Save cleared values separately from the QR upload." }, { status: 422 });
      const { id, ...body } = parsed.data;
      const data = await saveVirtualConfig(id, body, image instanceof File ? image : null);
      return NextResponse.json({ success: true, data: data == null ? null : { saved: true } }, { status: id ? 200 : 201 });
    }
    const parsed = mappingSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, message: "Invalid mapping" }, { status: 422 });
    return NextResponse.json({ success: true, data: await saveVirtualMapping(parsed.data) });
  } catch (error) { return toBffErrorResponse(error); }
}
