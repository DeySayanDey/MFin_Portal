export type SchemeCode = "FD" | "MIS" | "OTHER";

export type AccountStatus = "active" | "matured" | "closed" | "settled";

export type KycState = "verified" | "due" | "restricted";

export type HoldingMode = "single" | "joint" | "eitherOrSurvivor";

export type SettlementType = "maturity" | "premature";

export type ReasonCode = "customer" | "financial" | "other";

export type PaymentMode = "savings" | "neft" | "cheque" | "cash";

export type RequestStatus =
  | "draft"
  | "pending"
  | "rejected"
  | "approved"
  | "settled";

export type RestrictionCode = "lien" | "settled" | "kyc";

export type AccountStatusFilter = AccountStatus | "activeMatured" | "all";

export type SettlementQuote = {
  quoteId: string;
  expiresOn: string;
  principal: number;
  interest: number;
  overdueInterest: number;
  interestRecovery: number;
  penalty: number;
  tds: number;
  otherDeductions: number;
  netPayable: number;
};

export type MisDetails = {
  monthlyInterest: number;
  lastPaidDate: string;
  totalInterestPaid: number;
  unpaidInstallments: number;
  pendingInterest: number;
  recoverableExcess: number;
};

export type LinkedSavingsAccount = {
  accountId: number;
  accountNo: string;
  name: string;
};

export type SettlementAccount = {
  id: number;
  accountNumber: string;
  customerName: string;
  customerId: string;
  kyc: KycState;
  holding: HoldingMode;
  branchId: number | null;
  branchName: string;
  scheme: SchemeCode;
  schemeName: string;
  status: AccountStatus;
  principal: number;
  ratePercent: number;
  openDate: string;
  maturityDate: string;
  tenureMonths: number;
  payoutFrequency: "cumulative" | "periodic";
  eligible: boolean;
  restriction: RestrictionCode | null;
  permittedTypes: SettlementType[];
  paymentMethods: PaymentMode[];
  linkedAccount: LinkedSavingsAccount | null;
  mis: MisDetails | null;
};

export type SettlementRequest = {
  id: number;
  accountId: number;
  accountNumber: string;
  customerName: string;
  branchName: string;
  status: RequestStatus;
  settlementType: SettlementType;
  settlementDate: string;
  reason: ReasonCode;
  remarks: string;
  paymentMode: PaymentMode | "";
  beneficiaryAccount: string;
  beneficiaryName: string;
  ifsc: string;
  chequeRef: string;
  documentName: string;
  rejectionReason: string;
  receiptRef: string;
  netPayable: number | null;
  quote: SettlementQuote | null;
};

export type SettlementAccountDetail = {
  account: SettlementAccount;
  openRequest: SettlementRequest | null;
  settledRequest: SettlementRequest | null;
};

export type SettlementDraft = {
  settlementType: SettlementType | "";
  settlementDate: string;
  reason: ReasonCode | "";
  remarks: string;
  paymentMode: PaymentMode | "";
  beneficiaryAccount: string;
  beneficiaryName: string;
  ifsc: string;
  chequeRef: string;
  verified: boolean;
  documentName: string;
};

export type ListMeta = {
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
};

export type ListResult<T> = {
  items: T[];
  meta: ListMeta | null;
};

export type SettlementAccountQuery = {
  page?: number;
  perPage?: number;
  scheme?: SchemeCode;
  keyword?: string;
  branchId?: number;
  status?: AccountStatusFilter;
};

export type SettlementRequestQuery = {
  page?: number;
  perPage?: number;
  view?: "pending" | "settled";
  branchId?: number;
};

export type SettlementCalculateInput = {
  accountId: number;
  settlementType: SettlementType;
  settlementDate: string;
};

export type SettlementSaveInput = {
  settlementId?: number;
  accountId: number;
  submit: boolean;
  settlementType: SettlementType;
  settlementDate: string;
  reason: ReasonCode;
  remarks?: string;
  paymentMode?: PaymentMode;
  sbAccountId?: number;
  beneficiaryAccount?: string;
  beneficiaryName?: string;
  ifsc?: string;
  chequeRef?: string;
  netPayable?: number;
  quoteId?: string;
};

export type SettlementActionInput =
  | { action: "approve"; settlementId: number }
  | { action: "reject"; settlementId: number; reason: string }
  | { action: "post"; settlementId: number };
