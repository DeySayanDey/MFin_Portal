"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  GitBranch,
  Scale,
  Search,
} from "lucide-react";

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
}

function money(value: number) {
  const sign = value < 0 ? "-" : "";
  return `${sign}₹${formatInr(value)}`;
}

const glAccounts = [
  {
    code: "131000",
    title: "Computer Servers, Laptops & IT Equipment",
  },
  {
    code: "111000",
    title: "Branch Physical Vault Cash Head",
  },
  {
    code: "121100",
    title: "JLG Microfinance Loans",
  },
  {
    code: "112100",
    title: "State Bank of India - Disbursal & Settlement A/c",
  },
];

const glEntries = [
  {
    date: "14 Aug 2026",
    voucher: "JV-20260814-IT01",
    particulars: "Laptop procurement for Kolkata HO operations desk",
    reference: "PO-IT-2026-018",
    debit: 42500,
    credit: 0,
    balance: 227500,
    nature: "Dr" as const,
  },
  {
    date: "28 Aug 2026",
    voucher: "JV-20260828-IT02",
    particulars: "Additional SSD upgrades for field tablet fleet",
    reference: "PO-IT-2026-024",
    debit: 22000,
    credit: 0,
    balance: 249500,
    nature: "Dr" as const,
  },
  {
    date: "05 Sep 2026",
    voucher: "CN-20260905-IT01",
    particulars: "Vendor credit note — damaged accessories return",
    reference: "CN-ACC-091",
    debit: 0,
    credit: 1200,
    balance: 248300,
    nature: "Dr" as const,
  },
];

type TbNode = {
  code: string;
  title: string;
  bangla: string;
  className: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  openingDr: number;
  openingCr: number;
  periodDr: number;
  periodCr: number;
  net: number;
  nature: "Dr" | "Cr";
  children?: TbNode[];
};

const trialTree: TbNode[] = [
  {
    code: "100000",
    title: "ASSETS",
    bangla: "মোট সম্পদ",
    className: "Asset",
    openingDr: 820000,
    openingCr: 0,
    periodDr: 64500,
    periodCr: 1200,
    net: 883300,
    nature: "Dr",
    children: [
      {
        code: "110000",
        title: "Cash and Bank Liquid Balances",
        bangla: "নগদ ও ব্যাংক",
        className: "Asset",
        openingDr: 650000,
        openingCr: 0,
        periodDr: 3734.16,
        periodCr: 38892,
        net: 614842.16,
        nature: "Dr",
        children: [
          {
            code: "111000",
            title: "Branch Physical Vault Cash Head",
            bangla: "শাখা ভল্ট ক্যাশ",
            className: "Asset",
            openingDr: 65000,
            openingCr: 0,
            periodDr: 3734.16,
            periodCr: 0,
            net: 68734.16,
            nature: "Dr",
          },
        ],
      },
      {
        code: "120000",
        title: "Microfinance Loan Portfolio Outstanding",
        bangla: "ঋণ পোর্টফোলিও",
        className: "Asset",
        openingDr: 170000,
        openingCr: 0,
        periodDr: 40000,
        periodCr: 3017.49,
        net: 206982.51,
        nature: "Dr",
      },
    ],
  },
  {
    code: "200000",
    title: "LIABILITIES",
    bangla: "মোট দায়",
    className: "Liability",
    openingDr: 0,
    openingCr: 420000,
    periodDr: 1200,
    periodCr: 8000,
    net: 426800,
    nature: "Cr",
  },
  {
    code: "300000",
    title: "EQUITY & STATUTORY RESERVES",
    bangla: "মূলধন",
    className: "Equity",
    openingDr: 0,
    openingCr: 250000,
    periodDr: 0,
    periodCr: 0,
    net: 250000,
    nature: "Cr",
  },
  {
    code: "400000",
    title: "REVENUE & OPERATIONAL INCOME",
    bangla: "আয়",
    className: "Revenue",
    openingDr: 0,
    openingCr: 85000,
    periodDr: 0,
    periodCr: 662.6,
    net: 85662.6,
    nature: "Cr",
  },
  {
    code: "500000",
    title: "EXPENSES & OPERATING OVERHEADS",
    bangla: "ব্যয়",
    className: "Expense",
    openingDr: 45000,
    openingCr: 0,
    periodDr: 1200,
    periodCr: 0,
    net: 46200,
    nature: "Dr",
  },
];

const classTone: Record<TbNode["className"], string> = {
  Asset: "bg-blue-600 text-white",
  Liability: "bg-amber-500 text-white",
  Equity: "bg-violet-600 text-white",
  Revenue: "bg-emerald-600 text-white",
  Expense: "bg-rose-600 text-white",
};

const subLedgers = [
  {
    code: "112100",
    branch: "BR-WB01",
    name: "State Bank of India - Disbursal & Settlement A/c",
    control: "112000 (Commercial Bank Accounts Head)",
    balance: 1680000,
    meta: "25 Active Loans",
  },
  {
    code: "121101",
    branch: "BR-WB01",
    name: "JLG Loan Sub-Ledger — Karveer Rural",
    control: "121100 (JLG Microfinance Loans Head)",
    balance: 33814.66,
    meta: "48 Active Borrowers",
  },
  {
    code: "112200",
    branch: "BR-MH02",
    name: "HDFC Collection Sweep Account",
    control: "112000 (Commercial Bank Accounts Head)",
    balance: 245600,
    meta: "12 Active Mandates",
  },
  {
    code: "211001",
    branch: "BR-WB01",
    name: "Member Bachat Gat Savings Payable",
    control: "210000 (Member Deposits & Payables)",
    balance: 17220,
    meta: "70 Savings Accounts",
  },
];

const vouchers = [
  {
    no: "REP-20260912-910A4D9A",
    date: "12 Sept 2026",
    time: "12:36 pm",
    type: "Repayment",
    narration: "Kendra Collection for LN-2026-00001",
    debit: 3734.16,
    credit: 3734.16,
    status: "Posted",
  },
  {
    no: "DISB-20260912-08DFF5A8",
    date: "12 Sept 2026",
    time: "10:12 am",
    type: "Disbursement",
    narration: "Net NEFT/IMPS payout for LN-2026-00001 — Sunita Kamble",
    debit: 38892,
    credit: 38892,
    status: "Posted",
  },
  {
    no: "JV-20260911-GL0042",
    date: "11 Sept 2026",
    time: "04:20 pm",
    type: "Journal",
    narration: "Interest accrual posting — JLG portfolio MTD",
    debit: 18450,
    credit: 18450,
    status: "Posted",
  },
];

const dayBookRows = [
  {
    voucher: "DISB-20260912-08DFF5A8",
    ledger: "Microfinance Loans Outstanding Asset",
    particulars: "Disbursement for loan account LN-2026-00001 - Sunita Kamble",
    debit: 40000,
    credit: 0,
  },
  {
    voucher: "DISB-20260912-08DFF5A8",
    ledger: "Bank Disbursal",
    particulars: "Net NEFT/IMPS payout to borrower for LN-2026-00001",
    debit: 0,
    credit: 38892,
  },
  {
    voucher: "REP-20260912-910A4D9A",
    ledger: "Branch Vault Cash",
    particulars: "Receipt #RCPT-20260714-00001 (Cash Centre Meeting)",
    debit: 3734.16,
    credit: 0,
  },
  {
    voucher: "REP-20260912-910A4D9A",
    ledger: "Loan Interest Receivable",
    particulars: "EMI interest component for LN-2026-00001",
    debit: 0,
    credit: 662.6,
  },
];

const cashBookRows = [
  {
    date: "12 Sept 2026",
    voucher: "DISB-20260912-08DFF5A8",
    particulars: "Net NEFT/IMPS payout to borrower for LN-2026-00001",
    mode: "Bank",
    receipt: 0,
    payment: 38892,
    balance: 26108,
  },
  {
    date: "12 Sept 2026",
    voucher: "DISB-20260912-08DFF5A8",
    particulars: "Processing fee & GST deduction on disbursement",
    mode: "Bank",
    receipt: 0,
    payment: 1108,
    balance: -3061,
  },
  {
    date: "12 Sept 2026",
    voucher: "REP-20260912-910A4D9A",
    particulars: "Receipt #RCPT-20260714-00001 (CashCentreMeeting)",
    mode: "Cash",
    receipt: 3734.16,
    payment: 0,
    balance: 673.16,
  },
];

export function GlStatementPanel() {
  const [account, setAccount] = useState(glAccounts[0]!.code);
  const [fromDate, setFromDate] = useState("2026-08-13");
  const [toDate, setToDate] = useState("2026-09-12");
  const [query, setQuery] = useState("");
  const [viewed, setViewed] = useState(true);

  const selected = glAccounts.find((item) => item.code === account) ?? glAccounts[0]!;
  const rows = useMemo(() => {
    const q = query.toLowerCase();
    return glEntries.filter(
      (row) =>
        row.voucher.toLowerCase().includes(q) ||
        row.particulars.toLowerCase().includes(q) ||
        row.reference.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FileSpreadsheet className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              GL-Wise Ledger Account Statement
            </h2>
            <p className="mt-1 text-sm text-muted">
              Period movement with opening, debit/credit totals and running
              balance for a selected GL head
            </p>
          </div>
        </div>
        <select
          value={account}
          onChange={(event) => setAccount(event.target.value)}
          className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white lg:max-w-md"
        >
          {glAccounts.map((item) => (
            <option key={item.code} value={item.code}>
              {item.code} — {item.title}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              From
            </span>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              To
            </span>
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => setViewed(true)}
          className="btn btn-primary"
        >
          View Ledger
        </button>
      </div>

      {viewed ? (
        <>
          <div className="mt-4 grid gap-3 rounded-2xl bg-slate-900 px-4 py-4 text-white sm:grid-cols-2 xl:grid-cols-5">
            <SummaryCell
              label="Selected Head"
              value={`${selected.code} ${selected.title}`}
              valueClass="text-sm text-emerald-300"
            />
            <SummaryCell
              label="Opening Balance"
              value="₹185,000.00 (Dr)"
              valueClass="text-white"
            />
            <SummaryCell
              label="Period Debits (Dr)"
              value="+₹64,500.00"
              valueClass="text-emerald-400"
            />
            <SummaryCell
              label="Period Credits (Cr)"
              value="-₹1,200.00"
              valueClass="text-rose-400"
            />
            <SummaryCell
              label="Closing Balance"
              value="₹248,300.00 (Dr)"
              valueClass="text-amber-300"
            />
          </div>

          <div className="mt-4">
            <FilterInput value={query} onChange={setQuery} />
            <div className="table-scroll mt-3">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-muted-soft">
                    <th className="px-3 py-3 font-semibold">Txn Date</th>
                    <th className="px-3 py-3 font-semibold">Voucher No</th>
                    <th className="px-3 py-3 font-semibold">
                      Particulars & Description
                    </th>
                    <th className="px-3 py-3 font-semibold">Reference / Centre</th>
                    <th className="px-3 py-3 text-right font-semibold">
                      Debit (Dr) ₹
                    </th>
                    <th className="px-3 py-3 text-right font-semibold">
                      Credit (Cr) ₹
                    </th>
                    <th className="px-3 py-3 text-right font-semibold">
                      Running Balance ₹
                    </th>
                    <th className="px-3 py-3 font-semibold">Dr/Cr</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.voucher}
                      className="border-t border-border/70 text-slate-700"
                    >
                      <td className="px-3 py-3">{row.date}</td>
                      <td className="px-3 py-3 font-mono text-xs font-semibold text-blue-700">
                        {row.voucher}
                      </td>
                      <td className="px-3 py-3">{row.particulars}</td>
                      <td className="px-3 py-3">{row.reference}</td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums text-emerald-600">
                        {row.debit ? money(row.debit) : "₹0.00"}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums text-rose-600">
                        {row.credit ? money(row.credit) : "₹0.00"}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums">
                        {money(row.balance)}
                      </td>
                      <td className="px-3 py-3 text-slate-500">{row.nature}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

export function TrialBalancePanel() {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(["100000", "110000"]),
  );

  function toggle(code: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  const totals = {
    periodDr: 66934.16,
    periodCr: 9862.6,
    net: 883300 + 426800 + 250000 + 85662.6 + 46200,
  };

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <Scale className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Hierarchical Multi-Level Trial Balance (রেওয়ামিল)
            </h2>
            <p className="mt-1 text-sm text-muted">
              Rolls up child sub-ledgers and branch accounts into control heads
              with opening, period, and net balances.
            </p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Balanced (Dr = Cr)
        </span>
      </div>

      <div className="table-scroll overflow-hidden rounded-xl border border-border">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead>
            <tr className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-muted-soft">
              <th className="px-3 py-3 font-semibold">Account Code & Title</th>
              <th className="px-3 py-3 font-semibold">Class</th>
              <th className="px-3 py-3 text-right font-semibold">Opening Dr (₹)</th>
              <th className="px-3 py-3 text-right font-semibold">Opening Cr (₹)</th>
              <th className="px-3 py-3 text-right font-semibold">Period Debit (₹)</th>
              <th className="px-3 py-3 text-right font-semibold">
                Period Credit (₹)
              </th>
              <th className="px-3 py-3 text-right font-semibold">Net Balance (₹)</th>
            </tr>
          </thead>
          <tbody>
            {trialTree.map((node) => (
              <TbRows
                key={node.code}
                node={node}
                depth={0}
                expanded={expanded}
                onToggle={toggle}
              />
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-900 text-white">
              <td className="px-3 py-3 font-semibold" colSpan={4}>
                Grand Trial Balance Total (মোট রেওয়ামিল)
              </td>
              <td className="px-3 py-3 text-right font-semibold text-emerald-400">
                {money(totals.periodDr)}
              </td>
              <td className="px-3 py-3 text-right font-semibold text-rose-400">
                {money(totals.periodCr)}
              </td>
              <td className="px-3 py-3 text-right font-semibold text-amber-300">
                Balanced
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function TbRows({
  node,
  depth,
  expanded,
  onToggle,
}: {
  node: TbNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (code: string) => void;
}) {
  const hasChildren = Boolean(node.children?.length);
  const isOpen = expanded.has(node.code);

  return (
    <>
      <tr className={depth % 2 === 0 ? "bg-white" : "bg-slate-50/70"}>
        <td className="px-3 py-3">
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${depth * 16}px` }}
          >
            <button
              type="button"
              onClick={() => hasChildren && onToggle(node.code)}
              className={`flex h-5 w-5 items-center justify-center ${
                hasChildren ? "text-slate-500" : "text-transparent"
              }`}
            >
              {hasChildren ? (
                isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )
              ) : (
                "•"
              )}
            </button>
            <div>
              <p className="font-semibold text-slate-800">
                <span className="mr-2 font-mono text-xs text-slate-500">
                  {node.code}
                </span>
                {node.title}
              </p>
              <p className="text-xs text-muted">{node.bangla}</p>
            </div>
          </div>
        </td>
        <td className="px-3 py-3">
          <span
            className={`rounded-md px-2 py-1 text-[11px] font-semibold ${classTone[node.className]}`}
          >
            {node.className}
          </span>
        </td>
        <td className="px-3 py-3 text-right tabular-nums">
          {money(node.openingDr)}
        </td>
        <td className="px-3 py-3 text-right tabular-nums">
          {money(node.openingCr)}
        </td>
        <td className="px-3 py-3 text-right font-semibold tabular-nums text-emerald-600">
          {money(node.periodDr)}
        </td>
        <td className="px-3 py-3 text-right font-semibold tabular-nums text-rose-600">
          {money(node.periodCr)}
        </td>
        <td className="px-3 py-3 text-right font-semibold tabular-nums">
          {money(node.net)}{" "}
          <span className="text-xs font-medium text-slate-400">
            {node.nature}
          </span>
        </td>
      </tr>
      {hasChildren && isOpen
        ? node.children!.map((child) => (
            <TbRows
              key={child.code}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))
        : null}
    </>
  );
}

export function SubLedgerPanel() {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <GitBranch className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Sub-Ledger Account Master & Branch Breakdown (উপ-খতিয়ান বিশ্লেষণ)
          </h2>
          <p className="mt-1 text-sm text-muted">
            Branch-wise loan portfolio and member deposit sub-accounts tied to
            control general ledgers
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {subLedgers.map((item) => (
          <article
            key={item.code}
            className="rounded-2xl border border-border bg-white p-4"
          >
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {item.code}
              </span>
              <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                {item.branch}
              </span>
            </div>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-900">
                  {item.name}
                </h3>
                <p className="mt-1 text-xs text-muted">
                  Control Head: {item.control}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-soft">
                  Subledger Balance
                </p>
                <p className="mt-1 text-lg font-semibold text-emerald-600">
                  {money(item.balance)}
                </p>
                <p className="mt-1 text-xs text-muted">{item.meta}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function PostedVouchersPanel() {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.toLowerCase();
    return vouchers.filter(
      (row) =>
        row.no.toLowerCase().includes(q) ||
        row.narration.toLowerCase().includes(q) ||
        row.type.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      <FilterInput value={query} onChange={setQuery} />
      <div className="table-scroll mt-4">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead>
            <tr className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-muted-soft">
              <th className="px-3 py-3 font-semibold">Voucher No</th>
              <th className="px-3 py-3 font-semibold">Date</th>
              <th className="px-3 py-3 font-semibold">Type</th>
              <th className="px-3 py-3 font-semibold">Narration</th>
              <th className="px-3 py-3 text-right font-semibold">Total Debit ₹</th>
              <th className="px-3 py-3 text-right font-semibold">
                Total Credit ₹
              </th>
              <th className="px-3 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.no} className="border-t border-border/70">
                <td className="px-3 py-3 font-mono text-xs font-semibold text-slate-800">
                  {row.no}
                </td>
                <td className="px-3 py-3 text-slate-700">
                  <p>{row.date}</p>
                  <p className="text-xs text-muted">{row.time}</p>
                </td>
                <td className="px-3 py-3">
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                    {row.type}
                  </span>
                </td>
                <td className="px-3 py-3 text-slate-700">{row.narration}</td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums">
                  {money(row.debit)}
                </td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums">
                  {money(row.credit)}
                </td>
                <td className="px-3 py-3">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function DayBookPanel() {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.toLowerCase();
    return dayBookRows.filter(
      (row) =>
        row.voucher.toLowerCase().includes(q) ||
        row.ledger.toLowerCase().includes(q) ||
        row.particulars.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Day Book Ledger Journal (দৈনিক খতিয়ান বই)
          </h2>
          <p className="mt-1 text-sm text-muted">
            All debit and credit financial postings for today
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-soft">
            Opening Cash Balance
          </p>
          <p className="mt-1 text-lg font-semibold text-emerald-600">
            ₹65,000.00
          </p>
        </div>
      </div>

      <FilterInput value={query} onChange={setQuery} />

      <div className="table-scroll mt-4">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-[0.12em] text-muted-soft">
              <th className="pb-3 pr-3 font-semibold">Voucher No</th>
              <th className="pb-3 pr-3 font-semibold">Ledger Head</th>
              <th className="pb-3 pr-3 font-semibold">Particulars</th>
              <th className="pb-3 pr-3 text-right font-semibold">Debit (Dr) ₹</th>
              <th className="pb-3 text-right font-semibold">Credit (Cr) ₹</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={`${row.voucher}-${index}`}
                className="border-t border-border/70"
              >
                <td className="py-3 pr-3 font-mono text-xs font-semibold text-slate-800">
                  {row.voucher}
                </td>
                <td className="py-3 pr-3 text-slate-700">{row.ledger}</td>
                <td className="py-3 pr-3 text-slate-700">{row.particulars}</td>
                <td className="py-3 pr-3 text-right font-semibold tabular-nums">
                  {money(row.debit)}
                </td>
                <td className="py-3 text-right font-semibold tabular-nums">
                  {money(row.credit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function CashBookPanel() {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.toLowerCase();
    return cashBookRows.filter(
      (row) =>
        row.voucher.toLowerCase().includes(q) ||
        row.particulars.toLowerCase().includes(q) ||
        row.mode.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Cash & Bank Clearing Book (নগদান ও ব্যাংক বই)
          </h2>
          <p className="mt-1 text-sm text-muted">
            Cash-in-hand and bank disbursement / collection register
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-soft">
            Closing Balance
          </p>
          <p className="mt-1 text-lg font-semibold text-emerald-600">₹673.16</p>
        </div>
      </div>

      <FilterInput value={query} onChange={setQuery} />

      <div className="table-scroll mt-4">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-[0.12em] text-muted-soft">
              <th className="pb-3 pr-3 font-semibold">Date</th>
              <th className="pb-3 pr-3 font-semibold">Voucher #</th>
              <th className="pb-3 pr-3 font-semibold">Particulars</th>
              <th className="pb-3 pr-3 font-semibold">Mode</th>
              <th className="pb-3 pr-3 text-right font-semibold">
                Receipt (Dr) ₹
              </th>
              <th className="pb-3 pr-3 text-right font-semibold">
                Payment (Cr) ₹
              </th>
              <th className="pb-3 text-right font-semibold">Balance ₹</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={`${row.voucher}-${index}`}
                className="border-t border-border/70"
              >
                <td className="py-3 pr-3 text-slate-700">{row.date}</td>
                <td className="py-3 pr-3 font-mono text-xs font-semibold text-slate-800">
                  {row.voucher}
                </td>
                <td className="py-3 pr-3 text-slate-700">{row.particulars}</td>
                <td className="py-3 pr-3">
                  {row.mode === "Bank" ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      Bank
                    </span>
                  ) : (
                    <span className="text-slate-700">Cash</span>
                  )}
                </td>
                <td className="py-3 pr-3 text-right font-semibold tabular-nums">
                  {money(row.receipt)}
                </td>
                <td className="py-3 pr-3 text-right font-semibold tabular-nums">
                  {money(row.payment)}
                </td>
                <td
                  className={`py-3 text-right font-semibold tabular-nums ${
                    row.balance < 0 ? "text-rose-600" : "text-slate-800"
                  }`}
                >
                  {money(row.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SummaryCell({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className={`mt-1 font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}

function FilterInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative block w-full">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Filter records..."
        className="w-full rounded-full border border-border bg-surface-muted py-2.5 pr-3 pl-9 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}
