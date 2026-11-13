import { z } from "zod";
import {
  FIGURE_FIXED_OPT_CODE,
  FIGURE_PERCENT_OPT_CODE,
} from "../constants";

const MONEY_MAX = 999999.99;

function atMostTwoDecimals(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;
}

const moneySchema = z
  .number()
  .min(0)
  .max(MONEY_MAX)
  .refine(atMostTwoDecimals, { message: "At most 2 decimal places" });

export const chargeSetupSaveInputSchema = z
  .object({
    chargeId: z.number().int().positive().optional(),
    chargeName: z.string().trim().min(1).max(100),
    chargeType: z.number().int().nullable().optional(),
    chargeRate: moneySchema,
    figureCd: z.number().int().positive(),
    maxAmount: moneySchema.nullable().optional(),
    taxPercent: z
      .number()
      .min(0)
      .max(100)
      .refine(atMostTwoDecimals, { message: "At most 2 decimal places" })
      .optional(),
    duringCd: z.number().int().positive(),
    chargesGl: z.number().int().positive().nullable().optional(),
    isRefundable: z.boolean().optional(),
    isAdjustable: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.figureCd !== FIGURE_PERCENT_OPT_CODE || data.chargeRate <= 100,
    {
      message: "Percentage rate cannot exceed 100",
      path: ["chargeRate"],
    },
  )
  .refine(
    (data) =>
      data.figureCd !== FIGURE_FIXED_OPT_CODE ||
      data.maxAmount == null ||
      data.maxAmount >= data.chargeRate,
    {
      message: "Max amount cannot be less than the fixed charge rate",
      path: ["maxAmount"],
    },
  );

export const paginationMetaDtoSchema = z.object({
  total: z.number().optional(),
  page: z.number().optional(),
  per_page: z.number().optional(),
  last_page: z.number().optional(),
  has_more: z.boolean().optional(),
});
