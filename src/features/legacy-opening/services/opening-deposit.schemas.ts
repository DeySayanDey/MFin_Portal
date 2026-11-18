import { z } from "zod";
import { shareAmountPaise } from "../share.form";

const positiveId = z.number().int().positive();
const money = z.string().trim().regex(/^\d{1,8}(?:\.\d{1,2})?$/);
const decimal = z.string().trim().regex(/^\d+(?:\.\d+)?$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const ids = z.array(positiveId).min(1).max(200).refine((items) => new Set(items).size === items.length);

export const draftInputSchema = z.object({
  opening_id: positiveId.optional(), deposit_type_cd: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  cust_type_cd: z.union([z.literal(1), z.literal(2)]), customer_id: positiveId,
  scheme_id: positiveId.optional(), prod_type_cd: positiveId.nullable().optional(), op_mode_cd: positiveId,
  cust_id_joint1: positiveId.nullable().optional(), ref_ac_no: z.string().trim().min(1).max(15),
  opening_date: date, opening_balance: money.optional(), no_of_shares: z.number().int().min(1).max(99999999).optional(), face_value: z.string().trim().optional(), remarks: z.string().trim().max(100).nullable().optional(),
  tenure: positiveId.nullable().optional(), term_cd: positiveId.nullable().optional(), installment_amount: decimal.nullable().optional(),
  intt_rate: decimal.nullable().optional(), intt_payout_cd: positiveId.nullable().optional(), matu_ins_cd: positiveId.nullable().optional(),
  maturity_date: date.nullable().optional(), maturity_amt: decimal.nullable().optional(), paid_upto: date.nullable().optional(),
}).superRefine((input, ctx) => {
  if (input.deposit_type_cd !== 3 && input.opening_balance == null) ctx.addIssue({ code: "custom", message: "Opening balance is required." });
  if (input.deposit_type_cd === 3 && (input.cust_type_cd !== 2 || input.op_mode_cd !== 1 || input.no_of_shares == null || !input.face_value || shareAmountPaise(String(input.no_of_shares), input.face_value) == null)) ctx.addIssue({ code: "custom", message: "Enter an individual customer, a valid share count and face value within the amount limit." });
  if ((input.deposit_type_cd === 1 || input.deposit_type_cd === 2) && !input.scheme_id) ctx.addIssue({ code: "custom", message: "Select a deposit scheme." });
  if ((input.deposit_type_cd === 4 || input.deposit_type_cd === 5) && (input.cust_type_cd !== 2 || input.op_mode_cd !== 1)) ctx.addIssue({ code: "custom", message: "Fund drafts require an individual customer and single operation mode." });
  if ((input.deposit_type_cd === 4 || input.deposit_type_cd === 5) && input.intt_rate != null && (!/^\d{1,3}(?:\.\d{1,2})?$/.test(input.intt_rate) || Number(input.intt_rate) > 100)) ctx.addIssue({ code: "custom", message: "Interest rate must be between 0 and 100 with up to two decimal places." });
  if ((input.deposit_type_cd === 4 || input.deposit_type_cd === 5) && input.paid_upto && input.paid_upto < input.opening_date) ctx.addIssue({ code: "custom", message: "Paid-through date cannot be before the opening date." });
  if (input.deposit_type_cd === 5 && (input.intt_rate == null || !input.installment_amount || !/^\d{1,8}(?:\.\d{1,2})?$/.test(input.installment_amount) || Number(input.installment_amount) <= 0)) ctx.addIssue({ code: "custom", message: "Enter a valid positive monthly installment and interest rate." });
  if (input.deposit_type_cd === 1 && input.op_mode_cd === 4) ctx.addIssue({ code: "custom", message: "This operation mode requires two joint holders, but the draft supports only one." });
  if (input.deposit_type_cd === 1 && ![1, 2, 3, 5].includes(input.op_mode_cd)) ctx.addIssue({ code: "custom", message: "Choose an available operation mode." });
  if (input.cust_type_cd === 2 && input.cust_id_joint1 === input.customer_id) ctx.addIssue({ code: "custom", message: "The joint member must differ from the primary customer." });
  if (input.deposit_type_cd === 1 && [2, 3].includes(input.op_mode_cd) && !input.cust_id_joint1) ctx.addIssue({ code: "custom", message: "Select a joint member for this operation mode." });
  if (input.deposit_type_cd === 2 && (!input.prod_type_cd || !input.tenure || !input.term_cd || !input.installment_amount || Number(input.installment_amount) <= 0 || input.intt_rate == null || Number(input.intt_rate) > 100 || !input.intt_payout_cd || !input.maturity_date || input.maturity_date <= input.opening_date || !input.maturity_amt || Number(input.maturity_amt) <= 0)) ctx.addIssue({ code: "custom", message: "Complete the term deposit details with a maturity date after the opening date." });
  if (input.deposit_type_cd === 2 && input.tenure && input.term_cd) {
    const limits: Record<number, number> = { 1: 120, 2: 120, 3: 50 };
    if (!limits[input.term_cd] || input.tenure > limits[input.term_cd] || (input.prod_type_cd === 2 && input.term_cd === 1)) ctx.addIssue({ code: "custom", message: "The tenure or unit is not permitted for this product." });
  }
  if (input.deposit_type_cd === 2 && input.paid_upto && input.maturity_date && input.paid_upto > input.maturity_date) ctx.addIssue({ code: "custom", message: "Interest paid up to cannot be after maturity." });
});
export type OpeningDraftInput = z.infer<typeof draftInputSchema>;
export const batchInputSchema = z.object({ opening_ids: ids });

const nullableText = z.string().nullable().optional();
const nullableNumber = z.number().int().nullable().optional();
export const draftRowSchema = z.object({
  opening_id: positiveId, deposit_type_cd: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]), account_type: nullableText,
  prod_type_cd: nullableNumber, prod_type_desc: nullableText, scheme_id: nullableNumber, scheme_code: nullableText, scheme_name: nullableText,
  cust_type_cd: z.union([z.literal(1), z.literal(2)]), customer_id: nullableNumber, customer_code: nullableText, customer_name: nullableText,
  branch_id: nullableNumber, op_mode_cd: nullableNumber, cust_id_joint1: nullableNumber, ref_ac_no: nullableText,
  opening_date: nullableText, opening_balance: z.string(), tenure: nullableNumber, term_cd: nullableNumber,
  installment_amount: nullableText, intt_rate: nullableText, intt_payout_cd: nullableNumber, matu_ins_cd: nullableNumber,
  maturity_date: nullableText, maturity_amt: nullableText, paid_upto: nullableText, remarks: nullableText,
  no_of_shares: nullableNumber, face_value: nullableText,
});
export type OpeningDraft = z.infer<typeof draftRowSchema>;
export const customerSchema = z.object({ cust_type_cd: z.union([z.literal(1), z.literal(2)]), customer_id: positiveId, customer_code: nullableText, customer_name: z.string(), branch_id: nullableNumber, branch_name: nullableText });
export type OpeningCustomer = z.infer<typeof customerSchema>;
export const metaSchema = z.object({ total: z.number().int().nonnegative(), page: positiveId, per_page: positiveId, last_page: z.number().int().nonnegative(), has_more: z.boolean().optional(), opening_balance_total: z.string().optional() });
