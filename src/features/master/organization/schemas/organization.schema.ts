import { z } from "zod";

/** Loose runtime check for OrgGet / OrgUpdate response data. */
export const organizationDtoSchema = z.object({
  org_id: z.number(),
  org_disp_nm: z.string(),
  legal_name: z.string().nullable().optional(),
  regd_address: z.string().nullable().optional(),
  ho_address: z.string().nullable().optional(),
  state_cd: z.number().nullable().optional(),
  state_name: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  cin_no: z.string().nullable().optional(),
  regd_no: z.string().nullable().optional(),
  gst_no: z.string().nullable().optional(),
  pan_no: z.string().nullable().optional(),
  tan_no: z.string().nullable().optional(),
  org_logo: z.string().nullable().optional(),
  org_schema: z.string(),
  is_active: z.boolean(),
});

/**
 * Frontend update validation — only documented safe rules.
 * Do not invent undocumented max lengths.
 */
export const organizationUpdateInputSchema = z.object({
  orgDispNm: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(200, "Display name must be at most 200 characters"),
  legalName: z.string().nullable().optional(),
  regdAddress: z.string().nullable().optional(),
  hoAddress: z.string().nullable().optional(),
  stateCd: z.number().int().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z
    .union([
      z.literal(""),
      z.null(),
      z.string().trim().email("Enter a valid email address"),
    ])
    .optional(),
  website: z.string().nullable().optional(),
  cinNo: z.string().nullable().optional(),
  regdNo: z.string().nullable().optional(),
  gstNo: z.string().nullable().optional(),
  panNo: z.string().nullable().optional(),
  tanNo: z.string().nullable().optional(),
  /** undefined = omit/keep; "" = clear; other = base64 set */
  orgLogo: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export type OrganizationUpdateInputParsed = z.infer<
  typeof organizationUpdateInputSchema
>;

export const stateDtoSchema = z.object({
  state_cd: z.number(),
  state_name: z.string(),
});

export const paginationMetaDtoSchema = z.object({
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  last_page: z.number(),
  has_more: z.boolean(),
});
