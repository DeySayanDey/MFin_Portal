import { resolveBranchFilter as scopedBranch } from "@/lib/auth/bff-scope";
import { NextResponse } from "next/server";
import { listMembers } from "@/features/onboarding/member-registration/services/member.service";
import {
  addMemberKyc,
  changeMemberKycStatus,
  editMemberKyc,
  listMemberKyc,
  verifyMemberKyc,
} from "@/features/onboarding/member-kyc/services/member-kyc.service";
import type { KycVerifyStatus } from "@/features/onboarding/member-kyc/types/member-kyc.types";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { ApiError } from "@/lib/api/errors";
import { requireSessionUser, resolveBranchFilter } from "@/lib/auth/bff-scope";

function optionalNumber(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed.slice(0, 300);
}

async function assertMemberBranch(memberId: number, branchId: number | undefined) {
  if (branchId == null) return;
  const result = await listMembers({ memberId, branchId, perPage: 1, page: 1 });
  if (!result.items.some((member) => member.memberId === memberId)) {
    throw new ApiError({ message: "Forbidden", status: 403, code: "FORBIDDEN" });
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const params = new URL(request.url).searchParams;
    const branchId = resolveBranchFilter(user, optionalNumber(params.get("branch_id")));
    const active = params.get("is_active");
    const verify = optionalNumber(params.get("verify_status"));
    const result = await listMemberKyc({
      page: optionalNumber(params.get("page")),
      perPage: optionalNumber(params.get("per_page")),
      memberKycId: optionalNumber(params.get("member_kyc_id")),
      memberId: optionalNumber(params.get("member_id")),
      branchId,
      docTypeCd: optionalNumber(params.get("doc_type_cd")),
      verifyStatus: verify === 0 || verify === 1 || verify === 2 ? verify : undefined,
      isActive: active == null || active === "" ? undefined : active === "1" || active === "true",
      keyword: params.get("keyword")?.trim() || undefined,
    });
    return NextResponse.json({
      success: true,
      message: "Member KYC documents retrieved successfully",
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

    if (action === "add") {
      const memberId = optionalNumber(body.memberId);
      const documents = Array.isArray(body.documents) ? body.documents : [];
      if (!memberId || documents.length === 0) {
        throw new ApiError({ message: "Member and documents are required", status: 422, code: "VALIDATION" });
      }
      await assertMemberBranch(memberId, branchId);
      const saved = await addMemberKyc({
        memberId,
        documents: documents.slice(0, 10).map((item) => {
          const row = item as Record<string, unknown>;
          return {
            docTypeCd: optionalNumber(row.docTypeCd) ?? 0,
            kycNo: typeof row.kycNo === "string" ? row.kycNo : "",
            issueDate: optionalText(row.issueDate),
            expiryDate: optionalText(row.expiryDate),
            photoPath: optionalText(row.photoPath),
            backPhotoPath: optionalText(row.backPhotoPath),
          };
        }),
      });
      return NextResponse.json({ success: true, message: saved.message, data: saved.items }, { status: 201 });
    }

    if (action === "edit") {
      const memberKycId = optionalNumber(body.memberKycId);
      if (!memberKycId) {
        throw new ApiError({ message: "Document is required", status: 422, code: "VALIDATION" });
      }
      if (branchId != null) {
        const current = await listMemberKyc({ memberKycId, branchId, perPage: 1 });
        if (current.items.length === 0) {
          throw new ApiError({ message: "Forbidden", status: 403, code: "FORBIDDEN" });
        }
      }
      const saved = await editMemberKyc({
        memberKycId,
        docTypeCd: optionalNumber(body.docTypeCd),
        kycNo: typeof body.kycNo === "string" ? body.kycNo : undefined,
        ...( "issueDate" in body ? { issueDate: optionalText(body.issueDate) ?? null } : {}),
        ...( "expiryDate" in body ? { expiryDate: optionalText(body.expiryDate) ?? null } : {}),
        ...( "photoPath" in body ? { photoPath: body.photoPath == null ? null : optionalText(body.photoPath) ?? null } : {}),
        ...( "backPhotoPath" in body
          ? { backPhotoPath: body.backPhotoPath == null ? null : optionalText(body.backPhotoPath) ?? null }
          : {}),
      });
      return NextResponse.json({ success: true, message: saved.message, data: saved.item });
    }

    if (action === "verify") {
      const memberKycId = optionalNumber(body.memberKycId);
      const memberKycIds = Array.isArray(body.memberKycIds)
        ? body.memberKycIds.map((id) => Number(id)).filter((id) => Number.isFinite(id)).slice(0, 50)
        : undefined;
      const verifyStatus = optionalNumber(body.verifyStatus);
      if ((!memberKycId && !memberKycIds?.length) || (verifyStatus !== 0 && verifyStatus !== 1 && verifyStatus !== 2)) {
        throw new ApiError({ message: "Document and verification status are required", status: 422, code: "VALIDATION" });
      }
      if (branchId != null && memberKycId) {
        const current = await listMemberKyc({ memberKycId, branchId, perPage: 1 });
        if (current.items.length === 0) {
          throw new ApiError({ message: "Forbidden", status: 403, code: "FORBIDDEN" });
        }
      }
      const saved = await verifyMemberKyc({
        memberKycId,
        memberKycIds,
        verifyStatus: verifyStatus as KycVerifyStatus,
        remarks: typeof body.remarks === "string" ? body.remarks.slice(0, 200) : undefined,
      });
      return NextResponse.json({ success: true, message: saved.message, data: saved.items });
    }

    if (action === "status") {
      const memberKycId = optionalNumber(body.memberKycId);
      if (!memberKycId || typeof body.isActive !== "boolean") {
        throw new ApiError({ message: "Document and status are required", status: 422, code: "VALIDATION" });
      }
      if (branchId != null) {
        const current = await listMemberKyc({ memberKycId, branchId, perPage: 1 });
        if (current.items.length === 0) {
          throw new ApiError({ message: "Forbidden", status: 403, code: "FORBIDDEN" });
        }
      }
      const saved = await changeMemberKycStatus({ memberKycId, isActive: body.isActive });
      return NextResponse.json({ success: true, message: saved.message, data: saved.item });
    }

    throw new ApiError({ message: "Unknown action", status: 422, code: "VALIDATION" });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
