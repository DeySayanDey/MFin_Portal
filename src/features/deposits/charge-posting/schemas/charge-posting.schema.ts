import { z } from "zod";

export const CHARGE_BULK_LIMIT = 500;
export const CHARGE_POST_LIMIT = 500;

function asNumber(value: unknown): unknown {
  if (value == null || value === "") return null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }
  return value;
}

function asBoolean(value: unknown): unknown {
  if (value === 1 || value === "1" || value === "true") return true;
  if (value === 0 || value === "0" || value === "false" || value == null) return false;
  return value;
}

const num = z.preprocess(asNumber, z.number().nullable()).nullish();
const id = z.preprocess(asNumber, z.number().int().positive());
const text = z.union([z.string(), z.number()]).nullish();
const flag = z.preprocess(asBoolean, z.boolean());
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const money = z.number().finite().min(0).max(99_999_999.99);

export const chargeRowDtoSchema = z
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
    available_balance: num,
    charge_id: id,
    charge_name: text,
    figure_cd: num,
    charge_rate: num,
    max_amount: num,
    tax_percent: num,
    charges_during_desc: text,
    last_charged_date: text,
    charged_this_period: flag,
    calculated_amount: num,
  })
  .passthrough();

export const chargePostResultDtoSchema = z
  .object({
    batch_id: id,
    batch_no: text,
    posted_count: num,
    total_charge: num,
    total_tax: num,
  })
  .passthrough();

export type ChargeRowDto = z.infer<typeof chargeRowDtoSchema>;

export const chargeCalcQuerySchema = z
  .object({
    mode: z.enum(["single", "bulk"]),
    chargeDate: ymd,
    accountId: z.number().int().positive().optional(),
    chargeId: z.number().int().positive().optional(),
    schemeId: z.number().int().positive().optional(),
    branchId: z.number().int().positive().optional(),
    keyword: z.string().trim().max(60).optional(),
  })
  .superRefine((query, ctx) => {
    if (query.mode === "single" && query.accountId == null) {
      ctx.addIssue({ code: "custom", message: "Select an account", path: ["accountId"] });
    }
    if (query.mode === "bulk" && query.chargeId == null) {
      ctx.addIssue({ code: "custom", message: "Select a charge", path: ["chargeId"] });
    }
  });

export const chargePostInputSchema = z
  .object({
    mode: z.enum(["single", "bulk"]),
    chargeDate: ymd,
    remarks: z.string().trim().max(250).optional(),
    rows: z
      .array(
        z.object({
          accountId: z.number().int().positive(),
          chargeId: z.number().int().positive(),
          calculatedAmount: money,
          chargeAmount: money.refine((value) => value > 0, "Charge amount must be more than 0"),
        }),
      )
      .min(1, "Select at least one charge")
      .max(CHARGE_POST_LIMIT),
  })
  .superRefine((input, ctx) => {
    const keys = new Set<string>();
    input.rows.forEach((row, index) => {
      const key = `${row.accountId}:${row.chargeId}`;
      if (keys.has(key)) {
        ctx.addIssue({ code: "custom", message: "Duplicate charge for an account", path: ["rows", index] });
      }
      keys.add(key);
    });
    if (input.mode === "single" && new Set(input.rows.map((row) => row.accountId)).size !== 1) {
      ctx.addIssue({ code: "custom", message: "Single posting takes one account", path: ["rows"] });
    }
    if (input.mode === "bulk" && new Set(input.rows.map((row) => row.chargeId)).size !== 1) {
      ctx.addIssue({ code: "custom", message: "Bulk posting takes one charge", path: ["rows"] });
    }
    const edited = input.rows.some((row) => Math.abs(row.chargeAmount - row.calculatedAmount) >= 0.005);
    if (edited && !input.remarks) {
      ctx.addIssue({ code: "custom", message: "Add a reason for the changed charge", path: ["remarks"] });
    }
  });
