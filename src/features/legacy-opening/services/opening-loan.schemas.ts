import { z } from "zod";

const id = z.number().int().positive();
const money = z.string().trim().regex(/^\d{1,8}(?:\.\d{1,2})?$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const loanIdsSchema = z.array(id).min(1).max(200).refine((ids) => new Set(ids).size === ids.length);
export const loanInputSchema = z.object({
  opening_id: id.optional(), scheme_id: id, cust_type_cd: z.union([z.literal(1), z.literal(2)]).optional(), customer_id: id,
  guarantor_id: id.nullable().optional(), opening_od_intt: money.nullable().optional(),
  application_no: z.string().trim().max(255).nullable(), ref_ac_no: z.string().trim().max(25).nullable().optional(),
  sanc_amount: money, disb_date: date.nullable(), loan_amount: money, intt_rate: money,
  repay_type_cd: id, repay_schedule_cd: id.nullable(), loan_duration: z.number().int().min(1).max(32767).nullable(), duration_cd: id.nullable(),
  emi_amount: money.nullable(), opening_balance_prn: money.nullable(), opening_balance_intt: money.nullable(),
  intt_paid_upto: date.nullable(), remarks: z.string().trim().max(100).nullable(),
}).superRefine((v, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: "custom", message });
  if (+v.sanc_amount <= 0 || +v.loan_amount <= 0 || +v.loan_amount > +v.sanc_amount) issue("Enter positive amounts; disbursement cannot exceed sanction.");
  if (+v.intt_rate > 100) issue("Interest rate cannot exceed 100%.");
  if ((v.loan_duration == null) !== (v.duration_cd == null)) issue("Enter both tenure and unit.");
  if (v.emi_amount != null && +v.emi_amount <= 0) issue("EMI must be positive.");
  if (v.opening_balance_prn != null && +v.opening_balance_prn > +v.loan_amount) issue("Principal cannot exceed disbursement.");
  if (v.disb_date && v.intt_paid_upto && v.intt_paid_upto < v.disb_date) issue("Interest paid-through date cannot precede disbursement.");
});
export type LoanInput = z.infer<typeof loanInputSchema>;
const text = z.string().nullable().optional();
const number = z.number().int().nullable().optional();
export const loanRowSchema = z.object({
  opening_id: id, scheme_id: number, cust_type_cd: z.union([z.literal(1), z.literal(2)]).nullable().optional(), scheme_code: text, scheme_name: text, customer_id: number, customer_code: text, customer_name: text,
  application_no: text, ref_ac_no: text, sanc_amount: text, disb_date: text, loan_amount: text, intt_rate: text,
  repay_type_cd: number, repay_schedule_cd: number, loan_duration: number, duration_cd: number, emi_amount: text,
  opening_balance_prn: text, opening_balance_intt: text, guarantor_id: number, opening_od_intt: text, intt_paid_upto: text, remarks: text,
});
export type LoanDraft = z.infer<typeof loanRowSchema>;
export const loanListSchema = z.object({ success: z.literal(true), data: z.array(loanRowSchema), meta: z.object({ total: z.number().int().nonnegative(), page: id, per_page: id, last_page: z.number().int().nonnegative(), has_more: z.boolean().optional(), total_outstanding: text }) });
