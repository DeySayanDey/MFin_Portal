export type KycVerifyStatus = 0 | 1 | 2;

export type MemberKycDocument = {
  memberKycId: number;
  memberId: number;
  memberCode: number | string | null;
  refCode: string | null;
  memberName: string;
  mobileNo: string | null;
  memberStatusCd: number | null;
  memberStatusDesc: string | null;
  branchId: number | null;
  branchCode: string | null;
  branchName: string | null;
  docTypeCd: number;
  docTypeDesc: string | null;
  kycNo: string;
  kycNoMasked: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  isExpired: boolean;
  verifyStatus: KycVerifyStatus;
  verifyStatusDesc: string | null;
  verifyRemarks: string | null;
  verifiedBy: number | string | null;
  verifiedByName: string | null;
  verifiedAt: string | null;
  photoPath: string | null;
  backPhotoPath: string | null;
  isActive: boolean;
  createdBy: number | string | null;
  createdByName: string | null;
  createdAt: string | null;
  updatedBy: number | string | null;
  updatedAt: string | null;
};

export type MemberKycListQuery = {
  page?: number;
  perPage?: number;
  memberKycId?: number;
  memberId?: number;
  branchId?: number;
  docTypeCd?: number;
  verifyStatus?: KycVerifyStatus;
  isActive?: boolean;
  keyword?: string;
};

export type MemberKycListResult = {
  items: MemberKycDocument[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    lastPage: number;
    hasMore: boolean;
  };
};

export type KycDocumentInput = {
  docTypeCd: number;
  kycNo: string;
  issueDate?: string;
  expiryDate?: string;
  photoPath?: string;
  backPhotoPath?: string;
};

export type KycAddInput = {
  memberId: number;
  documents: KycDocumentInput[];
};

export type KycEditInput = {
  memberKycId: number;
  docTypeCd?: number;
  kycNo?: string;
  issueDate?: string | null;
  expiryDate?: string | null;
  photoPath?: string | null;
  backPhotoPath?: string | null;
};

export type KycVerifyInput = {
  memberKycId?: number;
  memberKycIds?: number[];
  verifyStatus: KycVerifyStatus;
  remarks?: string;
};

export type KycStatusInput = {
  memberKycId: number;
  isActive: boolean;
};
