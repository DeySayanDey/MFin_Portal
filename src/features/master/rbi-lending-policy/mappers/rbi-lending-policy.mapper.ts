import type {
  RbiLendingPolicy,
  RbiLendingPolicyUpdateDto,
  RbiLendingPolicyUpdateInput,
} from "@/features/master/rbi-lending-policy/types/rbi-lending-policy.types";

export function mapRbiLendingPolicyDto(dto: {
  policy_id: number;
  max_annual_household_income: number;
  max_foir_pct: number;
  min_jlg_members: number;
  max_jlg_members: number;
  max_sanction_1st_cycle: number;
  max_sanction_2nd_cycle: number;
  mandatory_penny_drop: boolean;
  mandatory_bureau_check: boolean;
  allow_prepayment_penalty: boolean;
  updated_by?: number | null;
  created_at: string;
  updated_at: string;
}): RbiLendingPolicy {
  return {
    policyId: dto.policy_id,
    maxAnnualHouseholdIncome: dto.max_annual_household_income,
    maxFoirPct: dto.max_foir_pct,
    minJlgMembers: dto.min_jlg_members,
    maxJlgMembers: dto.max_jlg_members,
    maxSanction1stCycle: dto.max_sanction_1st_cycle,
    maxSanction2ndCycle: dto.max_sanction_2nd_cycle,
    mandatoryPennyDrop: dto.mandatory_penny_drop,
    mandatoryBureauCheck: dto.mandatory_bureau_check,
    allowPrepaymentPenalty: dto.allow_prepayment_penalty,
    updatedBy: dto.updated_by ?? null,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

export function mapRbiLendingPolicyUpdateToDto(
  input: RbiLendingPolicyUpdateInput,
): RbiLendingPolicyUpdateDto {
  const dto: RbiLendingPolicyUpdateDto = {
    max_annual_household_income: input.maxAnnualHouseholdIncome,
    max_foir_pct: input.maxFoirPct,
    min_jlg_members: input.minJlgMembers,
    max_jlg_members: input.maxJlgMembers,
    max_sanction_1st_cycle: input.maxSanction1stCycle,
    max_sanction_2nd_cycle: input.maxSanction2ndCycle,
  };

  if (input.mandatoryPennyDrop !== undefined) {
    dto.mandatory_penny_drop = input.mandatoryPennyDrop;
  }
  if (input.mandatoryBureauCheck !== undefined) {
    dto.mandatory_bureau_check = input.mandatoryBureauCheck;
  }
  if (input.allowPrepaymentPenalty !== undefined) {
    dto.allow_prepayment_penalty = input.allowPrepaymentPenalty;
  }

  return dto;
}
