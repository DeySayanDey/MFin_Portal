import { z } from "zod";

export const applOptionDtoSchema = z.object({
  option_id: z.number().int().positive(),
  opt_grp_id: z.number().int().positive(),
  opt_group: z.string().default(""),
  opt_code: z.number().int(),
  opt_description: z.string().default(""),
  srl_no: z.number().int().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
});
