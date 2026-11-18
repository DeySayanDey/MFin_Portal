/**
 * Application Options (mst_appl_options) types.
 * Used for system dropdowns and option lookups.
 */

export type ApplOption = {
  optionId: number;
  optGrpId: number;
  optGroup: string;
  optCode: number;
  optDescription: string;
  srlNo: number;
  isActive: boolean;
};

export type ApplOptionDto = {
  option_id: number;
  opt_grp_id: number;
  opt_group: string;
  opt_code: number;
  opt_description: string;
  srl_no?: number | null;
  is_active?: boolean | null;
};

export type ApplOptionQuery = {
  optGrpId: number;
  includeInactive?: boolean;
};
