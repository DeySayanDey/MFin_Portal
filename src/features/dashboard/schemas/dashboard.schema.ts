import { z } from "zod";

function asNumber(value: unknown): unknown {
  if (value == null || value === "") return null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }
  return value;
}

function asBoolean(value: unknown): unknown {
  if (value === 1 || value === "1" || value === true || value === "true") return true;
  if (value === 0 || value === "0" || value === false || value === "false" || value == null) return false;
  return value;
}

const num = z.preprocess(asNumber, z.number().nullable()).nullish();
const id = z.preprocess(asNumber, z.number().int().positive());
const text = z.union([z.string(), z.number()]).nullish();
const flag = z.preprocess(asBoolean, z.boolean());
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const money = z.preprocess((value) => {
  const parsed = asNumber(value);
  return parsed == null || typeof parsed !== "number" || !Number.isFinite(parsed) ? 0 : parsed;
}, z.number());
const pct = z.preprocess(asNumber, z.number().nullable()).nullish();

export const dashboardQuerySchema = z
  .object({
    fromDate: ymd,
    toDate: ymd,
    branchId: z.number().int().positive().optional(),
  })
  .refine((query) => query.fromDate <= query.toDate, {
    message: "From date can't be after to date",
    path: ["toDate"],
  });

export const dashboardKpiDtoSchema = z
  .object({
    glp: money,
    disbursed: money,
    par90_amount: money,
    par90_percent: money,
    npa_amount: money,
    npa_percent: money,
    active_groups: money,
    active_members: money,
    savings_balance: money,
    pending_applications: money,
    collection: money,
  })
  .passthrough();

export const dashboardFundsDtoSchema = z
  .object({
    cash: money,
    bank: money,
    total: money,
  })
  .passthrough();

export const dashboardAgentDtoSchema = z
  .object({
    staff_id: id,
    staff_name: text,
    group_count: num,
    target: num,
    collected: num,
    wallet: num,
    in_field: flag,
  })
  .passthrough();

export const dashboardBranchDtoSchema = z
  .object({
    branch_id: id,
    branch_name: text,
    loan_book: num,
    collection: num,
    vault: num,
    recovery_percent: pct,
  })
  .passthrough();

export const dashboardLoanDtoSchema = z
  .object({
    loan_account_id: id,
    loan_account_no: text,
    borrower: text,
    group_name: text,
    disbursed: num,
    principal_paid: num,
    outstanding: num,
    dpd: num,
    status_cd: num,
    status_desc: text,
  })
  .passthrough();

export const dashboardDtoSchema = z
  .object({
    from_date: text,
    to_date: text,
    branch_id: num,
    kpis: dashboardKpiDtoSchema,
    funds: dashboardFundsDtoSchema,
    agents: z.array(dashboardAgentDtoSchema).nullish(),
    branches: z.array(dashboardBranchDtoSchema).nullish(),
    loans: z.array(dashboardLoanDtoSchema).nullish(),
  })
  .passthrough();

export type DashboardDto = z.infer<typeof dashboardDtoSchema>;
export type DashboardKpiDto = z.infer<typeof dashboardKpiDtoSchema>;
export type DashboardFundsDto = z.infer<typeof dashboardFundsDtoSchema>;
export type DashboardAgentDto = z.infer<typeof dashboardAgentDtoSchema>;
export type DashboardBranchDto = z.infer<typeof dashboardBranchDtoSchema>;
export type DashboardLoanDto = z.infer<typeof dashboardLoanDtoSchema>;
