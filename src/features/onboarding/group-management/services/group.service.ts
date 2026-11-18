import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import type { LaravelResponse } from "@/types/api";
import type {
  Group,
  GroupListQuery,
  GroupListResult,
  GroupSaveInput,
  GroupStatus,
} from "@/features/onboarding/group-management/types/group.types";

type RawGroup = Record<string, unknown>;

function getField(row: RawGroup, ...aliases: string[]): unknown {
  if (!row || typeof row !== "object") return undefined;
  for (const a of aliases) {
    if (row[a] !== undefined && row[a] !== null) return row[a];
  }
  const targets = new Set(aliases.map((a) => a.toLowerCase().replace(/_/g, "")));
  for (const [k, v] of Object.entries(row)) {
    if (v !== undefined && v !== null) {
      if (targets.has(k.toLowerCase().replace(/_/g, ""))) return v;
    }
  }
  return undefined;
}

function text(row: RawGroup, ...keys: string[]): string | null {
  const value = getField(row, ...keys);
  if (value == null) return null;
  if (typeof value === "string") return value.trim() !== "" ? value.trim() : null;
  if (typeof value === "number") return String(value);
  return null;
}

function numberValue(row: RawGroup, ...keys: string[]): number | null {
  const value = getField(row, ...keys);
  if (value == null) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function bool(row: RawGroup, ...keys: string[]): boolean {
  const value = getField(row, ...keys);
  return value === true || value === 1 || value === "1" || value === "true";
}

function mapGroup(row: unknown): Group | null {
  if (!row || typeof row !== "object") return null;
  const raw = row as RawGroup;
  const groupId = numberValue(raw, "group_id", "groupId", "Group_Id");
  const branchId = numberValue(raw, "branch_id", "branchId", "Branch_Id");
  const groupName = text(raw, "group_name", "groupName", "Group_Name");
  if (groupId == null || branchId == null || !groupName) return null;

  return {
    groupId,
    groupCode: (getField(raw, "group_code", "groupCode", "Group_Code") ?? groupId) as number | string,
    refCode: text(raw, "ref_code", "refCode", "Ref_Code"),
    groupName,
    branchId,
    branchCode: text(raw, "branch_code", "branchCode", "Branch_Code"),
    branchName: text(raw, "branch_name", "branchName", "Branch_Name") ?? "—",
    centerId: numberValue(raw, "center_id", "centerId", "Center_Id"),
    centerName: text(raw, "center_name", "centerName", "Center_Name"),
    formationDate: text(raw, "formation_date", "formationDate", "Formation_Date"),
    registrationNo: text(raw, "registration_no", "registrationNo", "Registration_No"),
    registrationDate: text(raw, "registration_date", "registrationDate", "Registration_Date"),
    memberNo: numberValue(raw, "member_no", "memberNo", "Member_No"),
    activeMembers: numberValue(raw, "active_members", "activeMembers", "Active_Members") ?? 0,
    groupTypeCd: numberValue(raw, "group_type_cd", "groupTypeCd", "Group_Type_Cd") ?? 1,
    groupTypeDesc: text(raw, "group_type_desc", "groupTypeDesc", "Group_Type_Desc") ?? "SHG",
    groupGenderCd: numberValue(raw, "group_gender_cd", "groupGenderCd", "Group_Gender_Cd"),
    groupGenderDesc: text(raw, "group_gender_desc", "groupGenderDesc", "Group_Gender_Desc"),
    meetingFrequencyCd: numberValue(raw, "meeting_frequency_cd", "meetingFrequencyCd", "Meeting_Frequency_Cd"),
    meetingFrequencyDesc: text(raw, "meeting_frequency_desc", "meetingFrequencyDesc", "Meeting_Frequency_Desc"),
    meetingDayCd: numberValue(raw, "meeting_day_cd", "meetingDayCd", "Meeting_Day_Cd"),
    meetingDayDesc: text(raw, "meeting_day_desc", "meetingDayDesc", "Meeting_Day_Desc"),
    meetingTime: text(raw, "meeting_time", "meetingTime", "Meeting_Time"),
    villageName: text(raw, "village_name", "villageName", "Village_Name"),
    gpName: text(raw, "gp_name", "gpName", "Gp_Name"),
    blockName: text(raw, "block_name", "blockName", "Block_Name"),
    districtName: text(raw, "district_name", "districtName", "District_Name"),
    stateCd: numberValue(raw, "state_cd", "stateCd", "State_Cd"),
    stateName: text(raw, "state_name", "stateName", "State_Name"),
    pinCode: text(raw, "pin_code", "pinCode", "Pin_Code"),
    presidentMemberId: numberValue(raw, "president_member_id", "presidentMemberId", "President_Member_Id"),
    presidentName: text(raw, "president_name", "presidentName", "President_Name"),
    secretaryMemberId: numberValue(raw, "secretary_member_id", "secretaryMemberId", "Secretary_Member_Id"),
    secretaryName: text(raw, "secretary_name", "secretaryName", "Secretary_Name"),
    treasurerMemberId: numberValue(raw, "treasurer_member_id", "treasurerMemberId", "Treasurer_Member_Id"),
    treasurerName: text(raw, "treasurer_name", "treasurerName", "Treasurer_Name"),
    bankName: text(raw, "bank_name", "bankName", "Bank_Name"),
    bankBranch: text(raw, "bank_branch", "bankBranch", "Bank_Branch"),
    bankAccountNo: text(raw, "bank_account_no", "bankAccountNo", "Bank_Account_No"),
    ifscCode: text(raw, "ifsc_code", "ifscCode", "Ifsc_Code"),
    savingsAmount: numberValue(raw, "savings_amount", "savingsAmount", "Savings_Amount"),
    internalLending: bool(raw, "internal_lending", "internalLending", "Internal_Lending"),
    grade: text(raw, "grade", "Grade"),
    gradeDate: text(raw, "grade_date", "gradeDate", "Grade_Date"),
    foId: numberValue(raw, "fo_id", "foId", "Fo_Id"),
    foCode: text(raw, "fo_code", "foCode", "Fo_Code"),
    foName: text(raw, "fo_name", "foName", "Fo_Name"),
    admFees: numberValue(raw, "adm_fees", "admFees", "Adm_Fees"),
    remarks: text(raw, "remarks", "Remarks"),
    statusCd: (numberValue(raw, "status_cd", "statusCd", "Status_Cd") ?? 1) as GroupStatus,
    statusDesc: text(raw, "status_desc", "statusDesc", "Status_Desc") ?? "Active",
    isActive: bool(raw, "is_active", "isActive", "Is_Active"),
    createdBy: (getField(raw, "created_by", "createdBy", "Created_By") as number | string | null) ?? null,
    createdAt: text(raw, "created_at", "createdAt", "Created_At"),
    updatedBy: (getField(raw, "updated_by", "updatedBy", "Updated_By") as number | string | null) ?? null,
    updatedAt: text(raw, "updated_at", "updatedAt", "Updated_At"),
  };
}

async function token(): Promise<string> {
  const value = await getAccessToken();
  if (!value) throw new ApiError({ message: "Unauthorized", status: 401, code: "UNAUTHORIZED" });
  return value;
}

async function run<T>(callback: (accessToken: string) => Promise<T>): Promise<T> {
  try {
    return await callback(await token());
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) await clearAuthSession();
    throw error;
  }
}

export async function listGroups(query: GroupListQuery = {}): Promise<GroupListResult> {
  return run(async (accessToken) => {
    const payload = await api.get<LaravelResponse<RawGroup[]>>(endpoints.group.list, {
      accessToken,
      expectEnvelope: false,
      searchParams: {
        page: query.page ?? 1,
        per_page: query.perPage ?? 50,
        group_id: query.groupId,
        keyword: query.keyword,
        branch_id: query.branchId,
        center_id: query.centerId,
        fo_id: query.foId,
        group_type_cd: query.groupTypeCd,
        status_cd: query.statusCd,
      },
    });
    const items = Array.isArray(payload?.data)
      ? payload.data.flatMap((row) => {
          const group = mapGroup(row);
          return group ? [group] : [];
        })
      : [];
    const rawMeta = payload?.success === true ? payload.meta : undefined;
    const total = numberValue(rawMeta ?? {}, "total") ?? items.length;
    const page = numberValue(rawMeta ?? {}, "page") ?? query.page ?? 1;
    const perPage = numberValue(rawMeta ?? {}, "per_page", "perPage") ?? query.perPage ?? 50;
    return {
      items,
      meta: {
        total,
        page,
        perPage,
        lastPage: numberValue(rawMeta ?? {}, "last_page", "lastPage") ?? Math.max(1, Math.ceil(total / perPage)),
        hasMore: bool(rawMeta ?? {}, "has_more", "hasMore"),
      },
    };
  });
}

export async function saveGroup(input: GroupSaveInput): Promise<Group | null> {
  return run(async (accessToken) => {
    const { groupId, ...body } = input;
    const isEdit = groupId != null;

    const baseRequestBody: Record<string, unknown> = {
      group_name: body.groupName,
      Group_Name: body.groupName,
      branch_id: body.branchId,
      Branch_Id: body.branchId,
      group_type_cd: body.groupTypeCd,
      Group_Type_Cd: body.groupTypeCd,
      ref_code: body.refCode ?? null,
      Ref_Code: body.refCode ?? null,
      center_id: body.centerId ?? null,
      Center_Id: body.centerId ?? null,
      formation_date: body.formationDate ?? null,
      Formation_Date: body.formationDate ?? null,
      registration_no: body.registrationNo ?? null,
      Registration_No: body.registrationNo ?? null,
      registration_date: body.registrationDate ?? null,
      Registration_Date: body.registrationDate ?? null,
      member_no: body.memberNo ?? null,
      Member_No: body.memberNo ?? null,
      group_gender_cd: body.groupGenderCd ?? null,
      Group_Gender_Cd: body.groupGenderCd ?? null,
      meeting_frequency_cd: body.meetingFrequencyCd ?? null,
      Meeting_Frequency_Cd: body.meetingFrequencyCd ?? null,
      meeting_day_cd: body.meetingDayCd ?? null,
      Meeting_Day_Cd: body.meetingDayCd ?? null,
      meeting_time: body.meetingTime ?? null,
      Meeting_Time: body.meetingTime ?? null,
      village_name: body.villageName ?? null,
      Village_Name: body.villageName ?? null,
      gp_name: body.gpName ?? null,
      Gp_Name: body.gpName ?? null,
      block_name: body.blockName ?? null,
      Block_Name: body.blockName ?? null,
      district_name: body.districtName ?? null,
      District_Name: body.districtName ?? null,
      state_cd: body.stateCd ?? null,
      State_Cd: body.stateCd ?? null,
      pin_code: body.pinCode ?? null,
      Pin_Code: body.pinCode ?? null,
      fo_id: body.foId ?? null,
      Fo_Id: body.foId ?? null,
      bank_name: body.bankName ?? null,
      Bank_Name: body.bankName ?? null,
      bank_branch: body.bankBranch ?? null,
      Bank_Branch: body.bankBranch ?? null,
      bank_account_no: body.bankAccountNo ?? null,
      Bank_Account_No: body.bankAccountNo ?? null,
      ifsc_code: body.ifscCode ? body.ifscCode.toUpperCase() : null,
      Ifsc_Code: body.ifscCode ? body.ifscCode.toUpperCase() : null,
      savings_amount: body.savingsAmount ?? null,
      Savings_Amount: body.savingsAmount ?? null,
      internal_lending: Boolean(body.internalLending),
      Internal_Lending: Boolean(body.internalLending),
      grade: body.grade ? body.grade.toUpperCase() : null,
      Grade: body.grade ? body.grade.toUpperCase() : null,
      grade_date: body.gradeDate ?? null,
      Grade_Date: body.gradeDate ?? null,
      adm_fees: body.admFees ?? null,
      Adm_Fees: body.admFees ?? null,
      remarks: body.remarks ?? null,
      Remarks: body.remarks ?? null,
    };

    if (isEdit) {
      // Edit allows president/secretary/treasurer and requires group_id
      const editBody = {
        group_id: groupId,
        Group_Id: groupId,
        ...baseRequestBody,
        president_member_id: body.presidentMemberId ?? null,
        President_Member_Id: body.presidentMemberId ?? null,
        secretary_member_id: body.secretaryMemberId ?? null,
        Secretary_Member_Id: body.secretaryMemberId ?? null,
        treasurer_member_id: body.treasurerMemberId ?? null,
        Treasurer_Member_Id: body.treasurerMemberId ?? null,
      };
      const data = await api.post<RawGroup>(endpoints.group.edit, editBody, {
        accessToken,
        expectEnvelope: true,
      });
      return mapGroup(data);
    } else {
      // Add: president/secretary/treasurer not allowed. Status allowed (1 active or 2 inactive).
      const addBody = {
        ...baseRequestBody,
        ...(body.statusCd != null ? { status_cd: body.statusCd, Status_Cd: body.statusCd } : {}),
        ...(body.isActive != null ? { is_active: body.isActive, Is_Active: body.isActive } : {}),
      };
      const data = await api.post<RawGroup>(endpoints.group.add, addBody, {
        accessToken,
        expectEnvelope: true,
      });
      return mapGroup(data);
    }
  });
}

export async function changeGroupStatus(groupId: number, statusCd: GroupStatus): Promise<Group | null> {
  return run(async (accessToken) => {
    const data = await api.post<RawGroup>(
      endpoints.group.status,
      {
        group_id: groupId,
        Group_Id: groupId,
        status_cd: statusCd,
        Status_Cd: statusCd,
      },
      { accessToken, expectEnvelope: true },
    );
    return mapGroup(data);
  });
}
