"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import {
  CashBookPanel,
  TrialBalancePanel,
} from "@/features/master/components/CoaLedgerPanels";
import { CoaTreeView } from "@/features/master/components/CoaTreeView";

const fieldClass =
  "w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/10";

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);
}

function PageActions({ actions }: { actions: ReactNode }) {
  return <div className="btn-actions justify-end">{actions}</div>;
}

type LineRow = {
  id: string;
  party: string;
  account: string;
  debit: number;
  credit: number;
};

const initialLines: LineRow[] = [
  {
    id: "1",
    party: "CUST-WB-00101 · Ruma Banerjee",
    account: "121100 — JLG Microfinance Loans",
    debit: 1200,
    credit: 0,
  },
  {
    id: "2",
    party: "CUST-WB-00102 · Kakali Mondal",
    account: "121100 — JLG Microfinance Loans",
    debit: 980,
    credit: 0,
  },
  {
    id: "3",
    party: "CUST-WB-00103 · Shampa Das",
    account: "121100 — JLG Microfinance Loans",
    debit: 1450,
    credit: 0,
  },
];

const postedVouchers = [
  {
    no: "CVD-20260912-0001",
    date: "12 Sep 2026",
    party: "Ruma Banerjee",
    narration: "Kendra collection LN-2026-00001",
    debit: 3017.49,
    credit: 0,
    status: "Posted",
  },
  {
    no: "CVD-20260912-0002",
    date: "12 Sep 2026",
    party: "Kakali Mondal",
    narration: "Bachat Gat deposit Sonarpur #01",
    debit: 1250,
    credit: 0,
    status: "Posted",
  },
  {
    no: "SWD-20260912-0003",
    date: "12 Sep 2026",
    party: "Shampa Das",
    narration: "Savings withdrawal counter",
    debit: 0,
    credit: 2000,
    status: "Posted",
  },
  {
    no: "CTR-20260912-0004",
    date: "12 Sep 2026",
    party: "Branch Vault → Bank",
    narration: "Surplus vault remittance",
    debit: 50000,
    credit: 50000,
    status: "Pending Checker",
  },
];

export function VoucherEntryView() {
  const [lines, setLines] = useState(initialLines);
  const [voucherType, setVoucherType] = useState("Cash/Bank Deposit Voucher");
  const [narration, setNarration] = useState(
    "Official ledger narration description...",
  );
  const [reference, setReference] = useState(
    "UTR-928174812 / CHQ-001248 / Direct Cash",
  );
  const [collector, setCollector] = useState("Ruma Banerjee (Sonarpur #01)");

  const totals = useMemo(() => {
    const debit = lines.reduce((sum, row) => sum + row.debit, 0);
    const credit = lines.reduce((sum, row) => sum + row.credit, 0);
    return { debit, credit, variance: debit - credit };
  }, [lines]);

  function addLine() {
    setLines((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        party: "",
        account: "111000 — Branch Vault Cash",
        debit: 0,
        credit: 0,
      },
    ]);
  }

  function removeLine(id: string) {
    setLines((prev) => prev.filter((row) => row.id !== id));
  }

  function updateLine(id: string, patch: Partial<LineRow>) {
    setLines((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  const lineColumns: DataTableColumn<LineRow>[] = [
      {
        id: "party",
        header: "Party / Customer",
        cell: (row) => (
          <input autoComplete="off"
            className={fieldClass}
            value={row.party}
            onChange={(event) =>
              updateLine(row.id, { party: event.target.value })
            }
          />
        ),
      },
      {
        id: "account",
        header: "COA Account",
        cell: (row) => (
          <select
            className={fieldClass}
            value={row.account}
            onChange={(event) =>
              updateLine(row.id, { account: event.target.value })
            }
          >
            <option>111000 — Branch Vault Cash</option>
            <option>112100 — Bank Current Account</option>
            <option>121100 — JLG Microfinance Loans</option>
            <option>211000 — Bachat Gat Savings</option>
            <option>411000 — Interest Income</option>
          </select>
        ),
      },
      {
        id: "debit",
        header: "Debit (Dr)",
        align: "end",
        cell: (row) => (
          <input autoComplete="off"
            type="number"
            min={0}
            className={`${fieldClass} text-right`}
            value={row.debit}
            onChange={(event) =>
              updateLine(row.id, {
                debit: Number(event.target.value) || 0,
              })
            }
          />
        ),
      },
      {
        id: "credit",
        header: "Credit (Cr)",
        align: "end",
        cell: (row) => (
          <input autoComplete="off"
            type="number"
            min={0}
            className={`${fieldClass} text-right`}
            value={row.credit}
            onChange={(event) =>
              updateLine(row.id, {
                credit: Number(event.target.value) || 0,
              })
            }
          />
        ),
      },
      {
        id: "remove",
        header: "",
        cell: (row) => (
          <button
            type="button"
            onClick={() => removeLine(row.id)}
            className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
            aria-label="Remove line"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ),
      },
    ];

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <PageActions
        actions={
          <>
            <button type="button" className="btn btn-secondary" onClick={addLine}>
              <Plus className="h-4 w-4" />
              Add Line
            </button>
            <button type="button" className="btn btn-primary">
              <Save className="h-4 w-4" />
              Post Voucher
            </button>
          </>
        }
      />

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <h2 className="text-sm font-semibold text-slate-900">Voucher Header</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-700">
              Voucher Type
            </span>
            <select
              className={fieldClass}
              value={voucherType}
              onChange={(event) => setVoucherType(event.target.value)}
            >
              <option>Cash/Bank Deposit Voucher</option>
              <option>Savings Withdrawal Voucher</option>
              <option>Office Expense Voucher</option>
              <option>Contra Transfer Voucher</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-700">
              Collected By / Counter
            </span>
            <input autoComplete="off"
              className={fieldClass}
              value={collector}
              onChange={(event) => setCollector(event.target.value)}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium text-slate-700">
              Narration
            </span>
            <input autoComplete="off"
              className={fieldClass}
              value={narration}
              onChange={(event) => setNarration(event.target.value)}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium text-slate-700">
              Reference (UTR / Cheque / Cash)
            </span>
            <input autoComplete="off"
              className={fieldClass}
              value={reference}
              onChange={(event) => setReference(event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Double-Entry Line Items
          </h2>
          <span
            className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
              Math.abs(totals.variance) < 0.01
                ? "bg-brand-soft text-brand-ink"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            Voucher Target: {formatInr(Math.abs(totals.variance))}{" "}
            {Math.abs(totals.variance) < 0.01 ? "✓ Balanced" : "(Unbalanced)"}
          </span>
        </div>

        <DataTable
          data={lines}
          columns={lineColumns}
          getRowKey={(row) => row.id}
          minWidth="840px"
        />
        <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-border pt-3 text-sm font-semibold">
          <span>Totals</span>
          <span className="text-emerald-700">{formatInr(totals.debit)}</span>
          <span className="text-rose-600">{formatInr(totals.credit)}</span>
        </div>
      </section>
    </div>
  );
}

export function JournalAdjustmentView() {
  const [rows, setRows] = useState([
    {
      id: "1",
      account: "111000 — Branch Vault Cash",
      label: "Cash received",
      debit: 50000,
      credit: 0,
    },
    {
      id: "2",
      account: "411000 — Interest Income (সুদ আয়)",
      label: "Interest revenue",
      debit: 0,
      credit: 8500,
    },
    {
      id: "3",
      account: "112100 — Bank Current Account",
      label: "Surplus vault remitted to bank",
      debit: 0,
      credit: 41500,
    },
  ]);

  const totals = useMemo(() => {
    const debit = rows.reduce((sum, row) => sum + row.debit, 0);
    const credit = rows.reduce((sum, row) => sum + row.credit, 0);
    return { debit, credit, ok: Math.abs(debit - credit) < 0.01 };
  }, [rows]);

  const journalColumns: DataTableColumn<(typeof rows)[number]>[] = [
    {
      id: "account",
      header: "GL Account",
      cell: (row) => (
        <input autoComplete="off"
          className={fieldClass}
          value={row.account}
          onChange={(event) =>
            setRows((prev) =>
              prev.map((item) =>
                item.id === row.id
                  ? { ...item, account: event.target.value }
                  : item,
              ),
            )
          }
        />
      ),
    },
    {
      id: "label",
      header: "Particulars",
      cell: (row) => (
        <input autoComplete="off"
          className={fieldClass}
          value={row.label}
          onChange={(event) =>
            setRows((prev) =>
              prev.map((item) =>
                item.id === row.id
                  ? { ...item, label: event.target.value }
                  : item,
              ),
            )
          }
        />
      ),
    },
    {
      id: "debit",
      header: "Dr ₹",
      align: "end",
      cell: (row) => (
        <input autoComplete="off"
          type="number"
          className={`${fieldClass} text-right`}
          value={row.debit}
          onChange={(event) =>
            setRows((prev) =>
              prev.map((item) =>
                item.id === row.id
                  ? { ...item, debit: Number(event.target.value) || 0 }
                  : item,
              ),
            )
          }
        />
      ),
    },
    {
      id: "credit",
      header: "Cr ₹",
      align: "end",
      cell: (row) => (
        <input autoComplete="off"
          type="number"
          className={`${fieldClass} text-right`}
          value={row.credit}
          onChange={(event) =>
            setRows((prev) =>
              prev.map((item) =>
                item.id === row.id
                  ? { ...item, credit: Number(event.target.value) || 0 }
                  : item,
              ),
            )
          }
        />
      ),
    },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <PageActions
        actions={
          <button type="button" className="btn btn-primary">
            <CheckCircle2 className="h-4 w-4" />
            Post Journal
          </button>
        }
      />

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-slate-700">
            Narration
          </span>
          <input autoComplete="off"
            className={fieldClass}
            defaultValue="Surplus branch vault cash remitted and deposited into Bank Account"
          />
        </label>

        <DataTable
          className="mt-4"
          data={rows}
          columns={journalColumns}
          getRowKey={(row) => row.id}
          minWidth="720px"
        />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-muted px-4 py-3 text-sm">
          <span>
            Dr {formatInr(totals.debit)} · Cr {formatInr(totals.credit)}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 font-semibold ${
              totals.ok ? "text-brand-ink" : "text-amber-700"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            {totals.ok ? "Double-entry balanced" : "Balance required"}
          </span>
        </div>
      </section>
    </div>
  );
}

function VoucherListView({ filterHint }: { filterHint: string }) {
  const [query, setQuery] = useState("");
  const [printOpen, setPrintOpen] = useState(false);
  const [selected, setSelected] = useState(postedVouchers[0]);

  const rows = useMemo(() => {
    const q = query.toLowerCase();
    return postedVouchers.filter(
      (row) =>
        row.no.toLowerCase().includes(q) ||
        row.party.toLowerCase().includes(q) ||
        row.narration.toLowerCase().includes(q),
    );
  }, [query]);

  const voucherColumns: DataTableColumn<(typeof postedVouchers)[number]>[] = [
    {
      id: "date",
      header: "Date",
      cell: (row) => row.date,
    },
    {
      id: "no",
      header: "Voucher No",
      cell: (row) => (
        <span className="font-semibold text-slate-900">{row.no}</span>
      ),
    },
    {
      id: "party",
      header: "Party",
      cell: (row) => row.party,
    },
    {
      id: "narration",
      header: "Narration",
      cell: (row) => <span className="text-muted">{row.narration}</span>,
    },
    {
      id: "debit",
      header: "Dr ₹",
      align: "end",
      cell: (row) => (
        <span className="font-medium text-emerald-700">
          {row.debit ? formatInr(row.debit) : "—"}
        </span>
      ),
    },
    {
      id: "credit",
      header: "Cr ₹",
      align: "end",
      cell: (row) => (
        <span className="font-medium text-rose-600">
          {row.credit ? formatInr(row.credit) : "—"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            row.status === "Posted"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-surface-muted"
            title="Print"
            onClick={() => {
              setSelected(row);
              setPrintOpen(true);
            }}
          >
            <Printer className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-surface-muted"
            title="Reverse"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <PageActions
        actions={
          <button type="button" className="btn btn-primary">
            <Plus className="h-4 w-4" />
            New Voucher
          </button>
        }
      />

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
          <input autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={filterHint}
            className={`${fieldClass} pl-9`}
          />
        </div>

        <DataTable
          className="mt-4"
          data={rows}
          columns={voucherColumns}
          getRowKey={(row) => row.no}
          minWidth="900px"
        />
      </section>

      {printOpen && selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-soft">
                  Official Transaction Record & Thermal Print
                </p>
                <h2 className="mt-1 text-base font-semibold text-slate-900">
                  Core Banking Hub | RBI / MFI Reg #WB-88219
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPrintOpen(false)}
                className="rounded-lg p-1.5 text-muted hover:bg-surface-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Voucher No</dt>
                <dd className="font-semibold">{selected.no}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Date & Time</dt>
                <dd className="font-semibold">Sep 12, 2026, 12:36:57 PM</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Narration</dt>
                <dd className="max-w-[60%] text-right font-medium">
                  {selected.narration}
                </dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-border pt-2">
                <dt className="text-muted">Amount</dt>
                <dd className="font-semibold text-brand-ink">
                  {formatInr(selected.debit || selected.credit)}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-center text-xs text-muted">
              System Generated Digital Voucher · Thank you for banking with us.
            </p>
            <div className="btn-actions mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPrintOpen(false)}
              >
                Close
              </button>
              <button type="button" className="btn btn-primary">
                <Printer className="h-4 w-4" />
                Print Now
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CashDepositView() {
  return <VoucherListView filterHint="Search voucher no, name..." />;
}

export function SavingsWithdrawalView() {
  return <VoucherListView filterHint="Search voucher no, name..." />;
}

export function ContraTransferView() {
  const [debitAccount, setDebitAccount] = useState(
    "111000 — Branch Vault Cash",
  );
  const [creditAccount, setCreditAccount] = useState(
    "112100 — Bank Current Account",
  );
  const [amount, setAmount] = useState(50000);
  const [reference, setReference] = useState(
    "UTR-928174812 / CHQ-001248 / Direct Cash",
  );

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <PageActions
        actions={
          <button type="button" className="btn btn-primary">
            <Send className="h-4 w-4" />
            Submit for Checker
          </button>
        }
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Contra Entry Details
          </h2>
          <div className="mt-4 space-y-3">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-slate-700">
                Debit Account (Dr) · Change COA
              </span>
              <select
                className={fieldClass}
                value={debitAccount}
                onChange={(event) => setDebitAccount(event.target.value)}
              >
                <option>111000 — Branch Vault Cash</option>
                <option>112100 — Bank Current Account</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-slate-700">
                Credit Account (Cr) · Change COA
              </span>
              <select
                className={fieldClass}
                value={creditAccount}
                onChange={(event) => setCreditAccount(event.target.value)}
              >
                <option>112100 — Bank Current Account</option>
                <option>111000 — Branch Vault Cash</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-slate-700">
                Amount (₹)
              </span>
              <input autoComplete="off"
                type="number"
                className={fieldClass}
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value) || 0)}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-slate-700">
                Reference
              </span>
              <input autoComplete="off"
                className={fieldClass}
                value={reference}
                onChange={(event) => setReference(event.target.value)}
              />
            </label>
            <div className="rounded-xl bg-surface-muted px-3.5 py-3 text-sm">
              Voucher Target:{" "}
              <strong className="text-brand-ink">{formatInr(0)}</strong>{" "}
              <span className="text-muted">✓ Balanced contra</span>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand" />
            <h2 className="text-sm font-semibold text-slate-900">
              Checker Authorization Inbox (চেকার অনুমোদন কিউ)
            </h2>
          </div>
          <p className="text-sm text-muted">
            Review, verify line items, and authorize transactions requiring dual
            sign-off.
          </p>
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface-muted/50 px-4 py-8 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-brand" />
            <p className="mt-3 text-sm font-semibold text-slate-900">
              No pending maker-checker requests
            </p>
            <p className="mt-1 text-xs text-muted">
              Contra vouchers above threshold will appear here for Branch Manager
              approval.
            </p>
          </div>
          <button type="button" className="btn btn-secondary mt-4 w-full justify-center">
            <RefreshCw className="h-4 w-4" />
            Refresh Inbox
          </button>
        </article>
      </section>
    </div>
  );
}

export function AccountingCoaView({
  initialTab,
}: {
  initialTab?: string;
} = {}) {
  return <CoaTreeView initialTab={initialTab} />;
}

export function AccountingTrialBalanceView() {
  return <TrialBalancePanel />;
}

export function AccountingCashbookView() {
  return <CashBookPanel />;
}
