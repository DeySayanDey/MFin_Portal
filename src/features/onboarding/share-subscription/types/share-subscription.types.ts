export type ShareSubscription = {
  subscriptionId: number;
  subscriptionNo: string;
  custTypeCd: number;
  custTypeDesc: string;
  customerId: number;
  customerCode: string;
  customerName: string;
  branchName: string;
  subscriptionDate: string;
  noOfShares: number;
  faceValue: number;
  subscriptionAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentModeCd: number | null;
  paymentModeDesc: string;
  transRefNo: string;
  voucherNo: string;
  remarks: string;
  statusCd: number;
  statusDesc: string;
  createdByName: string;
  createdAt: string | null;
  approvedByName: string;
  approvedAt: string | null;
  approvalRemarks: string;
};

export type ShareSubscriptionListQuery = {
  page?: number;
  perPage?: number;
  subscriptionId?: number;
  custTypeCd?: number;
  customerId?: number;
  branchId?: number;
  statusCd?: number;
  fromDate?: string;
  toDate?: string;
  search?: string;
};

export type ShareSubscriptionListResult = {
  items: ShareSubscription[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    lastPage: number;
  } | null;
};

export type ShareHolding = {
  custTypeCd: number;
  customerId: number;
  faceValue: number;
  minShares: number | null;
  maxShares: number | null;
  totalShares: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  pendingShares: number;
  lastSubscriptionDate: string | null;
};

export type ShareHoldingQuery = {
  custTypeCd: number;
  customerId: number;
};

export type ShareSubscriptionAddInput = {
  custTypeCd: number;
  customerId: number;
  subscriptionDate: string;
  noOfShares: number;
  paidAmount: number;
  paymentModeCd: number;
  transRefNo?: string | null;
  remarks?: string | null;
};

export type ShareSubscriptionEditInput = {
  subscriptionId: number;
  subscriptionDate: string;
  noOfShares: number;
  paidAmount: number;
  paymentModeCd: number;
  transRefNo?: string | null;
  remarks?: string | null;
};

export type ShareSubscriptionApproveInput = {
  subscriptionId: number;
  approve: boolean;
  remarks?: string | null;
};

export type ShareSubscriptionResult = {
  item: ShareSubscription;
  message: string;
};
