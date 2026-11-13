import { z } from "zod";
import {
  optionalAadhaar,
  optionalEmail,
  optionalMobile,
  optionalPan,
  optionalText,
} from "@/lib/validation/formats";

export const staffModuleAccessDtoSchema = z.object({
  module_id: z.number(),
  module_key: z.string(),
  module_label: z.string(),
});

export const staffDtoSchema = z.object({
  staff_id: z.number(),
  branch_id: z.number().nullable().optional(),
  employee_code: z.string(),
  full_name: z.string(),
  short_name: z.string().nullable().optional(),
  designation_id: z.number().nullable().optional(),
  role_id: z.number().nullable().optional(),
  designation_name: z.string().nullable().optional(),
  mobile: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  join_date: z.string().nullable().optional(),
  aadhaar: z.string().nullable().optional(),
  pan: z.string().nullable().optional(),
  device_id: z.number().nullable().optional(),
  user_id: z.number().nullable().optional(),
  status: z.number(),
  module_access: z.array(staffModuleAccessDtoSchema).nullable().optional(),
  created_by: z.number().nullable().optional(),
  updated_by: z.number().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export const paginationMetaDtoSchema = z.object({
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  last_page: z.number(),
  has_more: z.boolean(),
});

const staffWritableInputSchema = z.object({
  fullName: z.string().trim().min(1).max(100),
  shortName: optionalText(50),
  employeeCode: z.string().trim().max(50).nullable().optional(),
  branchId: z.number().int().positive().nullable().optional(),
  designationId: z.number().int().positive().nullable().optional(),
  mobile: optionalMobile(),
  email: optionalEmail(100),
  joinDate: z
    .union([
      z.literal(""),
      z.null(),
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    ])
    .optional(),
  aadhaar: optionalAadhaar(),
  pan: optionalPan(),
  deviceId: z.number().int().positive().nullable().optional(),
  moduleIds: z.array(z.number().int().positive()).optional(),
  status: z.number().int().min(0).max(1).optional(),
});

export const staffCreateInputSchema = staffWritableInputSchema.extend({
  roleId: z.number().int().positive().optional(),
  userName: z.string().trim().min(1).max(100),
  userPass: z.string().min(1).max(128),
});

export const staffUpdateInputSchema = staffWritableInputSchema.extend({
  roleId: z.number().int().positive().nullable().optional(),
  staffId: z.number().int().positive(),
  employeeCode: z.string().trim().min(1).max(50),
});

export const staffMutationResultSchema = z.object({
  staff_id: z.number(),
  employee_code: z.string().nullable().optional(),
  user_id: z.number().nullable().optional(),
  user_name: z.string().nullable().optional(),
});

/** DesignationList — active designations for the dropdown. */
export const designationDtoSchema = z.object({
  designation_id: z.number(),
  designation_name: z.string(),
  status: z.number().optional(),
});

/** ModuleAccessList — chips used in StaffAdd / StaffEdit module_ids. */
export const moduleAccessDtoSchema = z.object({
  module_id: z.number(),
  module_key: z.string(),
  module_label: z.string(),
  status: z.number().optional(),
});
