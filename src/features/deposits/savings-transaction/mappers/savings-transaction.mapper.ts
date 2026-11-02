import type { z } from "zod";
import type {
  savingsAccountBalanceSchema,
  savingsCustomerDtoSchema,
  savingsTransactionDtoSchema,
} from "../schemas/savings-transaction.schema";
import type {
  SavingsAccountBalance,
  SavingsCustomer,
  SavingsTransaction,
  SavingsTransactionAddInput,
  SavingsTransactionApproveInput,
} from "../types/savings-transaction.types";

type Dto = z.infer<typeof savingsTransactionDtoSchema>;

function text(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

export function mapSavingsTransactionDto(dto: Dto): SavingsTransaction {
  return {
    transId: dto.trans_id,
    transNo: text(dto.trans_no),
    accountId: dto.account_id,
    applNo: text(dto.appl_no),
    holderName: text(dto.holder_name),
    accountNo: dto.account_no ?? null,
    depositTypeCd: dto.deposit_type_cd ?? 0,
    depositTypeDesc: text(dto.deposit_type_desc),
    schemeCode: text(dto.scheme_code),
    schemeName: text(dto.scheme_name),
    transDate: text(dto.trans_date),
    effectDate: text(dto.effect_date),
    transMode: text(dto.trans_mode).toUpperCase(),
    transModeDesc: text(dto.trans_mode_desc),
    transTypeCd: dto.trans_type_cd ?? 0,
    transTypeDesc: text(dto.trans_type_desc),
    transAmount: dto.trans_amount ?? 0,
    balanceAfter: dto.balance_after ?? null,
    ledgerNarration: text(dto.ledger_narration),
    branchName: text(dto.branch_name),
    foName: text(dto.fo_name),
    remarks: text(dto.remarks),
    statusCd: dto.status_cd ?? 0,
    statusDesc: text(dto.status_desc),
    createdBy: dto.created_by ?? null,
    createdByName: text(dto.created_by_name),
    createdAt: dto.created_at ?? null,
    approvedByName: text(dto.approved_by_name),
    approvedAt: dto.approved_at ?? null,
  };
}

export function mapSavingsTransactionAddToDto(
  input: SavingsTransactionAddInput,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    account_id: input.accountId,
    trans_type_cd: input.transTypeCd,
    trans_amount: input.transAmount,
  };
  if (input.transMode) payload.trans_mode = input.transMode;
  if (input.transDate) payload.trans_date = input.transDate;
  if (input.effectDate) payload.effect_date = input.effectDate;
  if (input.foId != null) payload.fo_id = input.foId;
  if (input.ledgerNarration?.trim()) {
    payload.ledger_narration = input.ledgerNarration.trim();
  }
  if (input.remarks?.trim()) payload.remarks = input.remarks.trim();
  return payload;
}

type CustomerDto = z.infer<typeof savingsCustomerDtoSchema>;
type BalanceDto = z.infer<typeof savingsAccountBalanceSchema>;

export function mapSavingsCustomerDto(dto: CustomerDto): SavingsCustomer {
  return {
    custTypeCd: dto.cust_type_cd ?? 0,
    custTypeDesc: text(dto.cust_type_desc),
    custId: dto.cust_id,
    name: text(dto.name),
    refCode: text(dto.ref_code),
    mobileNo: text(dto.mobile_no) || null,
    memberId: dto.member_id ?? null,
    groupId: dto.group_id ?? null,
    accounts: (dto.accounts ?? []).map((account) => ({
      accountId: account.account_id,
      fullAccountNo: text(account.full_account_no),
      applNo: text(account.appl_no),
      holderName: text(account.holder_name),
      depositTypeCd: account.deposit_type_cd ?? 0,
      depositTypeDesc: text(account.deposit_type_desc),
      schemeCode: text(account.scheme_code),
      schemeName: text(account.scheme_name),
      branchId: account.branch_id ?? null,
      branchName: text(account.branch_name),
      statusCd: account.status_cd ?? 0,
      statusDesc: text(account.status_desc),
      currentBalance: account.current_balance ?? null,
      availableBalance: account.available_balance ?? null,
    })),
  };
}

export function mapSavingsAccountBalanceDto(dto: BalanceDto): SavingsAccountBalance {
  return {
    accountId: dto.account_id,
    currentBalance: dto.current_balance ?? null,
    availableBalance: dto.available_balance ?? null,
    pendingCount: dto.pending_count ?? 0,
    canDeposit: dto.can_deposit !== false,
    canWithdraw: dto.can_withdraw === true,
    withdrawableAmount: dto.withdrawable_amount ?? null,
    depositRemaining: dto.deposit_remaining ?? null,
    instAmount: dto.inst_amount ?? null,
    maturityDate: text(dto.maturity_date) || null,
    startDate: text(dto.start_date) || null,
    minBalance: dto.min_balance ?? null,
    vouchersMissing: dto.vouchers_missing ?? 0,
    isClosed: dto.is_closed === true,
    statusCd: dto.status_cd ?? 0,
    statusDesc: text(dto.status_desc),
  };
}

export function mapSavingsTransactionApproveToDto(
  input: SavingsTransactionApproveInput,
): Record<string, unknown> {
  return {
    trans_id: input.transId,
    approve: input.approve,
    remarks: input.remarks?.trim() || null,
  };
}
