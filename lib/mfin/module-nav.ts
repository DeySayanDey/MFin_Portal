import type { MFinSidebarLink } from "@/lib/mfin/types";

function withActive(links: MFinSidebarLink[], route: string): MFinSidebarLink[] {
  return links.map((link) => ({ ...link, active: link.href === route }));
}

export const masterSidebar: MFinSidebarLink[] = [
  { label: "Company Profile", href: "/master/company-profile" },
  { label: "Series & Auto-Number", href: "/master/series" },
  { label: "Software Timings", href: "/master/timings" },
  { label: "Roles & Permissions", href: "/master/roles" },
  { label: "SMS & WhatsApp Gateway", href: "/master/gateway" },
  { label: "RBI Lending Policies", href: "/master/rbi-policies" },
  { label: "Database & Seed (25+)", href: "/master/database-seed" },
  { label: "Maker-Checker Rules", href: "/master/maker-checker" },
  { label: "Loan Schemes Master", href: "/master/loan-schemes" },
  { label: "Kendra & JLG Master", href: "/master/kendra-jlg" },
  { label: "N-Level COA Tree Master", href: "/master/coa-tree" },
  { label: "Staff Master", href: "/master/staff" },
  { label: "Branch Vault Master", href: "/master/branch-vault" },
  { label: "Wi-Fi Sync Master", href: "/master/wifi-sync" },
];

export const accountingSidebar: MFinSidebarLink[] = [
  { label: "Voucher Entry Studio", href: "/accounting/voucher-entry" },
  { label: "Journal Adjustment", href: "/accounting/journal-adjustment" },
  { label: "Cash/Bank Deposit", href: "/accounting/cash-deposit" },
  { label: "Savings Withdrawal", href: "/accounting/savings-withdrawal" },
  { label: "Contra Transfer", href: "/accounting/contra-transfer" },
  { label: "Chart of Accounts", href: "/accounting/coa" },
  { label: "Trial Balance", href: "/accounting/trial-balance" },
  { label: "Cash & Bank Book", href: "/accounting/cashbook" },
];

export const lendingSidebar: MFinSidebarLink[] = [
  { label: "Borrower KYC Registry", href: "/customer-kyc" },
  { label: "LOS Underwriting", href: "/los/applications" },
  { label: "LMS Collections", href: "/lms/collections" },
  { label: "Repayment Schedule", href: "/lms/repayment-schedule" },
  { label: "Active Loan Book", href: "/lms/loan-book" },
  { label: "PAR / NPA Monitor", href: "/lms/par-npa" },
  { label: "Defaulters & Legal", href: "/lms/defaulters" },
  { label: "Portfolio Reports", href: "/lms/reports" },
];

export const depositsSidebar: MFinSidebarLink[] = [
  { label: "Deposits Hub", href: "/deposits" },
  { label: "Bachat Gat Savings", href: "/deposits/savings" },
  { label: "Recurring Deposits", href: "/deposits/rd" },
  { label: "Fixed Deposits", href: "/deposits/fd" },
  { label: "Member Ledger", href: "/deposits/member-ledger" },
  { label: "Interest Posting", href: "/deposits/interest" },
  { label: "Withdrawal Requests", href: "/deposits/withdrawals" },
];

export const misSidebar: MFinSidebarLink[] = [
  { label: "MIS Studio Hub", href: "/mis" },
  { label: "Daily Business MIS", href: "/mis/daily-business" },
  { label: "Portfolio Health", href: "/mis/portfolio-health" },
  { label: "Kendra Demand Sheet", href: "/mis/demand-sheet" },
  { label: "Collection Register", href: "/mis/collection" },
  { label: "Disbursement Report", href: "/mis/disbursement" },
  { label: "Branch Scorecard", href: "/mis/branch-scorecard" },
  { label: "PAR Aging", href: "/mis/par-aging" },
  { label: "NPA Provisioning", href: "/mis/npa-provisioning" },
  { label: "Regulatory Returns", href: "/mis/regulatory" },
  { label: "Scheduled Exports", href: "/mis/exports" },
];

export const hrSidebar: MFinSidebarLink[] = [
  { label: "Staff Directory & HR", href: "/hr/staff" },
  { label: "Member Transfers", href: "/hr/member-transfers" },
  { label: "Employee Transfers", href: "/hr/transfers" },
  { label: "Monthly Staff Payroll", href: "/hr/payroll" },
  { label: "SMS & WhatsApp Broadcast", href: "/hr/messaging" },
];

export const securitySidebar: MFinSidebarLink[] = [
  { label: "My Profile", href: "/profile" },
  { label: "Change Password & 2FA", href: "/profile/password" },
  { label: "Activity & Audit Log", href: "/profile/activity" },
  { label: "Employee User Directory", href: "/security/users" },
  { label: "Security Role Master", href: "/security/roles" },
  { label: "Role-Menu Matrix", href: "/security/menu-matrix" },
  { label: "Page Action Permissions", href: "/security/permissions" },
];

export function sidebarForModule(module: string, route: string): MFinSidebarLink[] {
  const map: Record<string, MFinSidebarLink[]> = {
    master: masterSidebar,
    accounting: accountingSidebar,
    lending: lendingSidebar,
    deposits: depositsSidebar,
    mis: misSidebar,
    hr: hrSidebar,
    security: securitySidebar,
  };
  return withActive(map[module] ?? [], route);
}
