import { z } from "zod";

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
  designation_id: z.number().nullable().optional(),
  designation_name: z.string().nullable().optional(),
  mobile: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  join_date: z.string().nullable().optional(),
  aadhaar: z.string().nullable().optional(),
  pan: z.string().nullable().optional(),
  monthly_salary: z.coerce.number().nullable().optional(),
  collection_target: z.coerce.number().nullable().optional(),
  assignment: z.string().nullable().optional(),
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

const optionalEmail = z
  .union([z.literal(""), z.null(), z.string().trim().email().max(100)])
  .optional();

const optionalText = z.string().trim().nullable().optional();

export const staffCreateInputSchema = z.object({
  fullName: z.string().trim().min(1).max(100),
  employeeCode: z.string().trim().max(50).nullable().optional(),
  branchId: z.number().int().positive().nullable().optional(),
  designationId: z.number().int().positive().nullable().optional(),
  mobile: optionalText,
  email: optionalEmail,
  joinDate: z
    .union([
      z.literal(""),
      z.null(),
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    ])
    .optional(),
  aadhaar: optionalText,
  pan: optionalText,
  monthlySalary: z.number().nonnegative().nullable().optional(),
  collectionTarget: z.number().nonnegative().nullable().optional(),
  assignment: optionalText,
  moduleIds: z.array(z.number().int().positive()).optional(),
  status: z.number().int().min(0).max(1).optional(),
});

export const staffUpdateInputSchema = staffCreateInputSchema.extend({
  staffId: z.number().int().positive(),
  employeeCode: z.string().trim().min(1).max(50),
});

export const staffMutationResultSchema = z.object({
  staff_id: z.number(),
  employee_code: z.string().nullable().optional(),
});

/** DesignationList — shape inferred from StaffList designation fields. */
export const designationDtoSchema = z.object({
  designation_id: z.number(),
  designation_name: z.string(),
});

/** ModuleAccessList — shape matches StaffList module_access chips. */
export const moduleAccessDtoSchema = z.object({
  module_id: z.number(),
  module_key: z.string(),
  module_label: z.string(),
});
