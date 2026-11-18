import { z } from "zod";

export const paginationMetaDtoSchema = z.object({
  total: z.number(),
  page: z.number().optional(),
  per_page: z.number().optional(),
  last_page: z.number().optional(),
  has_more: z.boolean().optional(),
});

const optionalPositiveInt = z.number().int().positive().nullable().optional();
const rate = z.number().min(0).max(100);

function hasMaxTwoDecimals(value: number): boolean {
  const scaled = value * 100;
  return Math.abs(scaled - Math.round(scaled)) < 1e-6;
}

export const loanSchemeSetupSaveInputSchema = z
  .object({
    schemeId: z.number().int().positive().optional(),
    schemeName: z.string().trim().min(1).max(150),
    productTypeCd: z.number().int().positive(),
    repayTypeCd: z.number().int().positive(),
    roiPercent: rate,
    inttTypeCd: z.number().int().positive(),
    repayScheduleCd: z.number().int().positive(),
    isInttCapitalisation: z.boolean().optional().default(false),
    capitalisationOnCd: optionalPositiveInt,
    isIncentive: z.boolean().optional().default(false),
    incentiveDay: z.number().int().min(1).max(31).nullable().optional(),
    incentiveRate: rate.nullable().optional(),
    isOverdue: z.boolean().optional().default(false),
    repayGraceDays: z.number().int().min(0).nullable().optional(),
    overdueOnCd: optionalPositiveInt,
    overdurRate: rate.nullable().optional(),
    isNpa: z.boolean().optional().default(false),
    npaAfterDays: z.number().int().min(1).nullable().optional(),
    isMortgageReqd: z.boolean().optional().default(false),
    isGuarantorReqd: z.boolean().optional().default(false),
    loanLedger: optionalPositiveInt,
    inttLedger: optionalPositiveInt,
    odinttLedger: optionalPositiveInt,
    fieldCollAllow: z.boolean().optional().default(false),
    isActive: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    if (!hasMaxTwoDecimals(data.roiPercent)) {
      ctx.addIssue({ code: "custom", path: ["roiPercent"] });
    }
    if (data.isInttCapitalisation && !data.capitalisationOnCd) {
      ctx.addIssue({ code: "custom", path: ["capitalisationOnCd"] });
    }
    if (data.isIncentive) {
      if (data.incentiveDay == null) {
        ctx.addIssue({ code: "custom", path: ["incentiveDay"] });
      }
      if (data.incentiveRate == null) {
        ctx.addIssue({ code: "custom", path: ["incentiveRate"] });
      } else if (!hasMaxTwoDecimals(data.incentiveRate)) {
        ctx.addIssue({ code: "custom", path: ["incentiveRate"] });
      }
    }
    if (data.isOverdue) {
      if (!data.overdueOnCd) {
        ctx.addIssue({ code: "custom", path: ["overdueOnCd"] });
      }
      if (data.overdurRate == null) {
        ctx.addIssue({ code: "custom", path: ["overdurRate"] });
      } else if (!hasMaxTwoDecimals(data.overdurRate)) {
        ctx.addIssue({ code: "custom", path: ["overdurRate"] });
      }
    }
    if (data.isNpa && data.npaAfterDays == null) {
      ctx.addIssue({ code: "custom", path: ["npaAfterDays"] });
    }
    if (
      data.loanLedger &&
      data.inttLedger &&
      data.loanLedger === data.inttLedger
    ) {
      ctx.addIssue({ code: "custom", path: ["inttLedger"] });
    }
    if (
      data.odinttLedger &&
      (data.odinttLedger === data.loanLedger ||
        data.odinttLedger === data.inttLedger)
    ) {
      ctx.addIssue({ code: "custom", path: ["odinttLedger"] });
    }
  });

export const loanSchemeChargeSaveInputSchema = z
  .object({
    schemeId: z.number().int().positive(),
    chargeIds: z.array(z.number().int().positive()),
    mode: z.enum(["create", "edit"]),
  })
  .refine((data) => data.mode === "edit" || data.chargeIds.length > 0, {
    path: ["chargeIds"],
  });
