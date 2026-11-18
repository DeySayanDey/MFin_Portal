export type MemberRole = "Member" | "President" | "Secretary" | "Treasurer";

/** Current global minimum (settings id 3) until a settings API is available. */
export const MIN_GROUP_MEMBERS = 4;
/** Current global maximum (settings id 4). A group's own member count overrides this. */
export const MAX_GROUP_MEMBERS = 10;

export type GroupMembership = {
  memGroupId: number;
  memberId: number;
  memberCode: number | string | null;
  memberRefCode: string | null;
  memberName: string;
  genderCd: number | null;
  genderDesc: string | null;
  mobileNo: string | null;
  memberStatusCd: number | null;
  memberStatusDesc: string | null;
  groupId: number;
  groupCode: number | string | null;
  groupRefCode: string | null;
  groupName: string;
  groupTypeCd: number | null;
  groupTypeDesc: string | null;
  groupStatusCd: number | null;
  groupStatusDesc: string | null;
  branchId: number | null;
  branchCode: string | null;
  branchName: string | null;
  centerId: number | null;
  centerName: string | null;
  foId: number | null;
  foCode: string | null;
  foName: string | null;
  memberRole: string;
  joinDate: string | null;
  exitDate: string | null;
  exitReason: string | null;
  isActive: boolean;
  createdBy: number | string | null;
  createdByName: string | null;
  createdAt: string | null;
  updatedBy: number | string | null;
  updatedAt: string | null;
};

export type MembershipListQuery = {
  page?: number;
  perPage?: number;
  memGroupId?: number;
  memberId?: number;
  groupId?: number;
  branchId?: number;
  centerId?: number;
  memberRole?: string;
  isActive?: boolean;
  keyword?: string;
};

export type MembershipListResult = {
  items: GroupMembership[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    lastPage: number;
    hasMore: boolean;
  };
};

export type MemberGroupCheck = {
  memberId: number;
  memberName: string;
  memberStatusCd: number | null;
  memGroupId: number | null;
  groupId: number | null;
  groupName: string | null;
  memberRole: string | null;
  joinDate: string | null;
  activeLoanCount: number;
  canChange: boolean;
  message: string;
};

export type AssignMemberInput = {
  memberId: number;
  memberRole?: MemberRole;
};

export type AssignInput = {
  groupId: number;
  joinDate?: string;
  members: AssignMemberInput[];
};

export type ReassignInput = {
  memberId: number;
  groupId: number;
  memberRole?: MemberRole;
  transferDate?: string;
  reason?: string;
};

export type EditMembershipInput = {
  memGroupId: number;
  memberRole?: MemberRole | null;
  foId?: number | null;
  joinDate?: string;
};

export type ExitInput = {
  memberId: number;
  reason: string;
  exitDate?: string;
};

export type ReassignResult = {
  previous: GroupMembership | null;
  current: GroupMembership | null;
};
