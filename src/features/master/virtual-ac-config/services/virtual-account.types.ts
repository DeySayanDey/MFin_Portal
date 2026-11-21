// UI state for the virtual account configuration and mapping forms.
export type Configuration = {
  id: number;
  configName: string;
  purposeCd: string;
  maxAmount: string;
  bankId: string;
  bankLabel: string;
  branchCode: string;
  ifscCode: string;
  accountNo: string;
  cifNo: string;
  tenderId: string;
  makerId: string;
  checkerId: string;
  hexKey: string;
  hexIvKey: string;
  clientId: string;
  secretId: string;
  upiId: string;
  qrImagePath: string;
  qrImageFile: File | null;
  isActive: boolean;
  hasQrImage: boolean;
  hasHexKey: boolean;
  hasHexIvKey: boolean;
  hasSecretId: boolean;
  originalText: Record<string, string | null>;
};
export type Mapping = { id: number; virtualId: string; orgBranchId: string; isActive: boolean; branchLabel?: string; configLabel?: string };

export const emptyConfiguration = (): Configuration => ({
  id: 0, configName: "", purposeCd: "", maxAmount: "", bankId: "", bankLabel: "", branchCode: "", ifscCode: "", accountNo: "", cifNo: "",
  tenderId: "", makerId: "", checkerId: "", hexKey: "", hexIvKey: "",
  clientId: "", secretId: "", upiId: "", qrImagePath: "", qrImageFile: null, isActive: true,
  hasQrImage: false, hasHexKey: false, hasHexIvKey: false, hasSecretId: false, originalText: {},
});
export const emptyMapping = (): Mapping => ({ id: 0, virtualId: "", orgBranchId: "", isActive: true });
