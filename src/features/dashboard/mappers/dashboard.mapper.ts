import type {
  DashboardAgentDto,
  DashboardBranchDto,
  DashboardDto,
  DashboardFundsDto,
  DashboardKpiDto,
  DashboardLoanDto,
} from "../schemas/dashboard.schema";
import type {
  DashboardAgent,
  DashboardBranch,
  DashboardFunds,
  DashboardKpis,
  DashboardLoan,
  DashboardSnapshot,
} from "../types/dashboard.types";

function text(value: string | number | null | undefined): string {
  return value == null ? "" : String(value).trim();
}

function money(value: number | null | undefined): number {
  return value == null || !Number.isFinite(value) ? 0 : value;
}

export function mapDashboardKpis(dto: DashboardKpiDto): DashboardKpis {
  return {
    glp: money(dto.glp),
    disbursed: money(dto.disbursed),
    par90Amount: money(dto.par90_amount),
    par90Percent: money(dto.par90_percent),
    npaAmount: money(dto.npa_amount),
    npaPercent: money(dto.npa_percent),
    activeGroups: money(dto.active_groups),
    activeMembers: money(dto.active_members),
    savingsBalance: money(dto.savings_balance),
    pendingApplications: money(dto.pending_applications),
    collection: money(dto.collection),
  };
}

export function mapDashboardFunds(dto: DashboardFundsDto): DashboardFunds {
  const cash = money(dto.cash);
  const bank = money(dto.bank);
  return { cash, bank, total: money(dto.total) || cash + bank };
}

export function mapDashboardAgent(dto: DashboardAgentDto): DashboardAgent {
  return {
    staffId: dto.staff_id,
    staffName: text(dto.staff_name),
    groupCount: money(dto.group_count),
    target: money(dto.target),
    collected: money(dto.collected),
    wallet: money(dto.wallet),
    inField: dto.in_field,
  };
}

export function mapDashboardBranch(dto: DashboardBranchDto): DashboardBranch {
  return {
    branchId: dto.branch_id,
    branchName: text(dto.branch_name),
    loanBook: money(dto.loan_book),
    collection: money(dto.collection),
    vault: money(dto.vault),
    recoveryPercent: dto.recovery_percent ?? null,
  };
}

export function mapDashboardLoan(dto: DashboardLoanDto): DashboardLoan {
  return {
    loanAccountId: dto.loan_account_id,
    loanAccountNo: text(dto.loan_account_no),
    borrower: text(dto.borrower),
    groupName: text(dto.group_name),
    disbursed: money(dto.disbursed),
    principalPaid: money(dto.principal_paid),
    outstanding: money(dto.outstanding),
    dpd: Math.max(0, Math.round(money(dto.dpd))),
    statusCd: dto.status_cd ?? null,
    statusDesc: text(dto.status_desc),
  };
}

export function mapDashboard(dto: DashboardDto): DashboardSnapshot {
  return {
    fromDate: text(dto.from_date),
    toDate: text(dto.to_date),
    branchId: dto.branch_id ?? null,
    kpis: mapDashboardKpis(dto.kpis),
    funds: mapDashboardFunds(dto.funds),
    agents: (dto.agents ?? []).map(mapDashboardAgent),
    branches: (dto.branches ?? []).map(mapDashboardBranch),
    loans: (dto.loans ?? []).map(mapDashboardLoan),
  };
}
