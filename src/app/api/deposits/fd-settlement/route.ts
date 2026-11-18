import { NextResponse } from "next/server";
import {
  listSettlementRequests,
  saveSettlement,
} from "@/features/deposits/fd-settlement/services/fd-settlement.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { ApiError } from "@/lib/api/errors";
import { requireSessionUser, resolveBranchFilter } from "@/lib/auth/bff-scope";

const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024;
const DOCUMENT_SIGNATURES: Record<string, number[]> = {
  "application/pdf": [0x25, 0x50, 0x44, 0x46],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/jpeg": [0xff, 0xd8, 0xff],
};

function readOptionalNumber(raw: string | null): number | undefined {
  if (raw == null || raw === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function invalidDocument(message: string): ApiError {
  return new ApiError({ message, status: 422, code: "VALIDATION" });
}

async function readDocument(value: FormDataEntryValue | null): Promise<File | null> {
  if (!(value instanceof File) || value.size === 0) return null;
  const signature = DOCUMENT_SIGNATURES[value.type];
  if (!signature) throw invalidDocument("Upload a PDF, JPG, or PNG.");
  if (value.size > MAX_DOCUMENT_BYTES) throw invalidDocument("The file must be 2 MB or smaller.");
  const head = new Uint8Array(await value.slice(0, signature.length).arrayBuffer());
  if (!signature.every((byte, index) => head[index] === byte)) {
    throw invalidDocument("Upload a PDF, JPG, or PNG.");
  }
  return value;
}

function readPayload(raw: FormDataEntryValue | null): unknown {
  if (typeof raw !== "string") throw invalidDocument("Settlement details are required.");
  try {
    return JSON.parse(raw);
  } catch {
    throw invalidDocument("Settlement details are invalid.");
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");
    const result = await listSettlementRequests({
      page: readOptionalNumber(searchParams.get("page")),
      perPage: readOptionalNumber(searchParams.get("per_page")),
      view: view === "settled" ? "settled" : "pending",
      branchId: resolveBranchFilter(user, readOptionalNumber(searchParams.get("branch_id"))),
    });
    return NextResponse.json({ success: true, message: "Settlements retrieved", data: result });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const form = await request.formData();
    const document = await readDocument(form.get("document"));
    const result = await saveSettlement(readPayload(form.get("payload")), document, {
      branchId: resolveBranchFilter(user, undefined),
    });
    return NextResponse.json({ success: true, message: result.message, data: result.item });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
