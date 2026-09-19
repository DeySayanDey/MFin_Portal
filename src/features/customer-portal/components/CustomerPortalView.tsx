"use client";

import { useState } from "react";
import {
  BadgeCheck,
  BookOpen,
  CalendarDays,
  Clock3,
  FileText,
  MapPin,
  Printer,
  QrCode,
  UsersRound,
  Zap,
} from "lucide-react";

const loanPassbook = [
  {
    date: "12-Jul-2026",
    particulars: "Disbursal: Loan Disbursal Credit (Mahila Krishi & Dairy Loan)",
    ref: "DBR-LN-00001",
    mode: "IMPS Direct Bank Transfer",
    principal: "₹40,000.00",
    interest: "₹0.00",
    total: "₹40,000.00",
    totalTone: "credit" as const,
    balance: "₹40,000.00",
  },
  {
    date: "12-Aug-2026",
    particulars: "EMI Collection: Kendra Meeting Cash (Installment 1)",
    ref: "RCPT-KM-0812",
    mode: "Kendra Meeting Cash",
    principal: "₹2,916.00",
    interest: "₹818.16",
    total: "-₹3,734.16",
    totalTone: "debit" as const,
    balance: "₹37,083.84",
  },
  {
    date: "12-Sep-2026",
    particulars: "EMI Collection: Kendra Meeting Cash (Installment 2)",
    ref: "RCPT-KM-0912",
    mode: "Kendra Meeting Cash",
    principal: "₹2,980.00",
    interest: "₹754.16",
    total: "-₹3,734.16",
    totalTone: "debit" as const,
    balance: "₹33,910.95",
  },
];

const unifiedRows = [
  {
    date: "15-Aug-2026",
    product: "Micro Savings",
    particulars: "Monthly Kendra Thrift Deposit",
    debit: "—",
    credit: "₹500.00",
    balance: "₹12,450.00",
  },
  {
    date: "12-Sep-2026",
    product: "Micro Loan",
    particulars: "EMI Collection Installment 2",
    debit: "₹3,734.16",
    credit: "—",
    balance: "₹33,910.95",
  },
  {
    date: "05-Sep-2026",
    product: "Recurring Deposit",
    particulars: "RD Installment Credit",
    debit: "—",
    credit: "₹1,500.00",
    balance: "₹18,000.00",
  },
  {
    date: "01-Sep-2026",
    product: "Fixed Deposit",
    particulars: "FD Interest Accrual Posting",
    debit: "—",
    credit: "₹375.00",
    balance: "₹50,000.00",
  },
];

const productTabs = [
  "Unified Dr/Cr Statement",
  "Loans (1)",
  "Bachat Gat Savings",
  "Recurring Deposits (RD)",
] as const;

export function CustomerPortalView() {
  const [activeTab, setActiveTab] =
    useState<(typeof productTabs)[number]>("Unified Dr/Cr Statement");

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      {/* Customer hero */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 p-4 text-white shadow-[var(--shadow-card)] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-xl font-bold">
              S
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  Sunita Kamble
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  KYC Verified
                </span>
                <span className="font-mono text-xs text-white/85">
                  CUST-2026-0001
                </span>
              </div>
              <div className="mt-3 space-y-1.5 text-sm text-white/90">
                <p className="inline-flex items-center gap-2">
                  <UsersRound className="h-3.5 w-3.5 shrink-0" />
                  Laxmi Mahila Bachat JLG
                </p>
                <p className="inline-flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  Gandhinagar Kendra 01
                </p>
                <p className="inline-flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                  Kendra Meeting: Every Monday @ 09:30 AM
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch">
            <ActionChip icon={QrCode} label="Pay EMI Online" />
            <ActionChip icon={FileText} label="Statement PDF" />
            <ActionChip icon={BadgeCheck} label="No Dues Certificate" highlight />
          </div>
        </div>
      </section>

      {/* Facility + credit health */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.85fr)]">
        <article className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-soft">
            Active Microcredit Facility
          </p>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-600 sm:text-lg">
                Mahila Krishi & Dairy Loan
              </h3>
              <p className="mt-1 font-mono text-sm font-semibold text-emerald-600">
                LN-2026-00001
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-2xl font-semibold text-orange-500 sm:text-3xl">
                ₹33,910.95
              </p>
              <p className="mt-1 text-sm text-muted">of ₹40,000.00 Disbursed</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-slate-800 px-4 py-4 text-white">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-300">Repayment Completed</p>
              <p className="text-sm font-semibold text-emerald-400">
                2 of 12 installments Paid (16.2%)
              </p>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-600">
              <div className="h-full w-[16.2%] rounded-full bg-teal-400" />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-violet-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Clock3 className="h-4 w-4 text-blue-600" />
              ₹3,734.16 Due on Oct 12, 2026
            </p>
            <button
              type="button"
              className="btn btn-primary"
            >
              Pay Now
            </button>
          </div>
        </article>

        <article className="rounded-2xl bg-gradient-to-b from-slate-800 via-slate-900 to-violet-950 p-4 text-white shadow-[var(--shadow-card)] sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-300">
              Credit Health & Offers
            </p>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-sky-200">
              Score: 745
            </span>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-950/50 p-4">
            <p className="text-sm text-slate-300">Pre-Approved Limit</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-400">
              ₹50,000.00
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Eligible for instant disbursal with 0 documentation based on
              flawless repayment track record.
            </p>
          </div>

          <button
            type="button"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-300 transition hover:text-amber-200"
          >
            <Zap className="h-4 w-4" />
            Apply Instant Top-Up Loan
          </button>
        </article>
      </section>

      {/* Digital loan passbook */}
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-700 sm:text-lg">
              Digital Loan Passbook{" "}
              <span className="font-medium text-muted">(पासबुक)</span>
            </h2>
            <p className="mt-1 text-sm text-muted">
              Complete historical record of disbursals and Kendra meeting
              collections.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            <Printer className="h-4 w-4" />
            Print Passbook
          </button>
        </div>

        <div className="table-scroll">
          <table className="w-full min-w-[920px] overflow-hidden rounded-2xl text-left text-sm">
            <thead>
              <tr className="bg-slate-700 text-[11px] uppercase tracking-[0.12em] text-white">
                <th className="rounded-tl-2xl px-3 py-3 font-semibold">Date</th>
                <th className="px-3 py-3 font-semibold">Particulars / Description</th>
                <th className="px-3 py-3 font-semibold">Ref / Receipt #</th>
                <th className="px-3 py-3 font-semibold">Mode</th>
                <th className="px-3 py-3 font-semibold">Principal</th>
                <th className="px-3 py-3 font-semibold">Interest</th>
                <th className="px-3 py-3 font-semibold">Total (₹)</th>
                <th className="rounded-tr-2xl px-3 py-3 font-semibold">
                  Balance (₹)
                </th>
              </tr>
            </thead>
            <tbody>
              {loanPassbook.map((row) => (
                <tr
                  key={row.ref}
                  className="border-b border-border bg-white last:border-0"
                >
                  <td className="px-3 py-3.5 whitespace-nowrap text-slate-700">
                    {row.date}
                  </td>
                  <td className="max-w-xs px-3 py-3.5 text-slate-700">
                    {row.particulars}
                  </td>
                  <td className="px-3 py-3.5 font-mono text-[12px] text-slate-600">
                    {row.ref}
                  </td>
                  <td className="px-3 py-3.5 text-slate-600">{row.mode}</td>
                  <td className="px-3 py-3.5 text-muted">{row.principal}</td>
                  <td className="px-3 py-3.5 text-muted">{row.interest}</td>
                  <td
                    className={`px-3 py-3.5 font-semibold ${
                      row.totalTone === "credit"
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {row.total}
                  </td>
                  <td className="px-3 py-3.5 font-semibold text-amber-500">
                    {row.balance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 360 passbook */}
      <section className="rounded-2xl bg-slate-950 p-4 text-white shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="inline-flex items-center gap-2 text-base font-semibold sm:text-lg">
              <BookOpen className="h-4 w-4 text-violet-300" />
              Consolidated 360° Member Multi-Product Passbook{" "}
              <span className="font-medium text-slate-300">(সমগ্র খতিয়ান)</span>
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Unified financial ledger across Micro Loans, Bachat Gat Savings,
              Recurring Deposits (RD), and Fixed Deposits (FD)
            </p>
          </div>
          <button
            type="button"
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            <Printer className="h-4 w-4" />
            Print 360° Statement
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Active Loan Outstanding"
            value="₹33,814.66"
            valueClass="text-amber-300"
            note="1 Loan Active"
            noteClass="text-emerald-400"
          />
          <SummaryCard
            label="Thrift Savings Balance"
            value="₹12,450.00"
            valueClass="text-emerald-400"
            note="Compulsory Bachat Gat"
            noteClass="text-slate-400"
          />
          <SummaryCard
            label="Recurring Deposit (RD)"
            value="₹18,000.00"
            valueClass="text-sky-300"
            note="12 of 24 Paid"
            noteClass="text-slate-400"
          />
          <SummaryCard
            label="Fixed Deposit (FD Lien)"
            value="₹50,000.00"
            valueClass="text-fuchsia-400"
            note="9.0% p.a. Maturity"
            noteClass="text-slate-400"
          />
        </div>

        <div className="mt-4 -mx-1 overflow-x-auto px-1 no-scrollbar">
          <div className="inline-flex min-w-max items-center gap-2">
            {productTabs.map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                    active
                      ? "bg-violet-600 text-white"
                      : "bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        <div className="table-scroll mt-4">
          <table className="w-full min-w-[760px] overflow-hidden rounded-2xl text-left text-sm">
            <thead>
              <tr className="bg-black/50 text-[11px] uppercase tracking-[0.12em] text-slate-300">
                <th className="rounded-tl-2xl px-3 py-3 font-semibold">Date</th>
                <th className="px-3 py-3 font-semibold">Product</th>
                <th className="px-3 py-3 font-semibold">
                  Particulars / Transaction Description
                </th>
                <th className="px-3 py-3 font-semibold">Debit (Dr)</th>
                <th className="px-3 py-3 font-semibold">Credit (Cr)</th>
                <th className="rounded-tr-2xl px-3 py-3 font-semibold">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {unifiedRows.map((row) => (
                <tr
                  key={`${row.date}-${row.product}`}
                  className="border-b border-white/10 last:border-0"
                >
                  <td className="px-3 py-3.5 whitespace-nowrap text-slate-300">
                    {row.date}
                  </td>
                  <td className="px-3 py-3.5 text-slate-200">{row.product}</td>
                  <td className="px-3 py-3.5 text-slate-300">{row.particulars}</td>
                  <td className="px-3 py-3.5 font-semibold text-rose-400">
                    {row.debit}
                  </td>
                  <td className="px-3 py-3.5 font-semibold text-emerald-400">
                    {row.credit}
                  </td>
                  <td className="px-3 py-3.5 font-semibold text-white">
                    {row.balance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ActionChip({
  icon: Icon,
  label,
  highlight = false,
}: {
  icon: typeof QrCode;
  label: string;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
        highlight
          ? "bg-amber-400/20 text-amber-100 hover:bg-amber-400/30"
          : "bg-white/15 text-white hover:bg-white/25"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function SummaryCard({
  label,
  value,
  valueClass,
  note,
  noteClass,
}: {
  label: string;
  value: string;
  valueClass: string;
  note: string;
  noteClass: string;
}) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold ${valueClass}`}>{value}</p>
      <p className={`mt-2 text-xs ${noteClass}`}>{note}</p>
    </div>
  );
}
