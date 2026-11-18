import { resolveBranchFilter as scopedBranch } from "@/lib/auth/bff-scope";
import { NextResponse } from "next/server";
import { listGroups } from "@/features/onboarding/group-management/services/group.service";
import {
  changeGroupKycStatus,
  listGroupKyc,
  saveGroupKyc,
  verifyGroupKyc,
} from "@/features/onboarding/group-kyc/services/group-kyc.service";
import {
  GROUP_DOC_TYPES,
  groupKycNumberError,
  normalizeGroupKycNo,
} from "@/features/onboarding/group-kyc/lib/group-kyc-rules";
import type { KycVerifyStatus } from "@/features/onboarding/group-kyc/types/group-kyc.types";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { ApiError } from "@/lib/api/errors";
import { requireSessionUser, resolveBranchFilter } from "@/lib/auth/bff-scope";

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const SAFE_PATH = /^group-kyc\/\d+\/[0-9a-f-]{36}\.(jpg|png|pdf)$/;

function optionalNumber(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionalDate(value: unknown): string | null {
  return typeof value === "string" && YMD.test(value) ? value : null;
}

function optionalPath(value: unknown, groupId: number): string | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const path = value.trim();
  if (!SAFE_PATH.test(path) || Number(path.split("/")[1]) !== groupId) {
    throw new ApiError({ message: "Invalid document image", status: 422, code: "VALIDATION" });
  }
  return path;
}

function validation(message: string): ApiError {
  return new ApiError({ message, status: 422, code: "VALIDATION" });
}

function forbidden(): ApiError {
  return new ApiError({ message: "Forbidden", status: 403, code: "FORBIDDEN" });
}

async function assertGroupBranch(groupId: number, branchId: number | undefined) {
  if (branchId == null) return;
  const result = await listGroups({ groupId, branchId, perPage: 1, page: 1 });
  if (!result.items.some((group) => group.groupId === groupId)) throw forbidden();
}

async function assertDocumentBranch(groupKycId: number, branchId: number | undefined) {
  if (branchId == null) return;
  const current = await listGroupKyc({ groupKycId, branchId, perPage: 1 });
  if (current.items.length === 0) throw forbidden();
}

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const params = new URL(request.url).searchParams;
    const active = params.get("is_active");
    const verify = optionalNumber(params.get("verify_status"));
    const result = await listGroupKyc({
      page: optionalNumber(params.get("page")),
      perPage: optionalNumber(params.get("per_page")),
      groupKycId: optionalNumber(params.get("group_kyc_id")),
      groupId: optionalNumber(params.get("group_id")),
      branchId: resolveBranchFilter(user, optionalNumber(params.get("branch_id"))),
      docTypeCd: optionalNumber(params.get("doc_type_cd")),
      verifyStatus: verify === 0 || verify === 1 || verify === 2 ? verify : undefined,
      isActive: active == null || active === "" ? undefined : active === "1" || active === "true",
    });
    return NextResponse.json({
      success: true,
      message: "Group KYC documents retrieved successfully",
      data: result,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? "");
    const branchId = scopedBranch(user, undefined);

    if (action === "save") {
      const groupId = optionalNumber(body.groupId);
      const groupKycId = optionalNumber(body.groupKycId);
      const docTypeCd = optionalNumber(body.docTypeCd);
      if (!groupId) throw validation("Group is required");
      if (!docTypeCd || !(GROUP_DOC_TYPES as readonly number[]).includes(docTypeCd)) {
        throw validation("Invalid document type");
      }
      const rawNo = typeof body.kycNo === "string" ? body.kycNo : "";
      const numberError = groupKycNumberError(docTypeCd, rawNo);
      if (numberError === "required") throw validation("Document number is required");
      if (numberError === "format") throw validation("Document number format is not valid");
      await assertGroupBranch(groupId, branchId);
      if (groupKycId) await assertDocumentBranch(groupKycId, branchId);
      const saved = await saveGroupKyc({
        groupKycId,
        groupId,
        docTypeCd,
        kycNo: normalizeGroupKycNo(docTypeCd, rawNo),
        issueDate: optionalDate(body.issueDate),
        expiryDate: optionalDate(body.expiryDate),
        photoPath: optionalPath(body.photoPath, groupId),
        backPhotoPath: optionalPath(body.backPhotoPath, groupId),
      });
      return NextResponse.json(
        { success: true, message: saved.message, data: saved.item },
        { status: groupKycId ? 200 : 201 },
      );
    }

    if (action === "verify") {
      const groupKycId = optionalNumber(body.groupKycId);
      const verifyStatus = optionalNumber(body.verifyStatus);
      if (!groupKycId || (verifyStatus !== 0 && verifyStatus !== 1 && verifyStatus !== 2)) {
        throw validation("Document and verification status are required");
      }
      const remarks = typeof body.remarks === "string" ? body.remarks.trim().slice(0, 200) : "";
      if (verifyStatus !== 1 && !remarks) throw validation("A reason is required");
      await assertDocumentBranch(groupKycId, branchId);
      const saved = await verifyGroupKyc({
        groupKycId,
        verifyStatus: verifyStatus as KycVerifyStatus,
        remarks: remarks || undefined,
      });
      return NextResponse.json({ success: true, message: saved.message, data: saved.item });
    }

    if (action === "status") {
      const groupKycId = optionalNumber(body.groupKycId);
      if (!groupKycId || typeof body.isActive !== "boolean") {
        throw validation("Document and status are required");
      }
      await assertDocumentBranch(groupKycId, branchId);
      const saved = await changeGroupKycStatus({ groupKycId, isActive: body.isActive });
      return NextResponse.json({ success: true, message: saved.message, data: saved.item });
    }

    throw validation("Unknown action");
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
