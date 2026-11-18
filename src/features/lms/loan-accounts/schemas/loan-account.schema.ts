import { z } from "zod";

export const paginationMetaDtoSchema = z.object({
  total: z.number(),
  page: z.number().optional(),
  per_page: z.number().optional(),
  last_page: z.number().optional(),
  has_more: z.boolean().optional(),
});

const dateText = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const loanAccountSaveInputSchema = z.object({
  loanAccountId: z.number().int().positive().optional(),
  applicationId: z.number().int().positive().optional(),
  loanDate: dateText.optional(),
  loanAmount: z.number().positive().optional(),
  interestRate: z.number().min(0).max(100).optional(),
  finalDueDate: dateText.nullable().optional(),
  loanAccountNo: z.number().int().positive().optional(),
  refAccountNo: z.string().trim().max(30).optional(),
  isDefaulter: z.boolean().optional(),
  isNpa: z.boolean().optional(),
});

export const loanAccountStatusInputSchema = z.object({
  loanAccountId: z.number().int().positive(),
  statusCd: z.number().int().min(1).max(3),
});
