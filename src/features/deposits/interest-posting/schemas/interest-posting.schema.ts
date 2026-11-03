import { z } from "zod";

export const INTEREST_BULK_LIMIT = 500;
export const INTEREST_POST_LIMIT = 500;

function asNumber(value: unknown): unknown {
  if (value == null || value === "") return null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }
  return value;
}

const num = z.preprocess(asNumber, z.number().nullable()).nullish();
const id = z.preprocess(asNumber, z.number().int().positive());
const text = z.union([z.string(), z.number()]).nullish();
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const money = z.number().finite().min(0).max(99_999_999.99);

export const interestRowDtoSchema = z
  .object({
    account_id: id,
    full_account_no: text,
    appl_no: text,
    holder_name: text,
    scheme_id: num,
    scheme_code: text,
    scheme_name: text,
    branch_name: text,
    current_balance: num,
    roi: num,
    intt_type_desc: text,
    last_posted_date: text,
    from_date: text,
    to_date: text,
    days: num,
    product_amount: num,
    calculated_interest: num,
  })
  .passthrough();

export const interestPostResultDtoSchema = z
  .object({
    batch_id: id,
    batch_no: text,
    posted_count: num,
    total_interest: num,
  })
  .passthrough();

export type InterestRowDto = z.infer<typeof interestRowDtoSchema>;

export const interestCalcQuerySchema = z
  .object({
    mode: z.enum(["single", "bulk"]),
    asOnDate: ymd,
    accountId: z.number().int().positive().optional(),
    schemeId: z.number().int().positive().optional(),
    branchId: z.number().int().positive().optional(),
    keyword: z.string().trim().max(60).optional(),
  })
  .refine((query) => query.mode === "bulk" || query.accountId != null, {
    message: "Select an account",
    path: ["accountId"],
  });

export const interestPostInputSchema = z
  .object({
    mode: z.enum(["single", "bulk"]),
    asOnDate: ymd,
    postingDate: ymd,
    remarks: z.string().trim().max(250).optional(),
    rows: z
      .array(
        z.object({
          accountId: z.number().int().positive(),
          fromDate: ymd,
          toDate: ymd,
          calculatedInterest: money,
          interestAmount: money,
        }),
      )
      .min(1, "Select at least one account")
      .max(INTEREST_POST_LIMIT),
  })
  .superRefine((input, ctx) => {
    if (input.postingDate < input.asOnDate) {
      ctx.addIssue({ code: "custom", message: "Posting date can't be before the interest date", path: ["postingDate"] });
    }
    if (input.mode === "single" && input.rows.length !== 1) {
      ctx.addIssue({ code: "custom", message: "Single posting takes one account", path: ["rows"] });
    }
    const ids = new Set<number>();
    input.rows.forEach((row, index) => {
      if (ids.has(row.accountId)) {
        ctx.addIssue({ code: "custom", message: "Duplicate account", path: ["rows", index, "accountId"] });
      }
      ids.add(row.accountId);
      if (row.fromDate > row.toDate || row.toDate > input.asOnDate) {
        ctx.addIssue({ code: "custom", message: "Invalid interest period", path: ["rows", index, "toDate"] });
      }
    });
    const edited = input.rows.some((row) => Math.abs(row.interestAmount - row.calculatedInterest) >= 0.005);
    if (edited && !input.remarks) {
      ctx.addIssue({ code: "custom", message: "Add a reason for the changed interest", path: ["remarks"] });
    }
  });
