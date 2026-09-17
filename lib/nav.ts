import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Menu,
  Landmark,
  HandCoins,
  PiggyBank,
  BarChart3,
  UsersRound,
  ShieldCheck,
  Vault,
  UserRoundPlus,
  FileSpreadsheet,
  ClipboardList,
  MapPinned,
  Building2,
  UserCircle2,
  Wallet,
  ArrowUpDown,
  Clock3,
  Shield,
  RadioTower,
  Scale,
  Database,
  SlidersHorizontal,
  GitBranch,
  Network,
  UserRound,
  Wifi,
  Receipt,
  BookOpen,
  Banknote,
  ArrowLeftRight,
  NotebookTabs,
  BookMarked,
  Activity,
} from "lucide-react";


export type NavTone = "green" | "blue" | "amber" | "violet" | "rose" | "slate";

export type NavSubItem = {
  label: string;
  href: string;
  icon?: LucideIcon;
  badge?: string;
};

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  tone: NavTone;
  children?: NavSubItem[];
};

export const primaryNav: NavItem = {
  label: "Executive Dashboard",
  href: "/",
  icon: LayoutDashboard,
  tone: "green",
};

export const mainModules: NavItem[] = [
  {
    label: "Master Menu",
    href: "/master/company-profile",
    icon: Menu,
    badge: "14",
    tone: "blue",
    children: [
      {
        label: "Company Profile",
        href: "/master/company-profile",
        icon: Building2,
      },
      {
        label: "Series & Auto-Number",
        href: "/master/series",
        icon: ArrowUpDown,
      },
      { label: "Software Timings", href: "/master/timings", icon: Clock3 },
      { label: "Roles & Permissions", href: "/master/roles", icon: Shield },
      {
        label: "SMS & WhatsApp Gateway",
        href: "/master/gateway",
        icon: RadioTower,
      },
      {
        label: "RBI Lending Policies",
        href: "/master/rbi-policies",
        icon: Scale,
      },
      {
        label: "Database & Seed (25+)",
        href: "/master/database-seed",
        icon: Database,
        badge: "25+",
      },
      {
        label: "Loan Schemes Master",
        href: "/master/loan-schemes",
        icon: SlidersHorizontal,
      },
      {
        label: "Kendra & JLG Master",
        href: "/master/kendra-jlg",
        icon: GitBranch,
      },
      {
        label: "N-Level COA Tree Master",
        href: "/master/coa-tree",
        icon: Network,
      },
      { label: "Staff Master", href: "/master/staff", icon: UserRound },
      {
        label: "Branch Vault Master",
        href: "/master/branch-vault",
        icon: Vault,
      },
      {
        label: "Maker-Checker Rules",
        href: "/master/maker-checker",
        icon: ShieldCheck,
      },
      { label: "Wi-Fi Sync Master", href: "/master/wifi-sync", icon: Wifi },
    ],
  },
  {
    label: "Finance & General Ledger",
    href: "/accounting",
    icon: Landmark,
    badge: "11",
    tone: "green",
    children: [
      {
        label: "Voucher Entry Studio",
        href: "/accounting/voucher-entry",
        icon: Receipt,
      },
      {
        label: "Journal Adjustment",
        href: "/accounting/journal-adjustment",
        icon: BookOpen,
      },
      {
        label: "Cash/Bank Deposit",
        href: "/accounting/cash-deposit",
        icon: Banknote,
      },
      {
        label: "Savings Withdrawal",
        href: "/accounting/savings-withdrawal",
        icon: Wallet,
      },
      {
        label: "Contra Transfer",
        href: "/accounting/contra-transfer",
        icon: ArrowLeftRight,
      },
      {
        label: "Chart of Accounts",
        href: "/accounting/coa",
        icon: Network,
      },
      {
        label: "Trial Balance",
        href: "/accounting/trial-balance",
        icon: Scale,
      },
      {
        label: "Cash & Bank Book",
        href: "/accounting/cashbook",
        icon: BookMarked,
      },
    ],
  },
  {
    label: "Lending & Loan Operations",
    href: "/lms",
    icon: HandCoins,
    badge: "8",
    tone: "amber",
    children: [
      { label: "Borrower KYC Registry", href: "/customer-kyc", icon: UserRoundPlus },
      { label: "LOS Applications", href: "/los/applications", icon: FileSpreadsheet },
      { label: "LMS Collections", href: "/lms/collections", icon: HandCoins },
      { label: "Repayment Schedule", href: "/lms/repayment-schedule", icon: NotebookTabs },
      { label: "Active Loan Book", href: "/lms/loan-book", icon: BookOpen },
      { label: "PAR / NPA Monitor", href: "/lms/par-npa", icon: BarChart3 },
      { label: "Defaulters & Legal", href: "/lms/defaulters", icon: Scale },
      { label: "Portfolio Reports", href: "/lms/reports", icon: ClipboardList },
    ],
  },
  {
    label: "Deposits & Member Savings",
    href: "/deposits",
    icon: PiggyBank,
    badge: "6",
    tone: "violet",
    children: [
      { label: "Savings Accounts", href: "/deposits/savings", icon: PiggyBank },
      { label: "Recurring Deposits", href: "/deposits/rd", icon: Clock3 },
      { label: "Term Deposits", href: "/deposits/fd", icon: Landmark },
      { label: "Member Ledger", href: "/deposits/member-ledger", icon: BookMarked },
      { label: "Interest Posting", href: "/deposits/interest", icon: Banknote },
      { label: "Withdrawal Requests", href: "/deposits/withdrawals", icon: Wallet },
    ],
  },
  {
    label: "MIS & Reporting Studio",
    href: "/mis",
    icon: BarChart3,
    badge: "9",
    tone: "blue",
    children: [
      { label: "Daily Business MIS", href: "/mis/daily-business", icon: ClipboardList },
      { label: "Portfolio Health", href: "/mis/portfolio-health", icon: Activity },
      { label: "Kendra Demand Sheet", href: "/mis/demand-sheet", icon: MapPinned },
      { label: "Collection Register", href: "/mis/collection", icon: Receipt },
      { label: "Disbursement Report", href: "/mis/disbursement", icon: Banknote },
      { label: "Branch Scorecard", href: "/mis/branch-scorecard", icon: Building2 },
      { label: "PAR Aging", href: "/mis/par-aging", icon: Clock3 },
      { label: "NPA Provisioning", href: "/mis/npa-provisioning", icon: Scale },
      { label: "Scheduled Exports", href: "/mis/exports", icon: FileSpreadsheet },
    ],
  },
  {
    label: "HR, Payroll & Messaging",
    href: "/hr",
    icon: UsersRound,
    badge: "4",
    tone: "rose",
    children: [
      { label: "Staff Directory", href: "/hr/staff", icon: UserRound },
      { label: "Attendance", href: "/hr/attendance", icon: Clock3 },
      { label: "Payroll Runs", href: "/hr/payroll", icon: Banknote },
      { label: "Internal Messaging", href: "/hr/messaging", icon: RadioTower },
    ],
  },
  {
    label: "User Management & Security",
    href: "/security",
    icon: ShieldCheck,
    badge: "5",
    tone: "slate",
    children: [
      { label: "My Profile", href: "/profile", icon: UserCircle2 },
      { label: "Employee Directory", href: "/security/users", icon: UsersRound },
      { label: "Security Role Master", href: "/security/roles", icon: Shield },
      { label: "Role-Menu Matrix", href: "/security/menu-matrix", icon: Network },
      { label: "Page Action Permissions", href: "/security/permissions", icon: ShieldCheck },
    ],
  },
  {
    label: "Branch Vault & Field Sync",
    href: "/branch-vault",
    icon: Vault,
    badge: "3",
    tone: "green",
    children: [
      { label: "Vault Cash Position", href: "/branch-vault/cash-position", icon: Vault },
      { label: "Field Wallet Hand-in", href: "/branch-vault/hand-in", icon: Wallet },
      { label: "Offline Sync Queue", href: "/branch-vault/sync-queue", icon: Wifi },
    ],
  },
];

export const workflowLinks = [
  {
    label: "Onboard Borrower & KYC",
    href: "/customer-kyc",
    icon: UserRoundPlus,
    tone: "blue" as const,
  },
  {
    label: "Loan Origination (LOS)",
    href: "/los",
    icon: FileSpreadsheet,
    tone: "green" as const,
  },
  {
    label: "Loan Management (LMS)",
    href: "/lms",
    icon: ClipboardList,
    tone: "amber" as const,
  },
  {
    label: "Field Force Collection",
    href: "/field-force",
    icon: MapPinned,
    tone: "violet" as const,
  },
];

export const rolePortals = [
  {
    label: "Super Admin",
    href: "/",
    match: (pathname: string) => pathname === "/",
  },
  {
    label: "Branch Manager",
    href: "/branch-vault",
    match: (pathname: string) => pathname.startsWith("/branch-vault"),
  },
  {
    label: "Field Agent",
    href: "/field-force",
    match: (pathname: string) =>
      pathname.startsWith("/field-force") ||
      pathname.startsWith("/agent-portal"),
  },
  {
    label: "Customer Self-Pay",
    href: "/customer-portal",
    match: (pathname: string) => pathname.startsWith("/customer-portal"),
  },
] as const;

export type RolePortal = (typeof rolePortals)[number];

export function resolveActiveRole(pathname: string): RolePortal {
  return (
    rolePortals.find(
      (role) => role.label !== "Super Admin" && role.match(pathname),
    ) ?? rolePortals[0]
  );
}

export const currentUser = {
  name: "Rajesh Patil",
  initials: "SU",
  role: "SuperAdmin",
  branchCode: "WB01",
  branch: "Kolkata Shyambazar Hub Branch",
  status: "Live" as const,
};

export const toneClasses: Record<NavTone, { icon: string; badge: string }> = {
  green: {
    icon: "bg-brand-soft text-brand-ink",
    badge: "bg-brand-soft text-brand-ink",
  },
  blue: {
    icon: "bg-accent-blue-soft text-accent-blue",
    badge: "bg-slate-100 text-slate-600",
  },
  amber: {
    icon: "bg-accent-amber-soft text-amber-700",
    badge: "bg-slate-100 text-slate-600",
  },
  violet: {
    icon: "bg-accent-violet-soft text-accent-violet",
    badge: "bg-slate-100 text-slate-600",
  },
  rose: {
    icon: "bg-accent-rose-soft text-accent-rose",
    badge: "bg-slate-100 text-slate-600",
  },
  slate: {
    icon: "bg-slate-100 text-slate-600",
    badge: "bg-slate-100 text-slate-600",
  },
};

export const quickLinks = [
  { label: "Agent Portal", href: "/agent-portal", icon: Building2 },
  { label: "Customer Portal", href: "/customer-portal", icon: UserCircle2 },
  { label: "Profile", href: "/profile", icon: Wallet },
];

export function findModuleByPath(pathname: string) {
  return mainModules.find(
    (item) =>
      pathname === item.href ||
      pathname.startsWith(`${item.href}/`) ||
      item.children?.some((child) => child.href === pathname),
  );
}

export function findSubItem(pathname: string) {
  for (const module of mainModules) {
    const child = module.children?.find(
      (item) =>
        item.href === pathname || pathname.startsWith(`${item.href}/`),
    );
    if (child) return { module, child };
  }
  return null;
}
