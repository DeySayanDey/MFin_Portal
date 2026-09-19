import { z } from "zod";

export const branchDtoSchema = z.object({
  branch_id: z.number(),
  org_id: z.number(),
  branch_code: z.string(),
  branch_name: z.string(),
  branch_address: z.string().nullable().optional(),
  branch_mobile: z.string().nullable().optional(),
  branch_mail: z.string().nullable().optional(),
  header_text: z.string().nullable().optional(),
  is_head: z.boolean(),
  is_active: z.boolean(),
});

export const paginationMetaDtoSchema = z.object({
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  last_page: z.number(),
  has_more: z.boolean(),
});

export const branchCreateInputSchema = z.object({
  branchCode: z.string().trim().max(6).nullable().optional(),
  branchName: z.string().trim().min(1).max(100),
  branchAddress: z.string().trim().max(200).nullable().optional(),
  branchMobile: z.string().trim().max(50).nullable().optional(),
  branchMail: z
    .union([
      z.literal(""),
      z.null(),
      z.string().trim().email().max(50),
    ])
    .optional(),
  headerText: z.string().trim().nullable().optional(),
  isHead: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const branchUpdateInputSchema = branchCreateInputSchema.extend({
  branchId: z.number().int().positive(),
  branchCode: z.string().trim().min(1).max(6),
});

export const branchMutationResultSchema = z.object({
  branch_id: z.number(),
});
