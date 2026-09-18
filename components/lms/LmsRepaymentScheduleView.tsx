"use client";

import { useMemo, useState } from "react";
import {
  CalendarRange,
  Download,
  Printer,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  buildSchedule,
  formatInr,
  lmsLoans,
  metricToneClass,
} from "@/components/lms/lms-data";

export function LmsRepaymentScheduleView() {
  const [loanId, setLoanId] = useState(lmsLoans[0]!.loanId);
  const [query, setQuery] = useState("");

  const loan = lmsLoans.find((row) => row.loanId === loanId) ?? lmsLoans[0]!;
  const schedule = useMemo(() => buildSchedule(loan), [loan]);

  const filteredLoans = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lmsLoans;
    return lmsLoans.filter(
      (row) =>
        row.loanId.toLowerCase().includes(q) ||
        row.borrower.toLowerCase().includes(q),
    );
  }, [query]);

  const paid = schedule.filter((row) => row.status === "Paid").length;
  const upcoming = schedule.filter((row) => row.status === "Upcoming").length;

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Repayment Schedule (EMI Calendar)
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
            Reducing-balance EMI amortization with principal, interest, and
            outstanding trajectory per installment
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={Download}>
            Export Schedule
          </Button>
          <Button icon={Printer}>Print Schedule</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Loan Account",
            value: loan.loanId,
            hint: loan.borrower,
            tone: "blue" as const,
          },
          {
            label: "Sanctioned Principal",
            value: formatInr(loan.principal),
            hint: `${loan.rate}% p.a. reducing`,
            tone: "slate" as const,
          },
          {
            label: "Installments Paid",
            value: `${paid} / ${loan.tenure}`,
            hint: `${upcoming} upcoming`,
            tone: "green" as const,
          },
          {
            label: "Scheduled EMI",
            value: formatInr(loan.emi),
            hint: `Next due ${loan.nextDue}`,
            tone: "violet" as const,
          },
        ].map((metric) => (
          <div
            key={metric.label}
            className={`rounded-2xl border px-4 py-3.5 ${metricToneClass[metric.tone]}`}
          >
            <p className="text-xs font-semibold tracking-wide uppercase opacity-80">
              {metric.label}
            </p>
            <p className="mt-1.5 text-lg font-bold tracking-tight sm:text-xl">
              {metric.value}
            </p>
            <p className="mt-1 text-xs opacity-75">{metric.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold text-slate-900">Select Loan</h2>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search loan / borrower..."
              className="w-full rounded-xl border border-border bg-surface-muted py-2.5 pr-3 pl-9 text-sm outline-none focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10"
            />
          </div>
          <ul className="mt-3 max-h-[420px] space-y-1.5 overflow-y-auto scrollbar-thin">
            {filteredLoans.map((row) => (
              <li key={row.loanId}>
                <button
                  type="button"
                  onClick={() => setLoanId(row.loanId)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                    row.loanId === loanId
                      ? "border-blue-200 bg-blue-50"
                      : "border-transparent hover:border-border hover:bg-surface-muted"
                  }`}
                >
                  <span className="block text-sm font-semibold text-slate-900">
                    {row.loanId}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {row.borrower}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
          <div className="border-b border-border px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
                  <CalendarRange className="h-4 w-4 text-slate-500" />
                  Account No: {loan.loanId}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {loan.borrower} · {loan.group} · {loan.product}
                </p>
              </div>
              <Badge
                tone={
                  loan.status === "Current"
                    ? "success"
                    : loan.status === "NPA"
                      ? "danger"
                      : "warning"
                }
                caps={false}
              >
                {loan.status}
              </Badge>
            </div>
          </div>

          <div className="table-scroll">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-soft">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-right">Principal</th>
                  <th className="px-4 py-3 text-right">Interest</th>
                  <th className="px-4 py-3 text-right">EMI Total</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row) => (
                  <tr key={row.installment} className="border-t border-border/70">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      #{row.installment}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.dueDate}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">
                      {formatInr(row.principal)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {formatInr(row.interest)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatInr(row.total)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {formatInr(row.balance)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          row.status === "Paid"
                            ? "success"
                            : row.status === "Due"
                              ? "warning"
                              : "neutral"
                        }
                        caps={false}
                      >
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
