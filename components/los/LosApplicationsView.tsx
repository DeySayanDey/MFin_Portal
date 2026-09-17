"use client";

import { useMemo, useState } from "react";
import {
  Diamond,
  FileText,
  Grid2X2,
  Search,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

type LoanApp = {
  appNumber: string;
  borrower: string;
  scheme: string;
  applied: number;
  score: number;
  risk: "Low Risk" | "Fair" | "Moderate";
  feeGst: number;
  netDisbursal: number;
  status: "Disbursed" | "Sanctioned" | "Under Appraisal";
};

const applications: LoanApp[] = [
  {
    appNumber: "APP-2026-00120",
    borrower: "Gita Saha",
    scheme: "Mahila Krishi & Dairy Loan",
    applied: 50000,
    score: 750,
    risk: "Low Risk",
    feeGst: 1475,
    netDisbursal: 48525,
    status: "Disbursed",
  },
  {
    appNumber: "APP-2026-00119",
    borrower: "Anjali Chakraborty",
    scheme: "Gramin Micro Enterprise Loan",
    applied: 45000,
    score: 732,
    risk: "Low Risk",
    feeGst: 1327.5,
    netDisbursal: 43672.5,
    status: "Disbursed",
  },
  {
    appNumber: "APP-2026-00118",
    borrower: "Aparna Sen",
    scheme: "Mahila Krishi & Dairy Loan",
    applied: 40000,
    score: 718,
    risk: "Low Risk",
    feeGst: 1180,
    netDisbursal: 38820,
    status: "Disbursed",
  },
  {
    appNumber: "APP-2026-00117",
    borrower: "Mousumi Ghosh",
    scheme: "Gramin Micro Enterprise Loan",
    applied: 35000,
    score: 705,
    risk: "Low Risk",
    feeGst: 1032.5,
    netDisbursal: 33967.5,
    status: "Disbursed",
  },
  {
    appNumber: "APP-2026-00116",
    borrower: "Supriya Mondal",
    scheme: "Mahila Krishi & Dairy Loan",
    applied: 40000,
    score: 745,
    risk: "Low Risk",
    feeGst: 1180,
    netDisbursal: 38820,
    status: "Disbursed",
  },
  {
    appNumber: "APP-2026-00115",
    borrower: "Ruma More",
    scheme: "Gramin Micro Enterprise Loan",
    applied: 30000,
    score: 690,
    risk: "Fair",
    feeGst: 885,
    netDisbursal: 29115,
    status: "Disbursed",
  },
  {
    appNumber: "APP-2026-00114",
    borrower: "Meena Patil",
    scheme: "Mahila Krishi & Dairy Loan",
    applied: 42000,
    score: 728,
    risk: "Low Risk",
    feeGst: 1239,
    netDisbursal: 40761,
    status: "Disbursed",
  },
  {
    appNumber: "APP-2026-00113",
    borrower: "Pooja Gaikwad",
    scheme: "Gramin Micro Enterprise Loan",
    applied: 28000,
    score: 684,
    risk: "Fair",
    feeGst: 826,
    netDisbursal: 27174,
    status: "Sanctioned",
  },
  {
    appNumber: "APP-2026-00112",
    borrower: "Aarti Saha",
    scheme: "Mahila Krishi & Dairy Loan",
    applied: 38000,
    score: 710,
    risk: "Low Risk",
    feeGst: 1121,
    netDisbursal: 36879,
    status: "Disbursed",
  },
  {
    appNumber: "APP-2026-00111",
    borrower: "Kavita Chakraborty",
    scheme: "Gramin Micro Enterprise Loan",
    applied: 32000,
    score: 698,
    risk: "Fair",
    feeGst: 944,
    netDisbursal: 31056,
    status: "Under Appraisal",
  },
];

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);
}

export function LosApplicationsView() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter(
      (row) =>
        row.appNumber.toLowerCase().includes(q) ||
        row.borrower.toLowerCase().includes(q) ||
        row.scheme.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Loan Origination System (LOS) Underwriting Workbench
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
            Group & Individual loan pipeline, Credit Bureau validation,
            Sanctions, Key Fact Statements (KFS), and Disbursal triggers
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn inline-flex items-center gap-2 border border-transparent bg-emerald-600 px-3.5 py-2.5 text-white hover:bg-emerald-700"
          >
            <Wallet className="h-4 w-4" />
            Bulk NEFT Disbursal
          </button>
          <button
            type="button"
            className="btn inline-flex items-center gap-2 border border-transparent bg-violet-600 px-3.5 py-2.5 text-white hover:bg-violet-700"
          >
            <Grid2X2 className="h-4 w-4" />
            Guarantee Matrix
          </button>
          <button type="button" className="btn btn-primary">
            <Users className="h-4 w-4" />
            Apply JLG Group Loan
          </button>
          <button
            type="button"
            className="btn btn-secondary border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <UserPlus className="h-4 w-4" />
            Individual App
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Active Loan Origination Pipeline
            </h2>
            <p className="mt-1 text-sm text-muted">
              Underwriting status, upfront fee deductions, and one-click
              sanction committee actions
            </p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter records..."
              className="w-full rounded-xl border border-border bg-surface-muted py-2.5 pr-3 pl-9 text-sm outline-none focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10"
            />
          </div>
        </div>

        <div className="table-scroll">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-soft">
                <th className="pb-3 pr-3">App Number</th>
                <th className="pb-3 pr-3">Borrower</th>
                <th className="pb-3 pr-3">Product Scheme</th>
                <th className="pb-3 pr-3 text-right">Applied Amount</th>
                <th className="pb-3 pr-3 text-center">Bureau Score</th>
                <th className="pb-3 pr-3 text-right">Fee + GST</th>
                <th className="pb-3 pr-3 text-right">Net Disbursal</th>
                <th className="pb-3 pr-3">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.appNumber} className="border-t border-border/70">
                  <td className="py-3.5 pr-3 font-semibold text-slate-900">
                    {row.appNumber}
                  </td>
                  <td className="py-3.5 pr-3 font-medium text-slate-800">
                    {row.borrower}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-700">{row.scheme}</td>
                  <td className="py-3.5 pr-3 text-right font-semibold text-slate-900">
                    {formatInr(row.applied)}
                  </td>
                  <td className="py-3.5 pr-3">
                    <div className="mx-auto flex h-14 w-14 flex-col items-center justify-center rounded-full bg-emerald-50 text-center">
                      <span className="text-sm font-bold text-emerald-700">
                        {row.score}
                      </span>
                      <span className="text-[9px] font-semibold text-emerald-600">
                        {row.risk}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-3 text-right text-slate-700">
                    {formatInr(row.feeGst)}
                  </td>
                  <td className="py-3.5 pr-3 text-right font-semibold text-slate-900">
                    {formatInr(row.netDisbursal)}
                  </td>
                  <td className="py-3.5 pr-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        row.status === "Disbursed"
                          ? "bg-emerald-50 text-emerald-700"
                          : row.status === "Sanctioned"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-[11px] font-semibold text-amber-800 transition hover:bg-amber-100"
                      >
                        <Diamond className="h-3 w-3" />
                        Collateral & PDCs
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100"
                      >
                        <FileText className="h-3 w-3" />
                        Sanction Letter & KFS
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted">
          <p>
            Showing {filtered.length} of {applications.length} applications
          </p>
          <p>Fee + GST auto-calc · Bureau score · Net disbursal</p>
        </div>
      </section>
    </div>
  );
}
