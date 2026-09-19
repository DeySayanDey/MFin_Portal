/**
 * RBI Lending Policy types — documented fields from apilist.txt only.
 */

/** Laravel RbiLendingPolicyGet / Update response `data`. */
export type RbiLendingPolicyDto = {
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
  updated_by: number | null;
  created_at: string;
  updated_at: string;
};

/** Frontend domain model (camelCase). */
export type RbiLendingPolicy = {
  policyId: number;
  maxAnnualHouseholdIncome: number;
  maxFoirPct: number;
  minJlgMembers: number;
  maxJlgMembers: number;
  maxSanction1stCycle: number;
  maxSanction2ndCycle: number;
  mandatoryPennyDrop: boolean;
  mandatoryBureauCheck: boolean;
  allowPrepaymentPenalty: boolean;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
};

/** Writable update payload (domain). */
export type RbiLendingPolicyUpdateInput = {
  maxAnnualHouseholdIncome: number;
  maxFoirPct: number;
  minJlgMembers: number;
  maxJlgMembers: number;
  maxSanction1stCycle: number;
  maxSanction2ndCycle: number;
  mandatoryPennyDrop?: boolean;
  mandatoryBureauCheck?: boolean;
  allowPrepaymentPenalty?: boolean;
};

/** Laravel RbiLendingPolicyUpdate request body. */
export type RbiLendingPolicyUpdateDto = {
  max_annual_household_income: number;
  max_foir_pct: number;
  min_jlg_members: number;
  max_jlg_members: number;
  max_sanction_1st_cycle: number;
  max_sanction_2nd_cycle: number;
  mandatory_penny_drop?: boolean;
  mandatory_bureau_check?: boolean;
  allow_prepayment_penalty?: boolean;
};

/** RBI Master Direction defaults used when Get returns 404. */
export const RBI_LENDING_POLICY_DEFAULTS: RbiLendingPolicyUpdateInput = {
  maxAnnualHouseholdIncome: 300000,
  maxFoirPct: 50,
  minJlgMembers: 4,
  maxJlgMembers: 10,
  maxSanction1stCycle: 50000,
  maxSanction2ndCycle: 80000,
  mandatoryPennyDrop: true,
  mandatoryBureauCheck: true,
  allowPrepaymentPenalty: false,
};
