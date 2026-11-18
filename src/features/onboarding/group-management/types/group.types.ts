export type GroupStatus = 1 | 2 | 3 | 4;

export type Group = {
  groupId: number;
  groupCode: number | string;
  refCode: string | null;
  groupName: string;
  branchId: number;
  branchCode: string | null;
  branchName: string;
  centerId: number | null;
  centerName: string | null;
  formationDate: string | null;
  registrationNo: string | null;
  registrationDate: string | null;
  memberNo: number | null;
  activeMembers: number;
  groupTypeCd: number;
  groupTypeDesc: string;
  groupGenderCd: number | null;
  groupGenderDesc: string | null;
  meetingFrequencyCd: number | null;
  meetingFrequencyDesc: string | null;
  meetingDayCd: number | null;
  meetingDayDesc: string | null;
  meetingTime: string | null;
  villageName: string | null;
  gpName: string | null;
  blockName: string | null;
  districtName: string | null;
  stateCd: number | null;
  stateName: string | null;
  pinCode: string | null;
  presidentMemberId: number | null;
  presidentName: string | null;
  secretaryMemberId: number | null;
  secretaryName: string | null;
  treasurerMemberId: number | null;
  treasurerName: string | null;
  bankName: string | null;
  bankBranch: string | null;
  bankAccountNo: string | null;
  ifscCode: string | null;
  savingsAmount: number | null;
  internalLending: boolean;
  grade: string | null;
  gradeDate: string | null;
  foId: number | null;
  foCode: string | null;
  foName: string | null;
  admFees: number | null;
  remarks: string | null;
  statusCd: GroupStatus;
  statusDesc: string;
  isActive: boolean;
  createdBy: number | string | null;
  createdAt: string | null;
  updatedBy: number | string | null;
  updatedAt: string | null;
};

export type GroupListQuery = {
  page?: number;
  perPage?: number;
  groupId?: number;
  branchId?: number;
  centerId?: number;
  foId?: number;
  groupTypeCd?: number;
  statusCd?: GroupStatus;
  keyword?: string;
};

export type GroupListResult = {
  items: Group[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    lastPage: number;
    hasMore: boolean;
  };
};

export type GroupSaveInput = {
  groupId?: number;
  groupName: string;
  branchId: number;
  groupTypeCd: number;
  refCode?: string | null;
  centerId?: number | null;
  formationDate?: string | null;
  registrationNo?: string | null;
  registrationDate?: string | null;
  memberNo?: number | null;
  groupGenderCd?: number | null;
  meetingFrequencyCd?: number | null;
  meetingDayCd?: number | null;
  meetingTime?: string | null;
  villageName?: string | null;
  gpName?: string | null;
  blockName?: string | null;
  districtName?: string | null;
  stateCd?: number | null;
  pinCode?: string | null;
  bankName?: string | null;
  bankBranch?: string | null;
  bankAccountNo?: string | null;
  ifscCode?: string | null;
  savingsAmount?: number | null;
  internalLending?: boolean;
  grade?: string | null;
  gradeDate?: string | null;
  foId?: number | null;
  admFees?: number | null;
  remarks?: string | null;
  statusCd?: 1 | 2;
  isActive?: boolean;
  presidentMemberId?: number | null;
  secretaryMemberId?: number | null;
  treasurerMemberId?: number | null;
};

export type GroupFilterValues = {
  keyword: string;
  branchId: string;
  centerId: string;
  groupTypeCd: string;
  foId: string;
  statusCd: string;
};

export type GroupTabCounts = {
  all: number;
  active: number;
  inactive: number;
  suspended: number;
  closed: number;
};
