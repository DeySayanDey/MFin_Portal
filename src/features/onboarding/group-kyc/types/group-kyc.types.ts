import type { KycVerifyStatus } from "@/features/onboarding/member-kyc/types/member-kyc.types";

export type { KycVerifyStatus };

export type GroupKycDocument = {
  groupKycId: number;
  groupId: number;
  groupCode: string | null;
  groupName: string;
  branchId: number | null;
  branchName: string | null;
  docTypeCd: number;
  docTypeDesc: string | null;
  kycNo: string;
  issueDate: string | null;
  expiryDate: string | null;
  isExpired: boolean;
  verifyStatus: KycVerifyStatus;
  verifyRemarks: string | null;
  verifiedByName: string | null;
  verifiedAt: string | null;
  photoPath: string | null;
  backPhotoPath: string | null;
  isActive: boolean;
  createdByName: string | null;
  createdAt: string | null;
};

export type GroupKycListQuery = {
  page?: number;
  perPage?: number;
  groupKycId?: number;
  groupId?: number;
  branchId?: number;
  docTypeCd?: number;
  verifyStatus?: KycVerifyStatus;
  isActive?: boolean;
};

export type GroupKycListResult = {
  items: GroupKycDocument[];
  total: number;
};

export type GroupKycSaveInput = {
  groupKycId?: number;
  groupId: number;
  docTypeCd: number;
  kycNo: string;
  issueDate: string | null;
  expiryDate: string | null;
  photoPath: string | null;
  backPhotoPath: string | null;
};

export type GroupKycVerifyInput = {
  groupKycId: number;
  verifyStatus: KycVerifyStatus;
  remarks?: string;
};

export type GroupKycStatusInput = {
  groupKycId: number;
  isActive: boolean;
};
