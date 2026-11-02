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

export type SampleDeposit = {
  id: string;
  accountNumber: string;
  customerName: string;
  customerId: string;
  kyc: KycState;
  holding: HoldingMode;
  branchId: string;
  branchName: string;
  scheme: SchemeCode;
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
  linkedAccount: { masked: string; name: string } | null;
  mis: MisDetails | null;
  quote: SettlementQuote;
};

export type SampleRequest = {
  id: string;
  accountId: string;
  status: RequestStatus;
  settlementType: SettlementType;
  settlementDate: string;
  reason: ReasonCode;
  remarks: string;
  paymentMode: PaymentMode;
  beneficiaryAccount: string;
  beneficiaryName: string;
  ifsc: string;
  chequeRef: string;
  documentName: string;
  rejectionReason: string;
  receiptRef: string;
  netPayable: number | null;
  quoteId: string;
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
