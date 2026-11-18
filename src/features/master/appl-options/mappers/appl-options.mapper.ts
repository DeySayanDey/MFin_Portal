import type {
  ApplOption,
  ApplOptionDto,
} from "../types/appl-options.types";

export function mapApplOptionDto(dto: ApplOptionDto): ApplOption {
  return {
    optionId: dto.option_id,
    optGrpId: dto.opt_grp_id,
    optGroup: dto.opt_group ?? "",
    optCode: dto.opt_code,
    optDescription: dto.opt_description ?? "",
    srlNo: dto.srl_no ?? 0,
    isActive: dto.is_active !== false,
  };
}
