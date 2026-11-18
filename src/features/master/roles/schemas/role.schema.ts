import { z } from "zod";

export const roleDtoSchema = z.object({
  id: z.number(),
  role_name: z.string(),
  description: z.string().nullable().optional(),
  is_admin: z.boolean(),
  status: z.number(),
  created_by: z.number().nullable().optional(),
  created_at: z.string(),
});

export const paginationMetaDtoSchema = z.object({
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  last_page: z.number(),
  has_more: z.boolean(),
});

export const roleCreateInputSchema = z.object({
  roleName: z
    .string()
    .trim()
    .min(1, "Role name is required")
    .max(100, "Role name must be at most 100 characters"),
  description: z
    .string()
    .trim()
    .max(255, "Description must be at most 255 characters")
    .optional(),
  isAdmin: z.boolean().optional(),
  status: z.number().int().optional(),
});

export const roleUpdateInputSchema = z.object({
  roleId: z.number().int().positive(),
  roleName: z
    .string()
    .trim()
    .min(1, "Role name is required")
    .max(100, "Role name must be at most 100 characters"),
  description: z
    .string()
    .max(255, "Description must be at most 255 characters")
    .nullable()
    .optional(),
  isAdmin: z.boolean().optional(),
  status: z.number().int().optional(),
});
