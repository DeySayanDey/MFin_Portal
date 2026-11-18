import type { z } from "zod";
import type {
  shareHoldingDtoSchema,
  shareSubscriptionDtoSchema,
} from "../schemas/share-subscription.schema";
import type {
  ShareHolding,
  ShareSubscription,
  ShareSubscriptionAddInput,
  ShareSubscriptionApproveInput,
  ShareSubscriptionEditInput,
} from "../types/share-subscription.types";

type SubscriptionDto = z.infer<typeof shareSubscriptionDtoSchema>;
type HoldingDto = z.infer<typeof shareHoldingDtoSchema>;

function text(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

export function mapShareSubscriptionDto(dto: SubscriptionDto): ShareSubscription {
  return {
    subscriptionId: dto.subscription_id,
    subscriptionNo: text(dto.subscription_no),
    custTypeCd: dto.cust_type_cd ?? 0,
    custTypeDesc: text(dto.cust_type_desc),
    customerId: dto.customer_id,
    customerCode: text(dto.customer_code),
    customerName: text(dto.customer_name),
    branchName: text(dto.branch_name),
    subscriptionDate: text(dto.subscription_date),
    noOfShares: dto.no_of_shares ?? 0,
    faceValue: dto.face_value ?? 0,
    subscriptionAmount: dto.subscription_amount ?? 0,
    paidAmount: dto.paid_amount ?? 0,
    outstandingAmount: dto.outstanding_amount ?? 0,
    paymentModeCd: dto.payment_mode_cd ?? null,
    paymentModeDesc: text(dto.payment_mode_desc),
    transRefNo: text(dto.trans_ref_no),
    voucherNo: text(dto.voucher_no),
    remarks: text(dto.remarks),
    statusCd: dto.tr_status_cd ?? 0,
    statusDesc: text(dto.tr_status_desc),
    createdByName: text(dto.created_by_name),
    createdAt: dto.created_at ?? null,
    approvedByName: text(dto.approved_by_name),
    approvedAt: dto.approved_at ?? null,
    approvalRemarks: text(dto.approval_remarks),
  };
}

export function mapShareHoldingDto(dto: HoldingDto): ShareHolding {
  return {
    custTypeCd: dto.cust_type_cd,
    customerId: dto.customer_id,
    faceValue: dto.face_value,
    minShares: dto.min_shares ?? null,
    maxShares: dto.max_shares ?? null,
    totalShares: dto.total_shares ?? 0,
    totalAmount: dto.total_amount ?? 0,
    paidAmount: dto.paid_amount ?? 0,
    outstandingAmount: dto.outstanding_amount ?? 0,
    pendingShares: dto.pending_shares ?? 0,
    lastSubscriptionDate: dto.last_subscription_date ?? null,
  };
}

export function mapShareSubscriptionAddToDto(
  input: ShareSubscriptionAddInput,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    cust_type_cd: input.custTypeCd,
    customer_id: input.customerId,
    subscription_date: input.subscriptionDate,
    no_of_shares: input.noOfShares,
    paid_amount: input.paidAmount,
    payment_mode_cd: input.paymentModeCd,
  };
  if (input.transRefNo?.trim()) payload.trans_ref_no = input.transRefNo.trim();
  if (input.remarks?.trim()) payload.remarks = input.remarks.trim();
  return payload;
}

export function mapShareSubscriptionEditToDto(
  input: ShareSubscriptionEditInput,
): Record<string, unknown> {
  return {
    subscription_id: input.subscriptionId,
    subscription_date: input.subscriptionDate,
    no_of_shares: input.noOfShares,
    paid_amount: input.paidAmount,
    payment_mode_cd: input.paymentModeCd,
    trans_ref_no: input.transRefNo?.trim() || null,
    remarks: input.remarks?.trim() || null,
  };
}

export function mapShareSubscriptionApproveToDto(
  input: ShareSubscriptionApproveInput,
): Record<string, unknown> {
  return {
    subscription_id: input.subscriptionId,
    approve: input.approve,
    remarks: input.remarks?.trim() || null,
  };
}
