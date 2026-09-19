import { z } from "zod";

export const auditLogDtoSchema = z.object({
  audit_id: z.number(),
  user_id: z.number().nullable().optional(),
  menu_name: z.string().nullable().optional(),
  table_name: z.string().nullable().optional(),
  record_id: z.number().nullable().optional(),
  action: z.number(),
  action_name: z.string(),
  old_values: z.unknown().nullable().optional(),
  new_values: z.unknown().nullable().optional(),
  ip_address: z.string().nullable().optional(),
  user_agent: z.string().nullable().optional(),
  created_at: z.string(),
});

export const paginationMetaDtoSchema = z.object({
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  last_page: z.number(),
  has_more: z.boolean(),
});
