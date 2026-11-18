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

const nullableText = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value == null) return null;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  });

export const roleMenuRoleDtoSchema = z.object({
  role_id: z.coerce.number().int().positive(),
  role_name: z.string(),
  description: nullableText,
  is_admin: boolish,
  status: z.coerce.number().int(),
});

export const roleMenuItemDtoSchema = z.object({
  menu_sl: z.coerce.number().int().positive(),
  menu_id: z.coerce.number().int(),
  menu_name: nullableText,
  submenu_id: z
    .union([z.coerce.number().int(), z.null()])
    .optional()
    .transform((value) => value ?? null),
  submenu_name: nullableText,
  icon: nullableText,
  route: nullableText,
  menu_status: z.coerce.number().int(),
  assigned: boolish,
  allow_create: boolish,
  allow_read: boolish,
  allow_edit: boolish,
  allow_del: boolish,
  allow_approve: boolish,
  allow_reverse: boolish,
  allow_print: boolish,
  grant_status: z.coerce.number().int().nullable().optional(),
  role_menu_id: z.coerce.number().int().nullable().optional(),
});

export const roleMenuPayloadDtoSchema = z.object({
  role: roleMenuRoleDtoSchema,
  assigned_count: z.coerce.number().int().nonnegative(),
  menus: z.array(roleMenuItemDtoSchema),
});

export const roleMenuGrantInputSchema = z.object({
  menuSl: z.number().int().positive({ message: "Menu is required" }),
  allowCreate: z.boolean().optional(),
  allowRead: z.boolean().optional(),
  allowEdit: z.boolean().optional(),
  allowDel: z.boolean().optional(),
  allowApprove: z.boolean().optional(),
  allowReverse: z.boolean().optional(),
  allowPrint: z.boolean().optional(),
  status: z.number().int().min(0).max(1).optional(),
});

export const roleMenuAssignInputSchema = z.object({
  roleId: z.number().int().positive({ message: "Role is required" }),
  menus: z.array(roleMenuGrantInputSchema),
});

export type RoleMenuAssignInputParsed = z.infer<
  typeof roleMenuAssignInputSchema
>;
