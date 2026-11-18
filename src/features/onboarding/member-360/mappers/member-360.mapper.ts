import {
  SAVINGS_DEPOSIT_TYPE,
  TERM_DEPOSIT_TYPE,
} from "@/features/deposits/savings/deposit-account.constants";
import type { Member360Dto, Member360ProfileDto } from "../schemas/member-360.schema";
import type {
  Member360,
  Member360Deposit,
  Member360HolderRole,
  Member360KycStatus,
  Member360Loan,
  Member360Profile,
  Member360Totals,
} from "../types/member-360.types";

function text(value: string | number | null | undefined): string {
  return value == null ? "" : String(value).trim();
}

function amount(value: number | null | undefined): number {
  return value ?? 0;
}

function role(value: string | number | null | undefined): Member360HolderRole {
  const raw = text(value).toLowerCase();
  return raw === "joint" || raw === "group" ? raw : "primary";
}

function kycStatus(value: number | null | undefined): Member360KycStatus {
  return value === 1 || value === 2 ? value : 0;
}

export function mapMember360Profile(dto: Member360ProfileDto): Member360Profile {
  return {
    memberId: dto.member_id,
    memberCode: text(dto.member_code),
    refCode: text(dto.ref_code),
    memberName: text(dto.member_name),
    fatherName: text(dto.father_name),
    spouseName: text(dto.spouse_name),
    genderDesc: text(dto.gender_desc),
    dateOfBirth: text(dto.date_of_birth),
    age: dto.age ?? null,
    mobileNo: text(dto.mobile_no),
    alternateMobileNo: text(dto.alternate_mobile_no),
    emailId: text(dto.email_id),
    panMasked: text(dto.pan_masked),
    address: text(dto.address),
    branchId: dto.branch_id ?? null,
    branchName: text(dto.branch_name),
    centerName: text(dto.center_name),
    foName: text(dto.fo_name),
    joiningDate: text(dto.joining_date),
    occupation: text(dto.occupation),
    monthlyIncome: dto.monthly_income ?? null,
    statusCd: dto.status_cd ?? 0,
    statusDesc: text(dto.status_desc),
  };
}

function totals(deposits: Member360Deposit[], loans: Member360Loan[]): Member360Totals {
  const open = deposits.filter((row) => !row.isClosed);
  const active = loans.filter((row) => !row.isClosed);
  const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
  return {
    savingsBalance: sum(
      open.filter((row) => row.depositTypeCd === SAVINGS_DEPOSIT_TYPE).map((row) => amount(row.balance)),
    ),
    termBalance: sum(
      open.filter((row) => row.depositTypeCd === TERM_DEPOSIT_TYPE).map((row) => amount(row.balance)),
    ),
    loanOutstanding: sum(active.map((row) => row.outstanding)),
    loanOverdue: sum(active.map((row) => row.overdueAmount)),
    openDeposits: open.length,
    activeLoans: active.length,
  };
}

export function mapMember360Dto(dto: Member360Dto): Member360 {
  const deposits: Member360Deposit[] = dto.deposits.map((row) => ({
    accountId: row.account_id,
    depositTypeCd: row.deposit_type_cd ?? 0,
    fullAccountNo: text(row.full_account_no),
    applNo: text(row.appl_no),
    schemeName: text(row.scheme_name),
    holderRole: role(row.holder_role),
    openDate: text(row.open_date),
    balance: row.balance ?? null,
    maturityDate: text(row.maturity_date),
    maturityAmount: row.maturity_amt ?? null,
    statusCd: row.status_cd ?? 0,
    statusDesc: text(row.status_desc),
    isClosed: row.is_closed === true,
  }));

  const loans: Member360Loan[] = dto.loans.map((row) => ({
    loanAccountId: row.loan_account_id,
    loanAccountNo: text(row.loan_account_no),
    applicationNo: text(row.application_no),
    schemeName: text(row.scheme_name),
    borrowerRole: role(row.borrower_role),
    groupName: text(row.group_name),
    loanDate: text(row.loan_date),
    loanAmount: amount(row.loan_amount),
    disbursedAmount: amount(row.disbursed_amount),
    outstanding: amount(row.principal_outstanding),
    overdueAmount: amount(row.overdue_amount),
    overdueDays: row.overdue_days ?? 0,
    nextDueDate: text(row.next_due_date),
    nextDueAmount: row.next_due_amount ?? null,
    statusCd: row.status_cd ?? 0,
    statusDesc: text(row.status_desc),
    isClosed: row.is_closed === true,
    isNpa: row.is_npa === true,
  }));

  return {
    profile: mapMember360Profile(dto.profile),
    kyc: dto.kyc.map((row) => ({
      kycId: row.member_kyc_id,
      docTypeDesc: text(row.doc_type_desc),
      kycNoMasked: text(row.kyc_no_masked),
      verifyStatus: kycStatus(row.verify_status),
      expiryDate: text(row.expiry_date),
      isExpired: row.is_expired === true,
    })),
    groups: dto.groups.map((row) => ({
      groupId: row.group_id,
      groupCode: text(row.group_code),
      groupName: text(row.group_name),
      memberRole: text(row.member_role),
      joinDate: text(row.join_date),
      exitDate: text(row.exit_date),
      isActive: row.is_active === true,
    })),
    nominees: dto.nominees.map((row) => ({
      name: text(row.nominee_name),
      relationDesc: text(row.relation_desc),
      sharePercent: row.share_percent ?? null,
    })),
    shares: {
      totalShares: dto.shares?.total_shares ?? 0,
      faceValue: amount(dto.shares?.face_value),
      totalAmount: amount(dto.shares?.total_amount),
      paidAmount: amount(dto.shares?.paid_amount),
      pendingShares: dto.shares?.pending_shares ?? 0,
      lastSubscriptionDate: text(dto.shares?.last_subscription_date),
    },
    deposits,
    loans,
    applications: dto.applications.map((row) => ({
      applicationId: row.application_id,
      applicationNo: text(row.application_no),
      applicationDate: text(row.application_date),
      schemeName: text(row.scheme_name),
      amount: amount(row.appl_amount),
      statusDesc: text(row.status_desc),
    })),
    activity: dto.activity.map((row) => ({
      key: `${row.module}-${row.ref_id}`,
      date: text(row.trans_date),
      module: row.module,
      reference: text(row.reference),
      description: text(row.description),
      credit: amount(row.credit_amount),
      debit: amount(row.debit_amount),
    })),
    totals: totals(deposits, loans),
  };
}
