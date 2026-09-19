"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Menu, Search, ChevronDown } from "lucide-react";
import type { AppLocale } from "@/i18n/routing";
import type { AuthUser } from "@/features/auth/types/auth";

type HeaderProps = {
  onMenuClick: () => void;
  user: AuthUser;
};

const languages: Array<{ code: AppLocale; label: string; short: string }> = [
  { code: "en", label: "English", short: "EN" },
  { code: "bn", label: "বাংলা", short: "BN" },
  { code: "hi", label: "हिन्दी", short: "HI" },
  { code: "or", label: "ଓଡ଼ିଆ", short: "OR" },
];

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Executive Dashboard & Portfolio Health",
    subtitle: "Real-time CBS Cashbook",
  },
  "/branch-vault": {
    title: "Branch Vault, Day Open / Close & Any-Branch Banking",
    subtitle: "Dual-custody vault · Day balancing · Cross-branch cash",
  },
  "/field-force": {
    title: "Field Agent Dashboard & Kendra Collection Route",
    subtitle: "GPS geofence · Live meetings · Commission tracking",
  },
  "/customer-portal": {
    title: "Customer Self-Pay Portal & Member Passbook",
    subtitle: "EMI pay · Loan passbook · 360° multi-product ledger",
  },
  "/master": {
    title: "Institution Master Setup & System Administration",
    subtitle: "Company profile · Series · Timings · RBAC · Gateways · RBI",
  },
  "/master/company-profile": {
    title: "Company Master Profile",
    subtitle: "Corporate identity · CIN · RBI registration · Multi-lingual",
  },
  "/master/series": {
    title: "Series Entry & Auto-Numbering",
    subtitle: "Prefixes · Counters · Padding · Live formatted samples",
  },
  "/master/timings": {
    title: "Software Timings & Sessions",
    subtitle: "Login windows · Branch sessions · Day open/close",
  },
  "/master/roles": {
    title: "Designations & RBAC Permissions",
    subtitle: "Sanction · Disbursal · Collection · Reversals · Legal notice",
  },
  "/master/gateway": {
    title: "SMS & WhatsApp Gateway",
    subtitle: "OTP · EMI reminders · Transactional messaging",
  },
  "/master/rbi-policies": {
    title: "RBI Lending Policies",
    subtitle: "FOIR · Income thresholds · Penny-drop · Bureau checks",
  },
  "/master/database-seed": {
    title: "Database & Seed Data (25+ JSON)",
    subtitle: "Seed packs · Demo data · Provider controls",
  },
  "/master/maker-checker": {
    title: "Maker-Checker Dual Authorization",
    subtitle: "Thresholds · Segregation of duties · Checker approval matrix",
  },
  "/master/wifi-sync": {
    title: "Wi-Fi Sync Master & Offline Data Hub",
    subtitle: "Day Open/Close · Intranet sync · Offline field queue",
  },
  "/master/staff": {
    title: "Staff Master",
    subtitle: "Employees · Designations · Targets · Attendance · Performance",
  },
  "/master/branch-vault": {
    title: "Branch Vault Master",
    subtitle:
      "Dual-custody vault · Day balancing · Inter-branch cash · Any-branch banking",
  },
  "/master/coa-tree": {
    title: "eZi-Micro General Ledger Architecture",
    subtitle: "N-Level COA · Trial Balance · Sub-Ledger · Day Book · Cash Book",
  },
  "/master/kendra-jlg": {
    title: "Kendra & JLG Master",
    subtitle: "Branch Master · Kendra Centres · JLG Groups · Org Chart",
  },
  "/master/loan-schemes": {
    title: "Configurable Lending Schemes & Pricing Models",
    subtitle: "EMI calculator · Amortization · Product scheme catalogue",
  },
  "/accounting": {
    title: "Finance & General Ledger",
    subtitle: "Voucher entry · COA · Trial balance · Cash & bank book",
  },
  "/accounting/voucher-entry": {
    title: "Voucher Entry Studio",
    subtitle: "Cash/Bank · Withdrawal · Expense · Contra · N-Level COA",
  },
  "/accounting/journal-adjustment": {
    title: "Journal Adjustment",
    subtitle: "N-Line GL adjustments · Non-cash inter-account entries",
  },
  "/accounting/cash-deposit": {
    title: "Cash/Bank Deposit Voucher",
    subtitle: "Deposit postings · Thermal print · Dr/Cr register",
  },
  "/accounting/savings-withdrawal": {
    title: "Savings Withdrawal Voucher",
    subtitle: "Bachat Gat withdrawals · Official voucher print",
  },
  "/accounting/contra-transfer": {
    title: "Contra Transfer Voucher",
    subtitle: "Vault ↔ Bank · Maker-checker dual sign-off",
  },
  "/accounting/coa": {
    title: "Chart of Accounts",
    subtitle: "N-Level COA tree · GL statements · Sub-ledgers",
  },
  "/accounting/trial-balance": {
    title: "Hierarchical Trial Balance",
    subtitle: "Consolidated Dr/Cr · Double-entry invariant",
  },
  "/accounting/cashbook": {
    title: "Cash & Bank Book",
    subtitle: "Cash-in-hand · Bank clearing register",
  },
  "/lms": {
    title: "Lending & Loan Operations (LMS)",
    subtitle: "Collections · Schedules · PAR/NPA · Portfolio reports",
  },
  "/lms/collections": {
    title: "LMS Repayment Collections",
    subtitle: "Kendra meetings · EMI receipts · UPI QR · Field wallet",
  },
  "/lms/repayment-schedule": {
    title: "Repayment Schedule",
    subtitle: "EMI calendar · Principal / interest amortization",
  },
  "/lms/loan-book": {
    title: "Active Loan Book",
    subtitle: "Portfolio balances · Collections · DPD · Settlements",
  },
  "/lms/par-npa": {
    title: "PAR / NPA Monitor",
    subtitle: "Aging buckets · NPA classification · Provisioning",
  },
  "/lms/defaulters": {
    title: "Defaulters & Legal Notice",
    subtitle: "DPD tracking · Recovery protocol · Demand letters",
  },
  "/lms/reports": {
    title: "Portfolio Reports Studio",
    subtitle: "Demand · Collection MIS · PAR pack · Bureau export",
  },
  "/deposits": {
    title: "Deposits & Member Savings",
    subtitle: "Bachat Gat · RD · FD · Member ledger passbooks",
  },
  "/deposits/savings": {
    title: "Bachat Gat Group Savings",
    subtitle: "Compulsory savings · Share certificates · Cash deposit/withdraw",
  },
  "/deposits/rd": {
    title: "Recurring Deposits (RD)",
    subtitle: "Monthly installments · Maturity tracking · Kendra collection",
  },
  "/deposits/fd": {
    title: "Fixed Deposits (FD)",
    subtitle: "Term deposits · Maturity payout · Lien marking",
  },
  "/deposits/member-ledger": {
    title: "Member Deposit Ledger",
    subtitle: "Digital passbook · Credits · Debits · Interest postings",
  },
  "/deposits/interest": {
    title: "Interest Accrual & Posting",
    subtitle: "Month-end interest batch · GL 421000 credit",
  },
  "/deposits/withdrawals": {
    title: "Withdrawal Requests",
    subtitle: "Emergency payouts · Maker-checker · Cash outward",
  },
  "/mis": {
    title: "MIS & Reports Studio",
    subtitle: "Daily business · Demand · Collection · PAR · Regulatory packs",
  },
  "/mis/daily-business": {
    title: "Daily Business MIS",
    subtitle: "Demand · Collection · AUM · PAR · Vault cash · GL",
  },
  "/mis/portfolio-health": {
    title: "Portfolio Health",
    subtitle: "AUM quality · Efficiency · PAR concentration",
  },
  "/mis/demand-sheet": {
    title: "Kendra Demand Sheet",
    subtitle: "Meeting-wise principal + interest demand",
  },
  "/mis/collection": {
    title: "Collection Register",
    subtitle: "Receipts · Agent · Mode · Vault credit",
  },
  "/mis/disbursement": {
    title: "Disbursement Report",
    subtitle: "Gross vs net · NEFT/IMPS payout status",
  },
  "/mis/branch-scorecard": {
    title: "Branch Scorecard",
    subtitle: "Ranked AUM · Efficiency · PAR · NPA",
  },
  "/mis/par-aging": {
    title: "PAR Aging",
    subtitle: "SMA buckets · IRAC provisioning",
  },
  "/mis/npa-provisioning": {
    title: "NPA Provisioning",
    subtitle: "Sub-standard · Doubtful · Loss assets",
  },
  "/mis/exports": {
    title: "Scheduled Exports",
    subtitle: "MIS packs · CIC upload · RBI returns",
  },
  "/hr": {
    title: "HR, Payroll & Messaging",
    subtitle: "Staff · Transfers · Payroll · Broadcast messaging",
  },
  "/hr/staff": {
    title: "Staff Directory & HR",
    subtitle: "Employee master · Designations · Branch mapping",
  },
  "/hr/member-transfers": {
    title: "Member Transfers",
    subtitle: "Borrower Kendra / branch migration orders",
  },
  "/hr/transfers": {
    title: "Employee Transfers",
    subtitle: "Staff posting orders · Branch expansion",
  },
  "/hr/payroll": {
    title: "Monthly Staff Payroll",
    subtitle: "Salary · Incentives · GL disbursal",
  },
  "/hr/messaging": {
    title: "SMS & WhatsApp Broadcast",
    subtitle: "Receipts · Reminders · Legal notices",
  },
  "/security": {
    title: "User Management & Security",
    subtitle: "Profiles · Roles · Permissions · Audit trail",
  },
  "/security/audit-log": {
    title: "Security Audit Log",
    subtitle: "Operator · IP · Entity change · Login activity",
  },
  "/mis/audit-trail": {
    title: "Security Audit Trail",
    subtitle: "Operator · IP · Entity change · Login activity",
  },
  "/customer-kyc": {
    title: "Borrower Profiles, Group Affiliations & KYC Vault",
    subtitle:
      "JLG registration · Penny Drop · Guarantor/Nominee · RBI FOIR surplus",
  },
  "/los": {
    title: "Loan Origination (LOS)",
    subtitle: "Applications · Appraisal · Sanction · Disbursement",
  },
  "/los/applications": {
    title: "LOS Underwriting Workbench",
    subtitle: "Pipeline · Bureau score · KFS · Disbursal triggers",
  },
  "/profile": {
    title: "My Profile & Account Settings",
    subtitle: "Biometric · Branch access · Password & 2FA",
  },
  "/agent-portal": {
    title: "Mobile Collector App",
    subtitle: "Field route · Kendra meetings · Offline sync",
  },
};

function resolvePageMeta(pathname: string) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith("/branch-vault")) return pageTitles["/branch-vault"];
  if (pathname.startsWith("/field-force")) return pageTitles["/field-force"];
  if (pathname.startsWith("/customer-portal"))
    return pageTitles["/customer-portal"];
  if (pathname.startsWith("/master/loan-schemes"))
    return pageTitles["/master/loan-schemes"];
  if (pathname.startsWith("/master/branch-vault"))
    return pageTitles["/master/branch-vault"];
  if (pathname.startsWith("/master")) return pageTitles["/master"];
  if (pathname.startsWith("/accounting")) return pageTitles["/accounting"];
  if (pathname.startsWith("/lms")) return pageTitles["/lms"];
  if (pathname.startsWith("/deposits")) return pageTitles["/deposits"];
  if (pathname.startsWith("/mis")) return pageTitles["/mis"];
  if (pathname.startsWith("/hr")) return pageTitles["/hr"];
  if (pathname.startsWith("/security") || pathname.startsWith("/profile"))
    return pageTitles["/security"];
  if (pathname.startsWith("/customer-kyc")) return pageTitles["/customer-kyc"];
  if (pathname.startsWith("/los")) return pageTitles["/los"];
  if (pathname.startsWith("/agent-portal")) return pageTitles["/agent-portal"];
  return {
    title: "eZi-Micro Core Banking",
    subtitle: "Module workspace",
  };
}

export function Header({ onMenuClick, user }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const pageMeta = resolvePageMeta(pathname);
  const [langOpen, setLangOpen] = useState(false);

  const currentLang =
    languages.find((lang) => lang.code === locale) ?? languages[0]!;

  const initials = (() => {
    const source = user.shortName || user.userName || user.userCode || "?";
    const parts = source.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
  })();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="app-inset-x flex flex-col pt-[var(--content-gap)]">
        <div className="flex items-center justify-between gap-2 pb-3 sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onMenuClick}
              className="shrink-0 rounded-xl border border-border bg-white p-2 text-slate-600 shadow-sm lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>

            <label className="relative hidden min-w-0 flex-1 sm:block md:max-w-md">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
              <input
                type="search"
                placeholder="Quick search or command..."
                className="w-full rounded-2xl border border-border bg-surface-muted py-2.5 pr-14 pl-10 text-sm text-slate-800 outline-none transition placeholder:text-muted-soft focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10"
              />
              <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded-md border border-border bg-white px-1.5 py-0.5 text-[10px] font-medium text-muted-soft lg:inline">
                Ctrl K
              </kbd>
            </label>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangOpen((open) => !open)}
                className="inline-flex h-9 items-center gap-1 rounded-full border border-border bg-white px-2.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-surface-muted sm:gap-1.5 sm:px-3"
                aria-expanded={langOpen}
                aria-haspopup="listbox"
              >
                <span className="font-semibold text-slate-800">
                  {currentLang.short}
                </span>
                <span className="hidden sm:inline">{currentLang.label}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-soft" />
              </button>

              {langOpen ? (
                <ul
                  role="listbox"
                  className="absolute top-full right-0 z-40 mt-1.5 min-w-[8.5rem] overflow-hidden rounded-xl border border-border bg-white py-1 shadow-[var(--shadow-card)]"
                >
                  {languages.map((lang) => (
                    <li key={lang.code}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={locale === lang.code}
                        onClick={() => {
                          setLangOpen(false);
                          if (lang.code !== locale) {
                            router.replace(pathname, { locale: lang.code });
                          }
                        }}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition hover:bg-surface-muted ${
                          locale === lang.code
                            ? "font-semibold text-brand-ink"
                            : "text-slate-600"
                        }`}
                      >
                        <span className="font-semibold">{lang.short}</span>
                        {lang.label}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="inline-flex h-9 max-w-[9.5rem] items-center gap-2 rounded-full border border-border bg-white px-2 shadow-sm sm:max-w-none sm:px-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-bold text-brand-ink">
                {initials}
              </span>
              <span className="hidden truncate text-xs font-semibold text-slate-800 sm:inline">
                {user.shortName || user.userName}
              </span>
            </div>
          </div>
        </div>

        <hr className="border-0 border-t border-border" />

        <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <label className="relative block w-full sm:hidden">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
            <input
              type="search"
              placeholder="Quick search or command..."
              className="w-full rounded-2xl border border-border bg-surface-muted py-2.5 pr-4 pl-10 text-sm text-slate-800 outline-none transition placeholder:text-muted-soft focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10"
            />
          </label>

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-soft">
              {user.userCode} · BR {user.branchCode}
            </p>
            <h1 className="mt-0.5 text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
              {pageMeta.title}
            </h1>
            <p className="mt-0.5 text-xs text-muted">{pageMeta.subtitle}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
