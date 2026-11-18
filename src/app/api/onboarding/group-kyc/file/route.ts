import { resolveBranchFilter as scopedBranch } from "@/lib/auth/bff-scope";
import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { listGroups } from "@/features/onboarding/group-management/services/group.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { ApiError } from "@/lib/api/errors";
import { requireSessionUser } from "@/lib/auth/bff-scope";

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};
const SAFE_PATH = /^group-kyc\/\d+\/[0-9a-f-]{36}\.(jpg|png|pdf)$/;

function storagePath(relative: string): string {
  const root = path.join(process.cwd(), "storage");
  const full = path.resolve(root, relative);
  if (!full.startsWith(path.resolve(root) + path.sep)) {
    throw new ApiError({ message: "Invalid file", status: 422, code: "VALIDATION" });
  }
  return full;
}

async function assertGroup(groupId: number, branchId: number | undefined) {
  if (branchId == null) return;
  const result = await listGroups({ groupId, branchId, perPage: 1, page: 1 });
  if (!result.items.some((group) => group.groupId === groupId)) {
    throw new ApiError({ message: "Forbidden", status: 403, code: "FORBIDDEN" });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const form = await request.formData();
    const groupId = Number(form.get("group_id"));
    const file = form.get("file");
    if (!Number.isFinite(groupId) || groupId <= 0 || !(file instanceof File)) {
      throw new ApiError({ message: "Group and image are required", status: 422, code: "VALIDATION" });
    }
    await assertGroup(groupId, scopedBranch(user, undefined));
    const extension = TYPES[file.type];
    if (!extension) {
      throw new ApiError({ message: "Use a JPG, PNG, or PDF", status: 422, code: "VALIDATION" });
    }
    if (file.size <= 0 || file.size > MAX_BYTES) {
      throw new ApiError({ message: "Image must be 2 MB or smaller", status: 422, code: "VALIDATION" });
    }
    const relative = `group-kyc/${groupId}/${randomUUID()}.${extension}`;
    const full = storagePath(relative);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ success: true, message: "Image uploaded", data: { path: relative } });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const relative = new URL(request.url).searchParams.get("path") ?? "";
    if (!SAFE_PATH.test(relative)) {
      throw new ApiError({ message: "Invalid file", status: 404, code: "NOT_FOUND" });
    }
    await assertGroup(Number(relative.split("/")[1]), scopedBranch(user, undefined));
    const bytes = await readFile(storagePath(relative));
    const extension = relative.split(".").pop();
    const type = extension === "png" ? "image/png" : extension === "pdf" ? "application/pdf" : "image/jpeg";
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
