"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  CalendarRange,
  FileSpreadsheet,
  Percent,
  Search,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  formatInr,
  lmsLoans,
  metricToneClass,
} from "@/components/lms/lms-data";

export function LmsLoanBookView() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lmsLoans.filter((row) => {
      const matchesQuery =
        !q ||
        row.loanId.toLowerCase().includes(q) ||
        row.borrower.toLowerCase().includes(q) ||
        row.group.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "All" || row.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter]);

  const totalOutstanding = lmsLoans.reduce(
    (sum, row) => sum + row.outstanding,
    0,
  );
  const totalCollected = lmsLoans.reduce((sum, row) => sum + row.collected, 0);
  const avgRate =
    lmsLoans.reduce((sum, row) => sum + row.rate, 0) / lmsLoans.length;

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Active Loan Book
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
            Portfolio balances, total collections, interest rates, days past
            due, and early settlement controls
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={FileSpreadsheet}>
            Export Loan Book
          </Button>
          <Button icon={Wallet}>Early Settlement Quote</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Active Accounts",
            value: String(lmsLoans.length),
            hint: "Live portfolio",
            tone: "blue" as const,
          },
          {
            label: "Gross Outstanding",
            value: formatInr(totalOutstanding, 0),
            hint: "Principal + accrued",
            tone: "violet" as const,
          },
          {
            label: "Total Collected",
            value: formatInr(totalCollected, 0),
            hint: "MTD + YTD receipts",
            tone: "green" as const,
          },
          {
            label: "Avg Interest Rate",
            value: `${avgRate.toFixed(1)}% p.a.`,
            hint: "Reducing balance EMI",
            tone: "amber" as const,
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

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
              <BookOpen className="h-4 w-4 text-slate-500" />
              Portfolio Loan Register
            </h2>
            <p className="mt-1 text-sm text-muted">
              Outstanding GLP with DPD and product rate snapshot
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              {["All", "Current", "PAR", "NPA"].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
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
        </div>

        <div className="table-scroll">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-soft">
                <th className="pb-3 pr-3">Loan A/c</th>
                <th className="pb-3 pr-3">Borrower</th>
                <th className="pb-3 pr-3 text-right">Principal</th>
                <th className="pb-3 pr-3 text-right">Outstanding</th>
                <th className="pb-3 pr-3 text-right">Collected</th>
                <th className="pb-3 pr-3">Rate</th>
                <th className="pb-3 pr-3 text-center">DPD</th>
                <th className="pb-3 pr-3">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.loanId} className="border-t border-border/70">
                  <td className="py-3.5 pr-3 font-semibold text-slate-900">
                    {row.loanId}
                  </td>
                  <td className="py-3.5 pr-3">
                    <p className="font-medium text-slate-800">{row.borrower}</p>
                    <p className="text-xs text-muted">{row.group}</p>
                  </td>
                  <td className="py-3.5 pr-3 text-right font-medium text-slate-800">
                    {formatInr(row.principal)}
                  </td>
                  <td className="py-3.5 pr-3 text-right font-semibold text-slate-900">
                    {formatInr(row.outstanding)}
                  </td>
                  <td className="py-3.5 pr-3 text-right font-semibold text-emerald-700">
                    {formatInr(row.collected)}
                  </td>
                  <td className="py-3.5 pr-3">
                    <span className="inline-flex items-center gap-1 text-slate-700">
                      <Percent className="h-3 w-3 text-slate-400" />
                      {row.rate}% p.a.
                    </span>
                  </td>
                  <td className="py-3.5 pr-3 text-center">
                    <span
                      className={`font-semibold ${
                        row.dpd === 0
                          ? "text-emerald-600"
                          : row.dpd >= 90
                            ? "text-rose-600"
                            : "text-amber-700"
                      }`}
                    >
                      {row.dpd}
                    </span>
                  </td>
                  <td className="py-3.5 pr-3">
                    <Badge
                      tone={
                        row.status === "Current"
                          ? "success"
                          : row.status === "NPA"
                            ? "danger"
                            : "warning"
                      }
                      caps={false}
                    >
                      {row.status}
                    </Badge>
                  </td>
                  <td className="py-3.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={CalendarRange}
                        onClick={() => router.push("/lms/repayment-schedule")}
                      >
                        Schedule
                      </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted">
          <p>
            Showing {filtered.length} of {lmsLoans.length} loan accounts
          </p>
          <p>Portfolio balances · Collections · DPD · Early settlements</p>
        </div>
      </section>
    </div>
  );
}
