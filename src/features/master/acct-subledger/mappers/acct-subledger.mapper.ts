import type {
  AcctSubledger,
  AcctSubledgerCreateDto,
  AcctSubledgerCreateInput,
  AcctSubledgerDto,
  AcctSubledgerUpdateDto,
  AcctSubledgerUpdateInput,
  PaginationMeta,
  PaginationMetaDto,
} from "@/features/master/acct-subledger/types/acct-subledger.types";

export function mapAcctSubledgerDto(dto: AcctSubledgerDto): AcctSubledger {
  return {
    subledgId: dto.subledg_id,
    subledgCode: dto.subledg_code,
    subledgName: dto.subledg_name,
    ledgerId: dto.ledger_id,
    ledgerCode: dto.ledger_code ?? null,
    ledgerName: dto.ledger_name ?? null,
    mainhdId: dto.mainhd_id ?? null,
    mainhdCode: dto.mainhd_code ?? null,
    mainhdName: dto.mainhd_name ?? null,
    isActive: dto.is_active === true,
    createdBy: dto.created_by ?? null,
    createdAt: dto.created_at ?? null,
    branchCount: dto.branch_count ?? 0,
  };
}

function mapWritable(input: AcctSubledgerCreateInput): AcctSubledgerCreateDto {
  const dto: AcctSubledgerCreateDto = {
    subledg_name: input.subledgName.trim(),
    ledger_id: input.ledgerId,
  };
  if (input.subledgCode != null && input.subledgCode.trim() !== "") {
    dto.subledg_code = input.subledgCode.trim();
  }
  if (input.isActive !== undefined) {
    dto.is_active = input.isActive === true;
  }
  return dto;
}

export function mapAcctSubledgerCreateToDto(
  input: AcctSubledgerCreateInput,
): AcctSubledgerCreateDto {
  return mapWritable(input);
}

export function mapAcctSubledgerUpdateToDto(
  input: AcctSubledgerUpdateInput,
): AcctSubledgerUpdateDto {
  return {
    ...mapWritable(input),
    subledg_id: input.subledgId,
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
