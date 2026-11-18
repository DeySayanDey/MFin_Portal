"use client";

import { useMemo, useState } from "react";
import {
  BellRing,
  FileWarning,
  Gavel,
  Mail,
  Search,
  Users,
} from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  formatInr,
  lmsLoans,
  metricToneClass,
  type LmsLoan,
} from "@/features/lms/components/lms-data";

const protocolSteps = [
  {
    title: "Stage 1 · Soft Reminder",
    body: "Automated SMS & WhatsApp reminder with 1-click UPI payment link",
    icon: BellRing,
  },
  {
    title: "Stage 2 · Field PTP",
    body: "Physical field verification, cause analysis & Promise-To-Pay (PTP) agreement",
    icon: Users,
  },
  {
    title: "Stage 3 · Group Summons",
    body: "Summons Group Leader & Co-Guarantors under mutual cross-guarantee pledge",
    icon: Users,
  },
  {
    title: "Stage 4 · Legal / CIC",
    body: "Advocate notice, CIC default reporting & Lok Adalat / Arbitration referral",
    icon: Gavel,
  },
];

const defaulters = lmsLoans.filter((row) => row.dpd >= 30);

export function LmsDefaultersView() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<LmsLoan | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return defaulters;
    return defaulters.filter(
      (row) =>
        row.loanId.toLowerCase().includes(q) ||
        row.borrower.toLowerCase().includes(q) ||
        row.group.toLowerCase().includes(q),
    );
  }, [query]);

  const columns = useMemo<DataTableColumn<LmsLoan>[]>(
    () => [
      {
        id: "loanId",
        header: "Loan A/c",
        className: "font-semibold text-slate-900",
        cell: (row) => row.loanId,
      },
      {
        id: "borrower",
        header: "Borrower",
        className: "font-medium text-slate-800",
        cell: (row) => row.borrower,
      },
      {
        id: "mobile",
        header: "Mobile",
        className: "text-slate-600",
        cell: (row) => row.mobile,
      },
      {
        id: "group",
        header: "JLG Group",
        className: "text-slate-600",
        cell: (row) => row.group,
      },
      {
        id: "outstanding",
        header: "Outstanding",
        align: "end",
        className: "font-semibold text-slate-900",
        cell: (row) => formatInr(row.outstanding),
      },
      {
        id: "overdue",
        header: "Overdue",
        align: "end",
        className: "font-semibold text-rose-600",
        cell: (row) => {
          const overdue = Math.min(
            row.emi * 2,
            Math.round(row.outstanding * 0.2 * 100) / 100,
          );
          return formatInr(overdue);
        },
      },
      {
        id: "dpd",
        header: "DPD",
        align: "center",
        className: "font-semibold text-amber-700",
        cell: (row) => row.dpd,
      },
      {
        id: "actions",
        header: "Actions",
        cell: (row) => (
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant="secondary"
              icon={Mail}
              className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
            >
              Reminder
            </Button>
            <Button
              size="sm"
              variant="amber"
              icon={FileWarning}
              onClick={() => setSelected(row)}
            >
              Legal Notice
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const overdueTotal = defaulters.reduce(
    (sum, row) => sum + Math.min(row.emi * 2, row.outstanding * 0.2),
    0,
  );

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" icon={Mail}>
          Bulk Reminder SMS
        </Button>
        <Button variant="warning" icon={FileWarning}>
          Bureau Export Pack
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Delinquent Accounts",
            value: String(defaulters.length),
            hint: "DPD ≥ 30",
            tone: "amber" as const,
          },
          {
            label: "Overdue Demand",
            value: formatInr(overdueTotal, 0),
            hint: "Immediate collectible",
            tone: "rose" as const,
          },
          {
            label: "Legal Notices Ready",
            value: String(defaulters.filter((row) => row.dpd >= 60).length),
            hint: "Stage 4 candidates",
            tone: "violet" as const,
          },
          {
            label: "CIC Export Due",
            value: "Monthly",
            hint: "CIBIL / CRIF / Equifax",
            tone: "blue" as const,
          },
        ].map((metric) => (
          <div
            key={metric.label}
            className={`rounded-2xl border px-4 py-3.5 ${metricToneClass[metric.tone]}`}
          >
            <p className="text-xs font-semibold tracking-wide uppercase opacity-80">
              {metric.label}
            </p>
            <p className="mt-1.5 text-xl font-bold tracking-tight">
              {metric.value}
            </p>
            <p className="mt-1 text-xs opacity-75">{metric.hint}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-violet-900">
          Structured Overdue Collection Protocol
        </h2>
        <p className="mt-1 text-sm text-violet-800/80">
          Compliant with RBI Fair Practices Code for Microfinance
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {protocolSteps.map((step) => (
            <div
              key={step.title}
              className="rounded-xl border border-violet-100 bg-white px-3.5 py-3"
            >
              <step.icon className="h-4 w-4 text-violet-600" />
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {step.title}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
          <input autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter records..."
            className="w-full rounded-xl border border-border bg-surface-muted py-2.5 pr-3 pl-9 text-sm outline-none focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10"
          />
        </div>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        getRowKey={(row) => row.loanId}
        minWidth="1040px"
        title="DPD Aging · Delinquent Borrowers"
        description="Formal legal demand letter generation and guarantor summons"
      />

      <LegalNoticeModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        loan={selected}
      />
    </div>
  );
}

function LegalNoticeModal({
  open,
  onClose,
  loan,
}: {
  open: boolean;
  onClose: () => void;
  loan: LmsLoan | null;
}) {
  if (!loan) return null;
  const overdue = Math.min(
    loan.emi * 2,
    Math.round(loan.outstanding * 0.2 * 100) / 100,
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Legal Demand Notice"
      subtitle={`Ref: NOTC-20260912-${loan.loanId.slice(-5)}`}
      footer={
        <>
          <Button variant="soft" onClick={onClose}>
            Close
          </Button>
          <Button icon={FileWarning} onClick={onClose}>
            Print / Dispatch Notice
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm leading-6 text-slate-700">
        <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:justify-between">
          <div>
            <p className="font-semibold text-slate-900">
              Legal Department & Debt Recovery Cell
            </p>
            <p className="text-xs text-slate-500">
              RBI Reg. No: B-13.02045 · Plot 42, Market Yard Road, Karveer
            </p>
          </div>
          <p className="text-xs text-slate-500">Date: Sep 12, 2026</p>
        </div>

        <div>
          <p className="font-semibold text-slate-900">{loan.borrower}</p>
          <p>S/o / W/o: Anand More</p>
          <p>Plot 12, Uchgaon Road, Uchgaon, Kolhapur - 416005</p>
          <p>Mobile: {loan.mobile}</p>
        </div>

        <div className="grid gap-3 rounded-xl border border-rose-100 bg-rose-50 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-rose-700">Days Past Due</p>
            <p className="mt-1 text-lg font-bold text-rose-800">{loan.dpd}</p>
          </div>
          <div>
            <p className="text-xs text-rose-700">Outstanding GLP</p>
            <p className="mt-1 text-lg font-bold text-rose-800">
              {formatInr(loan.outstanding)}
            </p>
          </div>
        </div>

        <p>
          Take notice that an overdue balance of{" "}
          <strong>{formatInr(overdue)}</strong> is immediately outstanding on
          Loan Account <strong>{loan.loanId}</strong>. Despite multiple Kendra
          collection reminders, you have defaulted on scheduled repayments. You
          are hereby called upon to remit the entire overdue sum within the
          stipulated deadline, failing which legal proceedings and adverse
          credit bureau reporting (CIBIL/CRIF) will be initiated.
        </p>

        <p>
          Payment must be remitted on or before the notice deadline at your
          branch or through official UPI / Kendra meetings.
        </p>

        <div className="grid gap-6 border-t border-slate-200 pt-4 sm:grid-cols-2">
          <p className="text-xs text-slate-500">
            Copy forwarded to Joint Liability Group (JLG) Co-Guarantors
          </p>
          <p className="text-right text-xs font-semibold text-slate-700">
            For eZiMicro Financial Services Ltd
          </p>
        </div>
      </div>
    </Modal>
  );
}
