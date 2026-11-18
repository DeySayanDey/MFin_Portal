import { z } from "zod";
import {
  cinPattern,
  gstinPattern,
  optionalEmail,
  optionalFormatted,
  optionalPhone,
  optionalText,
  optionalWebsite,
  panPattern,
  tanPattern,
} from "@/lib/validation/formats";

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
  orgDispNm: z.string().trim().min(1).max(200),
  legalName: optionalText(200),
  regdAddress: optionalText(500),
  hoAddress: optionalText(500),
  stateCd: z.number().int().positive().nullable().optional(),
  phone: optionalPhone(),
  email: optionalEmail(100),
  website: optionalWebsite(),
  cinNo: optionalFormatted(21, cinPattern),
  regdNo: optionalText(50),
  gstNo: optionalFormatted(15, gstinPattern),
  panNo: optionalFormatted(10, panPattern),
  tanNo: optionalFormatted(10, tanPattern),
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
