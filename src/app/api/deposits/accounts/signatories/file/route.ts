import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { listDepositAccounts } from "@/features/deposits/savings/services/deposit-account.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { ApiError } from "@/lib/api/errors";
import { requireSessionUser, resolveBranchFilter } from "@/lib/auth/bff-scope";

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
};
const SAFE_PATH = /^specimen\/\d+\/[0-9a-f-]{36}\.(jpg|png)$/;

function storagePath(relative: string): string {
  const root = path.join(process.cwd(), "storage");
  const full = path.resolve(root, relative);
  if (!full.startsWith(path.resolve(root) + path.sep)) {
    throw new ApiError({ message: "Invalid file", status: 422, code: "VALIDATION" });
  }
  return full;
}

async function assertAccount(accountId: number, branchId: number | undefined) {
  const result = await listDepositAccounts({
    accountId,
    branchId,
    page: 1,
    perPage: 1,
  });
  if (!result.items.some((account) => account.accountId === accountId)) {
    throw new ApiError({ message: "Forbidden", status: 403, code: "FORBIDDEN" });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const form = await request.formData();
    const accountId = Number(form.get("account_id"));
    const file = form.get("file");
    if (!Number.isInteger(accountId) || accountId <= 0 || !(file instanceof File)) {
      throw new ApiError({
        message: "Account and image are required",
        status: 422,
        code: "VALIDATION",
      });
    }
    await assertAccount(accountId, resolveBranchFilter(user, undefined));
    const extension = TYPES[file.type];
    if (!extension) {
      throw new ApiError({
        message: "Use a JPG or PNG image",
        status: 422,
        code: "VALIDATION",
      });
    }
    if (file.size <= 0 || file.size > MAX_BYTES) {
      throw new ApiError({
        message: "Image must be 2 MB or smaller",
        status: 422,
        code: "VALIDATION",
      });
    }
    const relative = `specimen/${accountId}/${randomUUID()}.${extension}`;
    if (relative.length > 75) {
      throw new ApiError({ message: "Invalid file", status: 422, code: "VALIDATION" });
    }
    const full = storagePath(relative);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({
      success: true,
      message: "Image uploaded",
      data: { path: relative },
    });
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
    const accountId = Number(relative.split("/")[1]);
    await assertAccount(accountId, resolveBranchFilter(user, undefined));
    const bytes = await readFile(storagePath(relative));
    const type = relative.endsWith(".png") ? "image/png" : "image/jpeg";
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
