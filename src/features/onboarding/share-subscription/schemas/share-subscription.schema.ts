import { z } from "zod";
import { CUST_TYPES, PAYMENT_MODE_CASH, PAYMENT_MODES } from "../share-subscription.constants";

function asNumber(value: unknown): unknown {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }
  return value;
}

const optionalNumber = z.preprocess(asNumber, z.number().nullable());
const optionalInt = z.preprocess(asNumber, z.number().int().nullable());
const requiredInt = z.preprocess(asNumber, z.number().int());
const optionalText = z.string().nullish();
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const shareSubscriptionDtoSchema = z
  .object({
    subscription_id: requiredInt,
    subscription_no: optionalText,
    cust_type_cd: optionalInt.nullish(),
    cust_type_desc: optionalText,
    customer_id: requiredInt,
    customer_code: optionalText,
    customer_name: optionalText,
    branch_name: optionalText,
    subscription_date: optionalText,
    no_of_shares: optionalInt.nullish(),
    face_value: optionalNumber.nullish(),
    subscription_amount: optionalNumber.nullish(),
    paid_amount: optionalNumber.nullish(),
    outstanding_amount: optionalNumber.nullish(),
    payment_mode_cd: optionalInt.nullish(),
    payment_mode_desc: optionalText,
    trans_ref_no: optionalText,
    voucher_no: optionalText,
    remarks: optionalText,
    tr_status_cd: optionalInt.nullish(),
    tr_status_desc: optionalText,
    created_by_name: optionalText,
    created_at: optionalText,
    approved_by_name: optionalText,
    approved_at: optionalText,
    approval_remarks: optionalText,
  })
  .passthrough();

export const shareHoldingDtoSchema = z
  .object({
    cust_type_cd: requiredInt,
    customer_id: requiredInt,
    face_value: z.preprocess(asNumber, z.number().positive()),
    min_shares: optionalInt.nullish(),
    max_shares: optionalInt.nullish(),
    total_shares: optionalInt.nullish(),
    total_amount: optionalNumber.nullish(),
    paid_amount: optionalNumber.nullish(),
    outstanding_amount: optionalNumber.nullish(),
    pending_shares: optionalInt.nullish(),
    last_subscription_date: optionalText,
  })
  .passthrough();

export const shareHoldingQuerySchema = z.object({
  custTypeCd: z.union([z.literal(CUST_TYPES[0]), z.literal(CUST_TYPES[1])]),
  customerId: z.number().int().positive(),
});

export const shareSubscriptionAddSchema = z
  .object({
    custTypeCd: z.union([z.literal(CUST_TYPES[0]), z.literal(CUST_TYPES[1])]),
    customerId: z.number().int().positive(),
    subscriptionDate: ymd,
    noOfShares: z.number().int().positive(),
    paidAmount: z.number().min(0),
    paymentModeCd: z.union([
      z.literal(PAYMENT_MODES[0]),
      z.literal(PAYMENT_MODES[1]),
      z.literal(PAYMENT_MODES[2]),
    ]),
    transRefNo: z.string().trim().max(25).nullable().optional(),
    remarks: z.string().trim().max(250).nullable().optional(),
  })
  .superRefine((value, context) => {
    if (value.paymentModeCd !== PAYMENT_MODE_CASH && !value.transRefNo?.trim()) {
      context.addIssue({
        code: "custom",
        path: ["transRefNo"],
        message: "Reference number is required for cheque and bank transfer",
      });
    }
  });

export const shareSubscriptionEditSchema = z
  .object({
    subscriptionId: z.number().int().positive(),
    subscriptionDate: ymd,
    noOfShares: z.number().int().positive(),
    paidAmount: z.number().min(0),
    paymentModeCd: z.union([
      z.literal(PAYMENT_MODES[0]),
      z.literal(PAYMENT_MODES[1]),
      z.literal(PAYMENT_MODES[2]),
    ]),
    transRefNo: z.string().trim().max(25).nullable().optional(),
    remarks: z.string().trim().max(250).nullable().optional(),
  })
  .superRefine((value, context) => {
    if (value.paymentModeCd !== PAYMENT_MODE_CASH && !value.transRefNo?.trim()) {
      context.addIssue({
        code: "custom",
        path: ["transRefNo"],
        message: "Reference number is required for cheque and bank transfer",
      });
    }
  });

export const shareSubscriptionApproveSchema = z
  .object({
    subscriptionId: z.number().int().positive(),
    approve: z.boolean(),
    remarks: z.string().trim().max(200).nullable().optional(),
  })
  .superRefine((value, context) => {
    if (!value.approve && !value.remarks?.trim()) {
      context.addIssue({
        code: "custom",
        path: ["remarks"],
        message: "Rejection reason is required",
      });
    }
  });

export const paginationMetaDtoSchema = z.object({
  total: z.preprocess(asNumber, z.number()),
  page: z.preprocess(asNumber, z.number()).optional(),
  per_page: z.preprocess(asNumber, z.number()).optional(),
  last_page: z.preprocess(asNumber, z.number()).optional(),
});
