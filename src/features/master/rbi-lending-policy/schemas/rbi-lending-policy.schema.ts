import { z } from "zod";

/** Loose runtime check for RbiLendingPolicyGet / Update response data. */
export const rbiLendingPolicyDtoSchema = z.object({
  policy_id: z.number(),
  max_annual_household_income: z.number(),
  max_foir_pct: z.number(),
  min_jlg_members: z.number(),
  max_jlg_members: z.number(),
  max_sanction_1st_cycle: z.number(),
  max_sanction_2nd_cycle: z.number(),
  mandatory_penny_drop: z.boolean(),
  mandatory_bureau_check: z.boolean(),
  allow_prepayment_penalty: z.boolean(),
  updated_by: z.number().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Domain update validation — documented rules only.
 * max JLG members must be ≥ min JLG members.
 */
export const rbiLendingPolicyUpdateInputSchema = z
  .object({
    maxAnnualHouseholdIncome: z
      .number()
      .int()
      .positive("Max annual household income must be a positive amount"),
    maxFoirPct: z
      .number()
      .int()
      .min(1, "FOIR must be at least 1%")
      .max(100, "FOIR must be at most 100%"),
    minJlgMembers: z
      .number()
      .int()
      .min(1, "Min JLG members must be at least 1"),
    maxJlgMembers: z
      .number()
      .int()
      .min(1, "Max JLG members must be at least 1"),
    maxSanction1stCycle: z
      .number()
      .int()
      .positive("1st cycle sanction limit must be a positive amount"),
    maxSanction2ndCycle: z
      .number()
      .int()
      .positive("2nd+ cycle sanction limit must be a positive amount"),
    mandatoryPennyDrop: z.boolean().optional(),
    mandatoryBureauCheck: z.boolean().optional(),
    allowPrepaymentPenalty: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.maxJlgMembers < value.minJlgMembers) {
      ctx.addIssue({
        code: "custom",
        path: ["maxJlgMembers"],
        message: "Max JLG members must be greater than or equal to min JLG members",
      });
    }
  });

export type RbiLendingPolicyUpdateInputParsed = z.infer<
  typeof rbiLendingPolicyUpdateInputSchema
>;
