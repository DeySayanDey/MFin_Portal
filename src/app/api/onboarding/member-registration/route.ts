import { NextResponse } from "next/server";
import {
  changeMemberStatus,
  listMembers,
  saveMember,
} from "@/features/onboarding/member-registration/services/member.service";
import {
  MEMBER_NOMINEE_MAX,
  nomineeListIssue,
  refCodeError,
  type NomineeListIssue,
} from "@/features/onboarding/member-registration/member.constants";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser, resolveBranchFilter } from "@/lib/auth/bff-scope";
import type {
  MemberListQuery,
  MemberNomineeInput,
  MemberSaveInput,
  MemberStatus,
} from "@/features/onboarding/member-registration/types/member.types";

function optionalNumber(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const NOMINEE_ISSUE_MESSAGES: Record<NomineeListIssue, string> = {
  max: `A member can have at most ${MEMBER_NOMINEE_MAX} nominees`,
  invalid: "One or more nominee details are invalid",
  duplicate: "The same nominee is added more than once",
  shareRequired: "Enter a share percentage for every nominee",
  shareTotal: "Nominee shares must total 100%",
};

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** `undefined` when the client did not send a list, so older callers keep the single-nominee fields. */
function parseNominees(value: unknown): MemberNomineeInput[] | undefined | "invalid" {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) return "invalid";
  const result: MemberNomineeInput[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return "invalid";
    const row = item as Record<string, unknown>;
    const share = row.sharePercent ?? row.share_percent;
    result.push({
      name: optionalText(row.name ?? row.nominee_name) ?? "",
      relationCd: Number(row.relationCd ?? row.nominee_rel_cd),
      dob: optionalText(row.dob ?? row.nominee_dob),
      mobile: optionalText(row.mobile ?? row.nominee_mobile),
      sharePercent: share === null || share === undefined || share === "" ? null : Number(share),
    });
  }
  return result;
}

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const params = new URL(request.url).searchParams;
    const requestedBranch = optionalNumber(params.get("branch_id"));
    const query: MemberListQuery = {
      page: optionalNumber(params.get("page")),
      perPage: optionalNumber(params.get("per_page")),
      memberId: optionalNumber(params.get("member_id")),
      keyword: params.get("keyword")?.trim() || undefined,
      branchId: resolveBranchFilter(user, requestedBranch),
      centerId: optionalNumber(params.get("center_id")),
      groupId: optionalNumber(params.get("group_id")),
      foId: optionalNumber(params.get("fo_id")),
      genderCd: optionalNumber(params.get("gender_cd")),
      statusCd: optionalNumber(params.get("status_cd")) as MemberStatus | undefined,
    };
    const result = await listMembers(query, request.signal);
    return NextResponse.json({
      success: true,
      message: "Members retrieved successfully",
      data: result,
      meta: result.meta,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json()) as Record<string, unknown> & {
      action?: "status" | "save";
    };

    if (body.action === "status") {
      const memberId = Number(body.member_id ?? body.memberId);
      const statusCd = Number(body.status_cd ?? body.statusCd) as MemberStatus;
      if (!Number.isFinite(memberId) || ![1, 2, 3, 4, 5].includes(statusCd)) {
        return NextResponse.json({ success: false, message: "Invalid member status request" }, { status: 422 });
      }
      const result = await changeMemberStatus(memberId, statusCd);
      return NextResponse.json({ success: true, message: "Member status updated successfully", data: result });
    }

    const input: Record<string, unknown> = { ...body };
    delete input.action;

    // Normalize field aliases
    const memberId = optionalNumber(String(input.member_id ?? input.memberId ?? input.Member_Id ?? ""));
    const memberName = String(input.member_name ?? input.memberName ?? input.Member_Name ?? "").trim();
    const genderCd = Number(input.gender_cd ?? input.genderCd ?? input.Gender_Cd);
    const dateOfBirth = String(input.date_of_birth ?? input.dateOfBirth ?? input.Date_Of_Birth ?? "").trim();
    const mobileNo = String(input.mobile_no ?? input.mobileNo ?? input.Mobile_No ?? "").trim();
    let branchId = optionalNumber(String(input.branch_id ?? input.branchId ?? input.Branch_Id ?? ""));
    const refCode = String(input.ref_code ?? input.refCode ?? input.Ref_Code ?? "").trim().toUpperCase();

    const refCodeMessage = refCodeError(refCode);
    if (refCodeMessage) {
      return NextResponse.json(
        { success: false, message: refCodeMessage, errors: { ref_code: [refCodeMessage] } },
        { status: 422 },
      );
    }

    const nominees = parseNominees(input.nominees);
    const nomineeIssue =
      nominees === "invalid"
        ? "invalid"
        : nominees
          ? nomineeListIssue(nominees, new Date().toISOString().slice(0, 10))
          : null;
    if (nomineeIssue) {
      const message = NOMINEE_ISSUE_MESSAGES[nomineeIssue];
      return NextResponse.json(
        { success: false, message, errors: { nominees: [message] } },
        { status: 422 },
      );
    }

    if (!user.isHead && !user.isAdmin) {
      branchId = resolveBranchFilter(user, branchId);
    }

    const savePayload: MemberSaveInput = {
      ...(memberId ? { memberId } : {}),
      memberName,
      genderCd,
      dateOfBirth,
      mobileNo,
      branchId: branchId ?? 0,
      refCode: refCode || null,
      fatherName: (input.father_name ?? input.fatherName ?? input.Father_Name ?? null) as string | null,
      motherName: (input.mother_name ?? input.motherName ?? input.Mother_Name ?? null) as string | null,
      spouseName: (input.spouse_name ?? input.spouseName ?? input.Spouse_Name ?? null) as string | null,
      maritalStatusCd: optionalNumber(String(input.marital_status_cd ?? input.maritalStatusCd ?? input.Marital_Status_Cd ?? "")),
      religionCd: optionalNumber(String(input.religion_cd ?? input.religionCd ?? input.Religion_Cd ?? "")),
      casteCd: optionalNumber(String(input.caste_cd ?? input.casteCd ?? input.Caste_Cd ?? "")),
      alternateMobileNo: (input.alternate_mobile_no ?? input.alternateMobileNo ?? input.Alternate_Mobile_No ?? null) as string | null,
      emailId: (input.email_id ?? input.emailId ?? input.Email_Id ?? null) as string | null,
      panNo: (input.pan_no ?? input.panNo ?? input.Pan_No ?? null) as string | null,
      centerId: optionalNumber(String(input.center_id ?? input.centerId ?? input.Center_Id ?? "")),
      joiningDate: (input.joining_date ?? input.joiningDate ?? input.Joining_Date ?? null) as string | null,
      occupationDetails: (input.occupation_details ?? input.occupationDetails ?? input.Occupation_Details ?? null) as string | null,
      monthlyIncome: optionalNumber(String(input.monthly_income ?? input.monthlyIncome ?? input.Monthly_Income ?? "")),
      monthlyExpense: optionalNumber(String(input.monthly_expense ?? input.monthlyExpense ?? input.Monthly_Expense ?? "")),
      bankName: (input.bank_name ?? input.bankName ?? input.Bank_Name ?? null) as string | null,
      bankBranch: (input.bank_branch ?? input.bankBranch ?? input.Bank_Branch ?? null) as string | null,
      bankAccountNo: (input.bank_account_no ?? input.bankAccountNo ?? input.Bank_Account_No ?? null) as string | null,
      ifscCode: (input.ifsc_code ?? input.ifscCode ?? input.Ifsc_Code ?? null) as string | null,
      nomineeName: (input.nominee_name ?? input.nomineeName ?? input.Nominee_Name ?? null) as string | null,
      nomineeRelation: (input.nominee_relation ?? input.nomineeRelation ?? input.Nominee_Relation ?? null) as string | null,
      nomineeDob: (input.nominee_dob ?? input.nomineeDob ?? input.Nominee_Dob ?? null) as string | null,
      nomineeMobile: (input.nominee_mobile ?? input.nomineeMobile ?? input.Nominee_Mobile ?? null) as string | null,
      ...(nominees && nominees !== "invalid" ? { nominees } : {}),
      photoPath: (input.photo_path ?? input.photoPath ?? input.Photo_Path ?? null) as string | null,
      signaturePath: (input.signature_path ?? input.signaturePath ?? input.Signature_Path ?? null) as string | null,
      foId: optionalNumber(String(input.fo_id ?? input.foId ?? input.Fo_Id ?? "")),
      admFees: optionalNumber(String(input.adm_fees ?? input.admFees ?? input.Adm_Fees ?? "")),
      remarks: (input.remarks ?? input.Remarks ?? null) as string | null,
      statusCd: optionalNumber(String(input.status_cd ?? input.statusCd ?? input.Status_Cd ?? "")) as 1 | 2 | undefined,
      isActive: typeof input.is_active === "boolean" ? input.is_active : typeof input.isActive === "boolean" ? input.isActive : undefined,
    };

    const result = await saveMember(savePayload);
    return NextResponse.json({ success: true, message: "Member saved successfully", data: result });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
