import type {
  AcctLedger,
  AcctLedgerCreateDto,
  AcctLedgerCreateInput,
  AcctLedgerDto,
  AcctLedgerUpdateDto,
  AcctLedgerUpdateInput,
  PaginationMeta,
  PaginationMetaDto,
} from "@/features/master/acct-ledger/types/acct-ledger.types";

export function mapAcctLedgerDto(dto: AcctLedgerDto): AcctLedger {
  return {
    ledgerId: dto.ledger_id,
    ledgerCode: dto.ledger_code,
    ledgerName: dto.ledger_name,
    ledgerType: dto.ledger_type != null && String(dto.ledger_type).trim() ? String(dto.ledger_type).trim() : null,
    adjustableEligible: dto.adjustable_eligible == null ? null : dto.adjustable_eligible === true || dto.adjustable_eligible === 1 || dto.adjustable_eligible === "1",
    mainhdId: dto.mainhd_id,
    mainhdCode: dto.mainhd_code ?? null,
    mainhdName: dto.mainhd_name ?? null,
    categId: dto.categ_id ?? null,
    categCode: dto.categ_code ?? null,
    categName: dto.categ_name ?? null,
    isActive: dto.is_active === true,
    createdBy: dto.created_by ?? null,
    createdAt: dto.created_at ?? null,
    subledgerCount: dto.subledger_count ?? 0,
  };
}

function mapWritable(input: AcctLedgerCreateInput): AcctLedgerCreateDto {
  const dto: AcctLedgerCreateDto = {
    ledger_name: input.ledgerName.trim(),
    mainhd_id: input.mainhdId,
  };
  if (input.ledgerCode !== undefined) {
    dto.ledger_code =
      input.ledgerCode == null || input.ledgerCode.trim() === ""
        ? null
        : input.ledgerCode.trim();
  }
  if (input.ledgerType !== undefined) {
    dto.ledger_type =
      input.ledgerType == null || String(input.ledgerType).trim() === ""
        ? null
        : typeof input.ledgerType === "number"
          ? input.ledgerType
          : /^\d+$/.test(input.ledgerType.trim())
            ? Number(input.ledgerType.trim())
            : input.ledgerType.trim();
  }
  if (input.isActive !== undefined) {
    dto.is_active = input.isActive === true;
  }
  return dto;
}

export function mapAcctLedgerCreateToDto(
  input: AcctLedgerCreateInput,
): AcctLedgerCreateDto {
  return mapWritable(input);
}

export function mapAcctLedgerUpdateToDto(
  input: AcctLedgerUpdateInput,
): AcctLedgerUpdateDto {
  return {
    ...mapWritable(input),
    ledger_id: input.ledgerId,
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
