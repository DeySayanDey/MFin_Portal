import type {
  AcctSubledgerBranch,
  AcctSubledgerBranchCreateDto,
  AcctSubledgerBranchCreateInput,
  AcctSubledgerBranchDto,
  AcctSubledgerBranchUpdateDto,
  AcctSubledgerBranchUpdateInput,
  PaginationMeta,
  PaginationMetaDto,
} from "@/features/master/acct-subledger-branch/types/acct-subledger-branch.types";

export function mapAcctSubledgerBranchDto(
  dto: AcctSubledgerBranchDto,
): AcctSubledgerBranch {
  return {
    id: dto.id,
    branchId: dto.branch_id,
    branchCode: dto.branch_code ?? null,
    branchName: dto.branch_name ?? null,
    subledgId: dto.subledg_id,
    subledgCode: dto.subledg_code ?? null,
    subledgName: dto.subledg_name ?? null,
    ledgerId: dto.ledger_id ?? null,
    ledgerCode: dto.ledger_code ?? null,
    ledgerName: dto.ledger_name ?? null,
    isActive: dto.is_active === true,
    createdBy: dto.created_by ?? null,
    createdAt: dto.created_at ?? null,
  };
}

function mapWritable(
  input: AcctSubledgerBranchCreateInput,
): AcctSubledgerBranchCreateDto {
  const dto: AcctSubledgerBranchCreateDto = {
    branch_id: input.branchId,
    subledg_id: input.subledgId,
  };
  if (input.isActive !== undefined) {
    dto.is_active = input.isActive === true;
  }
  return dto;
}

export function mapAcctSubledgerBranchCreateToDto(
  input: AcctSubledgerBranchCreateInput,
): AcctSubledgerBranchCreateDto {
  return mapWritable(input);
}

export function mapAcctSubledgerBranchUpdateToDto(
  input: AcctSubledgerBranchUpdateInput,
): AcctSubledgerBranchUpdateDto {
  return {
    ...mapWritable(input),
    id: input.id,
  };
}

export function mapPaginationMetaDto(dto: PaginationMetaDto): PaginationMeta {
  return {
    total: dto.total,
    page: dto.page,
    perPage: dto.per_page,
    lastPage: dto.last_page,
    hasMore: dto.has_more,
  };
}
