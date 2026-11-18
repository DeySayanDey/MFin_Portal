/**
 * Sample rows for the loan-module screens in the UI blueprint.
 * Replace `listLoanScreen` with the API for that screen when it is ready.
 * Money fields are stored on the row. The screen does not calculate them.
 */

import { ModulePage, type ModulePageMeta } from "@/lib/modules/module.types";

export function loanModulePage(route: string, messageNamespace: string): ModulePageMeta {
  return new ModulePage({
    id: "loan.module",
    route,
    messageNamespace,
    titleKey: "title",
    descriptionKey: "description",
  }).toJSON();
}

export const LOAN_SCREEN_IDS = [
  "tracking",
  "creditAssessment",
  "fieldVerification",
  "approval",
  "disbursement",
  "recovery",
  "advanceCollection",
  "overdueRecovery",
  "adjustment",
  "closure",
  "memberLedger",
  "amortization",
] as const;

export type LoanScreenId = (typeof LOAN_SCREEN_IDS)[number];

export type LoanColumnKind = "text" | "money" | "status";

export type LoanColumn = {
  key: string;
  kind: LoanColumnKind;
};

export type LoanStatusTone = "success" | "warning" | "info" | "danger" | "neutral" | "violet";

export type LoanRecord = {
  id: string;
  statusTone?: LoanStatusTone;
  values: Record<string, string | number | null>;
};

export type LoanScreenConfig = {
  group: "los" | "lms";
  href: string;
  columns: LoanColumn[];
  rows: LoanRecord[];
};

export type LoanScreenQuery = {
  page?: number;
  perPage?: number;
  search?: string;
};

export type LoanScreenPage = {
  items: LoanRecord[];
  total: number;
  page: number;
  perPage: number;
};

function row(
  id: string,
  values: Record<string, string | number | null>,
  statusTone?: LoanStatusTone,
): LoanRecord {
  return { id, values, statusTone };
}

export const loanScreens: Record<LoanScreenId, LoanScreenConfig> = {
  tracking: {
    group: "los",
    href: "/los/tracking",
    columns: [
      { key: "appNo", kind: "text" },
      { key: "customer", kind: "text" },
      { key: "branch", kind: "text" },
      { key: "date", kind: "text" },
      { key: "owner", kind: "text" },
      { key: "status", kind: "status" },
    ],
    rows: [
      row("t1", { appNo: "APP-2026-00120", customer: "Gita Saha", branch: "Head Office", date: "2026-10-02", owner: "Credit desk", status: "Disbursed" }, "success"),
      row("t2", { appNo: "APP-2026-00117", customer: "Mousumi Ghosh", branch: "Barasat", date: "2026-10-08", owner: "Branch manager", status: "Approval" }, "warning"),
      row("t3", { appNo: "APP-2026-00116", customer: "Supriya Mondal", branch: "Krishnanagar", date: "2026-10-11", owner: "Field officer", status: "Field verification" }, "info"),
      row("t4", { appNo: "APP-2026-00114", customer: "Meena Patil", branch: "Head Office", date: "2026-10-14", owner: "Applicant", status: "Draft" }, "neutral"),
    ],
  },
  creditAssessment: {
    group: "los",
    href: "/los/credit-assessment",
    columns: [
      { key: "appNo", kind: "text" },
      { key: "borrower", kind: "text" },
      { key: "requested", kind: "money" },
      { key: "purpose", kind: "text" },
      { key: "recommendation", kind: "status" },
    ],
    rows: [
      row("c1", { appNo: "APP-2026-00115", borrower: "Ruma More", requested: 30000, purpose: "Food stall", recommendation: "Recommend 28000" }, "info"),
      row("c2", { appNo: "APP-2026-00111", borrower: "Kavita Chakraborty", requested: 32000, purpose: "Handloom", recommendation: "In review" }, "warning"),
      row("c3", { appNo: "APP-2026-00118", borrower: "Aparna Sen", requested: 40000, purpose: "Crop input", recommendation: "Recommend 38000" }, "success"),
      row("c4", { appNo: "APP-2026-00109", borrower: "Lata Das", requested: 22000, purpose: "Poultry", recommendation: "Hold" }, "danger"),
    ],
  },
  fieldVerification: {
    group: "los",
    href: "/los/field-verification",
    columns: [
      { key: "appNo", kind: "text" },
      { key: "inspectionDate", kind: "text" },
      { key: "officer", kind: "text" },
      { key: "result", kind: "status" },
      { key: "recommended", kind: "money" },
      { key: "notes", kind: "text" },
    ],
    rows: [
      row("f1", { appNo: "APP-2026-00116", inspectionDate: "2026-10-12", officer: "FO-014 Rina", result: "Verified", recommended: 40000, notes: "House and stock seen" }, "success"),
      row("f2", { appNo: "APP-2026-00115", inspectionDate: "2026-10-13", officer: "FO-008 Amit", result: "Pending", recommended: null, notes: "Visit scheduled" }, "warning"),
      row("f3", { appNo: "APP-2026-00109", inspectionDate: "2026-10-09", officer: "FO-014 Rina", result: "Mismatch", recommended: 15000, notes: "Income papers differ" }, "danger"),
      row("f4", { appNo: "APP-2026-00121", inspectionDate: "2026-10-15", officer: "FO-003 Kabita", result: "Verified", recommended: 25000, notes: "Group members present" }, "success"),
    ],
  },
  approval: {
    group: "los",
    href: "/los/approval",
    columns: [
      { key: "appNo", kind: "text" },
      { key: "borrower", kind: "text" },
      { key: "sanctionAmount", kind: "money" },
      { key: "rate", kind: "text" },
      { key: "duration", kind: "text" },
      { key: "approver", kind: "text" },
      { key: "status", kind: "status" },
    ],
    rows: [
      row("a1", { appNo: "APP-2026-00118", borrower: "Aparna Sen", sanctionAmount: 38000, rate: "18%", duration: "12 months", approver: "Credit committee", status: "Sanctioned" }, "success"),
      row("a2", { appNo: "APP-2026-00117", borrower: "Mousumi Ghosh", sanctionAmount: 35000, rate: "18%", duration: "15 months", approver: "Branch manager", status: "Waiting" }, "warning"),
      row("a3", { appNo: "APP-2026-00113", borrower: "Pooja Gaikwad", sanctionAmount: 25000, rate: "20%", duration: "12 months", approver: "Credit committee", status: "Sanctioned" }, "info"),
      row("a4", { appNo: "APP-2026-00108", borrower: "Nila Roy", sanctionAmount: null, rate: "—", duration: "—", approver: "Credit committee", status: "Rejected" }, "danger"),
    ],
  },
  disbursement: {
    group: "lms",
    href: "/lms/disbursement",
    columns: [
      { key: "loanAccount", kind: "text" },
      { key: "disbursementNo", kind: "text" },
      { key: "date", kind: "text" },
      { key: "gross", kind: "money" },
      { key: "deductions", kind: "money" },
      { key: "net", kind: "money" },
      { key: "mode", kind: "text" },
      { key: "status", kind: "status" },
    ],
    rows: [
      row("d1", { loanAccount: "LN-2026-00120", disbursementNo: "DB-014", date: "2026-10-04", gross: 50000, deductions: 1475, net: 48525, mode: "NEFT", status: "Final" }, "success"),
      row("d2", { loanAccount: "LN-2026-00119", disbursementNo: "DB-013", date: "2026-10-03", gross: 45000, deductions: 1327.5, net: 43672.5, mode: "NEFT", status: "Final" }, "success"),
      row("d3", { loanAccount: "LN-2026-00118", disbursementNo: "DB-015", date: "2026-10-16", gross: 38000, deductions: 1121, net: 36879, mode: "Cheque", status: "Draft" }, "warning"),
      row("d4", { loanAccount: "LN-2026-00112", disbursementNo: "DB-011", date: "2026-09-28", gross: 38000, deductions: 1121, net: 36879, mode: "Cash", status: "Final" }, "info"),
    ],
  },
  recovery: {
    group: "lms",
    href: "/lms/recovery",
    columns: [
      { key: "loanAccount", kind: "text" },
      { key: "member", kind: "text" },
      { key: "date", kind: "text" },
      { key: "principal", kind: "money" },
      { key: "interest", kind: "money" },
      { key: "penalty", kind: "money" },
      { key: "collected", kind: "money" },
      { key: "mode", kind: "text" },
    ],
    rows: [
      row("r1", { loanAccount: "LN-2026-00120", member: "Gita Saha", date: "2026-10-15", principal: 2680, interest: 337.49, penalty: 0, collected: 3017.49, mode: "Cash" }),
      row("r2", { loanAccount: "LN-2026-00112", member: "Aarti Saha", date: "2026-10-15", principal: 2720, interest: 351.56, penalty: 0, collected: 3071.56, mode: "UPI" }),
      row("r3", { loanAccount: "LN-2026-00002", member: "Rani Patil", date: "2026-10-14", principal: 2400, interest: 290, penalty: 50, collected: 2740, mode: "Cash" }),
      row("r4", { loanAccount: "LN-2026-00104", member: "Lakshmi Saha", date: "2026-10-14", principal: 2100, interest: 260, penalty: 0, collected: 2360, mode: "NEFT" }),
    ],
  },
  advanceCollection: {
    group: "lms",
    href: "/lms/advance-collection",
    columns: [
      { key: "loanAccount", kind: "text" },
      { key: "member", kind: "text" },
      { key: "date", kind: "text" },
      { key: "advance", kind: "money" },
      { key: "mode", kind: "text" },
      { key: "reference", kind: "text" },
      { key: "collector", kind: "text" },
    ],
    rows: [
      row("v1", { loanAccount: "LN-2026-00120", member: "Gita Saha", date: "2026-10-10", advance: 1500, mode: "Cash", reference: "RCPT-118", collector: "FO-014" }),
      row("v2", { loanAccount: "LN-2026-00112", member: "Aarti Saha", date: "2026-10-10", advance: 1000, mode: "UPI", reference: "UPI-90211", collector: "FO-008" }),
      row("v3", { loanAccount: "LN-2026-00002", member: "Rani Patil", date: "2026-10-08", advance: 500, mode: "Cash", reference: "RCPT-102", collector: "FO-003" }),
      row("v4", { loanAccount: "LN-2026-00104", member: "Lakshmi Saha", date: "2026-10-06", advance: 2000, mode: "NEFT", reference: "NEFT-441", collector: "Branch" }),
    ],
  },
  overdueRecovery: {
    group: "lms",
    href: "/lms/overdue-recovery",
    columns: [
      { key: "loanAccount", kind: "text" },
      { key: "member", kind: "text" },
      { key: "branch", kind: "text" },
      { key: "dueDate", kind: "text" },
      { key: "daysOverdue", kind: "text" },
      { key: "due", kind: "money" },
      { key: "collected", kind: "money" },
      { key: "outstanding", kind: "money" },
      { key: "collector", kind: "text" },
    ],
    rows: [
      row("o1", { loanAccount: "LN-2026-00088", member: "Bina Pal", branch: "Barasat", dueDate: "2026-09-15", daysOverdue: "31", due: 4200, collected: 1000, outstanding: 18600, collector: "FO-008" }, "danger"),
      row("o2", { loanAccount: "LN-2026-00074", member: "Seema Das", branch: "Krishnanagar", dueDate: "2026-09-30", daysOverdue: "16", due: 3100, collected: 0, outstanding: 14250, collector: "FO-014" }, "warning"),
      row("o3", { loanAccount: "LN-2026-00061", member: "Pampa Roy", branch: "Head Office", dueDate: "2026-10-01", daysOverdue: "15", due: 2800, collected: 500, outstanding: 9800, collector: "FO-003" }, "warning"),
      row("o4", { loanAccount: "LN-2026-00055", member: "Kabita Sen", branch: "Barasat", dueDate: "2026-08-20", daysOverdue: "57", due: 6400, collected: 2000, outstanding: 22100, collector: "FO-008" }, "danger"),
    ],
  },
  adjustment: {
    group: "lms",
    href: "/lms/adjustment",
    columns: [
      { key: "loanAccount", kind: "text" },
      { key: "type", kind: "text" },
      { key: "amount", kind: "money" },
      { key: "effectiveDate", kind: "text" },
      { key: "reference", kind: "text" },
      { key: "reason", kind: "text" },
    ],
    rows: [
      row("j1", { loanAccount: "LN-2026-00120", type: "Waiver", amount: 120, effectiveDate: "2026-10-12", reference: "ADJ-021", reason: "Penalty waiver" }),
      row("j2", { loanAccount: "LN-2026-00088", type: "Capitalization", amount: 800, effectiveDate: "2026-10-01", reference: "ADJ-018", reason: "Interest capitalization" }),
      row("j3", { loanAccount: "LN-2026-00104", type: "Correction", amount: 50, effectiveDate: "2026-09-22", reference: "ADJ-011", reason: "Receipt correction" }),
      row("j4", { loanAccount: "LN-2026-00074", type: "Waiver", amount: 200, effectiveDate: "2026-10-14", reference: "ADJ-024", reason: "Committee note" }),
    ],
  },
  closure: {
    group: "lms",
    href: "/lms/closure",
    columns: [
      { key: "loanAccount", kind: "text" },
      { key: "member", kind: "text" },
      { key: "outstanding", kind: "money" },
      { key: "pendingDues", kind: "money" },
      { key: "closureDate", kind: "text" },
      { key: "settlement", kind: "money" },
      { key: "status", kind: "status" },
    ],
    rows: [
      row("x1", { loanAccount: "LN-2025-00410", member: "Anita Das", outstanding: 0, pendingDues: 0, closureDate: "2026-09-30", settlement: 0, status: "Closed" }, "success"),
      row("x2", { loanAccount: "LN-2026-00021", member: "Ruma More", outstanding: 1200, pendingDues: 180, closureDate: "2026-10-18", settlement: 1380, status: "Proposed" }, "warning"),
      row("x3", { loanAccount: "LN-2025-00388", member: "Gita Saha", outstanding: 0, pendingDues: 40, closureDate: "2026-10-16", settlement: 40, status: "Pending dues" }, "info"),
      row("x4", { loanAccount: "LN-2026-00009", member: "Meena Patil", outstanding: 5400, pendingDues: 0, closureDate: "", settlement: null, status: "Open" }, "neutral"),
    ],
  },
  memberLedger: {
    group: "lms",
    href: "/lms/member-ledger",
    columns: [
      { key: "loanAccount", kind: "text" },
      { key: "date", kind: "text" },
      { key: "voucher", kind: "text" },
      { key: "narration", kind: "text" },
      { key: "debit", kind: "money" },
      { key: "credit", kind: "money" },
      { key: "balance", kind: "money" },
    ],
    rows: [
      row("m1", { loanAccount: "LN-2026-00120", date: "2026-10-04", voucher: "DB-014", narration: "Disbursement", debit: 48525, credit: null, balance: 48525 }),
      row("m2", { loanAccount: "LN-2026-00120", date: "2026-10-10", voucher: "RCPT-118", narration: "Advance collection", debit: null, credit: 1500, balance: 47025 }),
      row("m3", { loanAccount: "LN-2026-00120", date: "2026-10-15", voucher: "RCPT-140", narration: "Installment", debit: null, credit: 3017.49, balance: 44007.51 }),
      row("m4", { loanAccount: "LN-2026-00112", date: "2026-09-28", voucher: "DB-011", narration: "Disbursement", debit: 36879, credit: null, balance: 36879 }),
    ],
  },
  amortization: {
    group: "lms",
    href: "/lms/amortization",
    columns: [
      { key: "loanAccount", kind: "text" },
      { key: "installmentNo", kind: "text" },
      { key: "dueDate", kind: "text" },
      { key: "principal", kind: "money" },
      { key: "interest", kind: "money" },
      { key: "total", kind: "money" },
      { key: "outstanding", kind: "money" },
    ],
    rows: [
      row("s1", { loanAccount: "LN-2026-00120", installmentNo: "1", dueDate: "2026-11-04", principal: 2500, interest: 750, total: 3250, outstanding: 47500 }),
      row("s2", { loanAccount: "LN-2026-00120", installmentNo: "2", dueDate: "2026-12-04", principal: 2537.5, interest: 712.5, total: 3250, outstanding: 44962.5 }),
      row("s3", { loanAccount: "LN-2026-00112", installmentNo: "1", dueDate: "2026-10-28", principal: 2900, interest: 570, total: 3470, outstanding: 35100 }),
      row("s4", { loanAccount: "LN-2026-00112", installmentNo: "2", dueDate: "2026-11-28", principal: 2943.5, interest: 526.5, total: 3470, outstanding: 32156.5 }),
    ],
  },
};

export async function listLoanScreen(
  screen: LoanScreenId,
  query: LoanScreenQuery = {},
  source?: LoanRecord[],
): Promise<LoanScreenPage> {
  const rows = source ?? loanScreens[screen].rows;
  const page = query.page && query.page > 0 ? query.page : 1;
  const perPage = query.perPage && query.perPage > 0 ? query.perPage : 5;
  const search = query.search?.trim().toLowerCase() ?? "";
  const filtered = search
    ? rows.filter((record) =>
        Object.values(record.values).some((value) =>
          String(value ?? "").toLowerCase().includes(search),
        ),
      )
    : rows;
  const start = (page - 1) * perPage;
  return {
    items: filtered.slice(start, start + perPage),
    total: filtered.length,
    page,
    perPage,
  };
}
