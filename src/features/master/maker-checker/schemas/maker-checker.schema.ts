import { z } from "zod";

const boolish = z
  .union([
    z.boolean(),
    z.literal(0),
    z.literal(1),
    z.literal("0"),
    z.literal("1"),
  ])
  .transform((value) => value === true || value === 1 || value === "1");

export const makerCheckerDtoSchema = z.object({
  id: z.coerce.number(),
  voucher_type: z.coerce.number(),
  threshold_limit: z.coerce.number(),
  checker_role_id: z.union([z.string(), z.number()]).transform(String),
  dual_auth_req: boolish,
  auto_apprv: boolish,
  is_active: boolish,
  created_by: z.coerce.number().nullable().optional(),
  created_at: z.string(),
});

export const paginationMetaDtoSchema = z.object({
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  last_page: z.number(),
  has_more: z.boolean(),
});

export const makerCheckerCreateInputSchema = z.object({
  voucherType: z.number().int().min(1, "Voucher type must be at least 1"),
  thresholdLimit: z.number().min(0, "Threshold must be at least 0"),
  checkerRoleId: z
    .string()
    .trim()
    .min(1, "Checker role is required")
    .max(25, "Checker role id must be at most 25 characters"),
  dualAuthReq: z.boolean().optional(),
  autoApprv: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const makerCheckerUpdateInputSchema = makerCheckerCreateInputSchema.extend(
  {
    id: z.number().int().positive(),
  },
);

export type MakerCheckerCreateInputParsed = z.infer<
  typeof makerCheckerCreateInputSchema
>;
export type MakerCheckerUpdateInputParsed = z.infer<
  typeof makerCheckerUpdateInputSchema
>;
