import { z } from "zod";

const MAX_AMOUNT = 9_999_999_999;
const MAX_AMT_PER_1000 = 999_999.99;

function hasMaxTwoDecimals(value: number): boolean {
  const scaled = value * 100;
  return Math.abs(scaled - Math.round(scaled)) < 1e-6;
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export const loanSchemeSlabSaveInputSchema = z
  .object({
    id: z.number().int().positive().optional(),
    schemeId: z.number().int().positive(),
    minAmount: z.number().int().min(0).max(MAX_AMOUNT),
    maxAmount: z.number().int().min(1).max(MAX_AMOUNT),
    roi: z.number().min(0).max(100),
    maxDuration: z.number().int().min(1).max(32767),
    amtPer1000: z.number().min(0).max(MAX_AMT_PER_1000).nullable().optional(),
    effectFrom: z.string().min(1),
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.maxAmount < data.minAmount) {
      ctx.addIssue({ code: "custom", path: ["maxAmount"] });
    }
    if (!hasMaxTwoDecimals(data.roi)) {
      ctx.addIssue({ code: "custom", path: ["roi"] });
    }
    if (
      data.amtPer1000 != null &&
      !hasMaxTwoDecimals(data.amtPer1000)
    ) {
      ctx.addIssue({ code: "custom", path: ["amtPer1000"] });
    }
    if (!isIsoDate(data.effectFrom)) {
      ctx.addIssue({ code: "custom", path: ["effectFrom"] });
    }
  });
