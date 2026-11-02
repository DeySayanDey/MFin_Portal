export type MemberStatus = 1 | 2 | 3 | 4 | 5;

export type MemberNomineeRecord = {
  memberNomineeId: number;
  nomineeName: string;
  nomineeRelCd: number;
  relationDesc: string;
  nomineeDob: string | null;
  nomineeAge: number | null;
  isMinor: boolean;
  nomineeMobile: string | null;
  sharePercent: number | null;
  sortOrder: number;
  isActive: boolean;
};

export type MemberNominee = {
  nomineeId: number | null;
  name: string;
  relationCd: number | null;
  relationDesc: string | null;
  dob: string | null;
  mobile: string | null;
  sharePercent: number | null;
};

export type MemberNomineeInput = {
  name: string;
  relationCd: number;
  dob: string | null;
  mobile: string | null;
  sharePercent: number | null;
};

export type Member = {
  memberId: number;
  memberCode: number | string;
  refCode: string | null;
  memberName: string;
  fatherName: string | null;
  motherName: string | null;
  spouseName: string | null;
  genderCd: number;
  genderDesc: string | null;
  dateOfBirth: string;
  age: number;
  maritalStatusCd: number | null;
  maritalStatusDesc: string | null;
  religionCd: number | null;
  religionDesc: string | null;
  casteCd: number | null;
  casteDesc: string | null;
  mobileNo: string;
  alternateMobileNo: string | null;
  emailId: string | null;
  panNo: string | null;
  branchId: number;
  branchCode: string | null;
  branchName: string;
  centerId: number | null;
  centerName: string | null;
  groupId: number | null;
  groupCode: number | string | null;
  groupName: string | null;
  memberRole: string | null;
  joiningDate: string | null;
  occupationDetails: string | null;
  monthlyIncome: number | null;
  monthlyExpense: number | null;
  bankName: string | null;
  bankBranch: string | null;
  bankAccountNo: string | null;
  ifscCode: string | null;
  nomineeName: string | null;
  nomineeRelation: string | null;
  nomineeDob: string | null;
  nomineeMobile: string | null;
  nominees: MemberNominee[];
  photoPath: string | null;
  signaturePath: string | null;
  foId: number | null;
  foCode: string | null;
  foName: string | null;
  admFees: number | null;
  admFeeVoucherNo: string | null;
  remarks: string | null;
  kycCount: number;
  kycVerifiedCount: number;
  statusCd: MemberStatus;
  statusDesc: string;
  isActive: boolean;
  createdBy: number | string | null;
  createdAt: string | null;
  updatedBy: number | string | null;
  updatedAt: string | null;
};

export type MemberListQuery = {
  page?: number;
  perPage?: number;
  memberId?: number;
  branchId?: number;
  centerId?: number;
  groupId?: number;
  foId?: number;
  genderCd?: number;
  statusCd?: MemberStatus;
  keyword?: string;
};

export type MemberListResult = {
  items: Member[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    lastPage: number;
    hasMore: boolean;
  };
};

export type MemberSaveInput = {
  memberId?: number;
  memberName: string;
  genderCd: number;
  dateOfBirth: string;
  mobileNo: string;
  branchId: number;
  refCode?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  spouseName?: string | null;
  maritalStatusCd?: number | null;
  religionCd?: number | null;
  casteCd?: number | null;
  alternateMobileNo?: string | null;
  emailId?: string | null;
  panNo?: string | null;
  centerId?: number | null;
  joiningDate?: string | null;
  occupationDetails?: string | null;
  monthlyIncome?: number | null;
  monthlyExpense?: number | null;
  bankName?: string | null;
  bankBranch?: string | null;
  bankAccountNo?: string | null;
  ifscCode?: string | null;
  nomineeName?: string | null;
  nomineeRelation?: string | null;
  nomineeDob?: string | null;
  nomineeMobile?: string | null;
  nominees?: MemberNomineeInput[];
  photoPath?: string | null;
  signaturePath?: string | null;
  foId?: number | null;
  admFees?: number | null;
  remarks?: string | null;
  statusCd?: 1 | 2;
  isActive?: boolean;
};

export type MemberFilterValues = {
  keyword: string;
  branchId: string;
  centerId: string;
  groupId: string;
  foId: string;
  genderCd: string;
  statusCd: string;
};

export type MemberTabCounts = {
  all: number;
  active: number;
  inactive: number;
  suspended: number;
  closed: number;
  death: number;
};
