"use client";

import { useMemo, useState } from "react";
import { Banknote, Calculator, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { InterestPostingModal } from "@/components/deposits/DepositModals";
import {
  depositAccounts,
  formatInr,
  metricToneClass,
} from "@/components/deposits/deposits-data";

export function DepositsInterestView() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const rows = useMemo(
    () =>
      depositAccounts
        .filter((row) => row.status === "Active")
        .map((row) => ({
          ...row,
          monthlyInterest:
            Math.round(((row.balance * row.rate) / 100 / 12) * 100) / 100,
        })),
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.account.toLowerCase().includes(q) ||
        row.member.toLowerCase().includes(q),
    );
  }, [query, rows]);

  const totalInterest = rows.reduce((sum, row) => sum + row.monthlyInterest, 0);

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Interest Accrual & Posting
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
            Monthly interest calculation for savings, RD, and FD accounts with
            GL credit to member ledgers
          </p>
        </div>
        <Button variant="success" icon={Banknote} onClick={() => setOpen(true)}>
          Run Month-End Posting
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Accounts in Batch",
            value: String(rows.length),
            hint: "Active deposits only",
            tone: "blue" as const,
          },
          {
            label: "Total Accrual",
            value: formatInr(totalInterest),
            hint: "Sep 2026 period",
            tone: "green" as const,
          },
          {
            label: "GL Credit Head",
            value: "421000",
            hint: "Interest Payable",
            tone: "violet" as const,
          },
          {
            label: "Posting Status",
            value: "Ready",
            hint: "Maker-checker enabled",
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
              <Calculator className="h-4 w-4 text-slate-500" />
              Interest Calculation Preview
            </h2>
            <p className="mt-1 text-sm text-muted">
              Balance × Rate / 12 — preview before committing month-end batch
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
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-soft">
                <th className="pb-3 pr-3">Account No.</th>
                <th className="pb-3 pr-3">Member</th>
                <th className="pb-3 pr-3">Product</th>
                <th className="pb-3 pr-3 text-right">Balance</th>
                <th className="pb-3 pr-3">Rate</th>
                <th className="pb-3 pr-3 text-right">Monthly Interest</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.account} className="border-t border-border/70">
                  <td className="py-3.5 pr-3 font-semibold text-slate-900">
                    {row.account}
                  </td>
                  <td className="py-3.5 pr-3 font-medium text-slate-800">
                    {row.member}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-600">
                    {row.productLabel}
                  </td>
                  <td className="py-3.5 pr-3 text-right font-semibold text-slate-900">
                    {formatInr(row.balance)}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-700">{row.rate}% p.a.</td>
                  <td className="py-3.5 pr-3 text-right font-semibold text-emerald-700">
                    {formatInr(row.monthlyInterest)}
                  </td>
                  <td className="py-3.5">
                    <Badge tone="info" caps={false}>
                      Accrued
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <InterestPostingModal
        open={open}
        onClose={() => setOpen(false)}
        accountCount={rows.length}
        totalInterest={totalInterest}
      />
    </div>
  );
}
