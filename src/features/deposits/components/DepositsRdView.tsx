"use client";

import { useState } from "react";
import { CalendarClock, Plus, Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DepositTxnModal,
  OpenDepositAccountModal,
} from "@/features/deposits/components/DepositModals";
import {
  accountsByProduct,
  formatInr,
  metricToneClass,
  type DepositAccount,
} from "@/features/deposits/components/deposits-data";

export function DepositsRdView() {
  const accounts = accountsByProduct("RD");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<DepositAccount | null>(null);
  const [modal, setModal] = useState<"deposit" | "open" | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = !q
    ? accounts
    : accounts.filter(
        (row) =>
          row.account.toLowerCase().includes(q) ||
          row.member.toLowerCase().includes(q) ||
          row.group.toLowerCase().includes(q),
      );

  const totalBalance = accounts.reduce((sum, row) => sum + row.balance, 0);
  const monthlyDemand = accounts.reduce(
    (sum, row) => sum + (row.installment ?? 0),
    0,
  );

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="flex justify-end">
        <Button icon={UserPlus} onClick={() => setModal("open")}>
          Open RD Account
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Active RD Accounts",
            value: String(accounts.length),
            hint: "Running tenures",
            tone: "violet" as const,
          },
          {
            label: "RD Corpus",
            value: formatInr(totalBalance, 0),
            hint: "Accumulated balance",
            tone: "green" as const,
          },
          {
            label: "Monthly Demand",
            value: formatInr(monthlyDemand, 0),
            hint: "Installments due",
            tone: "blue" as const,
          },
          {
            label: "Typical Rate",
            value: "7.5% p.a.",
            hint: "Reducing accrual",
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
              <CalendarClock className="h-4 w-4 text-slate-500" />
              RD Account Register
            </h2>
            <p className="mt-1 text-sm text-muted">
              Installment, tenure, maturity date, and accrued balance
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
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-soft">
                <th className="pb-3 pr-3">Account No.</th>
                <th className="pb-3 pr-3">Member</th>
                <th className="pb-3 pr-3">Group</th>
                <th className="pb-3 pr-3 text-right">Installment</th>
                <th className="pb-3 pr-3">Tenure</th>
                <th className="pb-3 pr-3">Maturity</th>
                <th className="pb-3 pr-3">Rate</th>
                <th className="pb-3 pr-3 text-right">Balance</th>
                <th className="pb-3">Actions</th>
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
                  <td className="py-3.5 pr-3 text-slate-600">{row.group}</td>
                  <td className="py-3.5 pr-3 text-right font-semibold text-slate-900">
                    {formatInr(row.installment ?? 0)}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-700">
                    {row.tenureMonths} months
                  </td>
                  <td className="py-3.5 pr-3 text-slate-700">
                    {row.maturityDate}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-700">{row.rate}% p.a.</td>
                  <td className="py-3.5 pr-3 text-right font-semibold text-emerald-700">
                    {formatInr(row.balance)}
                  </td>
                  <td className="py-3.5">
                    <Button
                      size="sm"
                      variant="success"
                      icon={Plus}
                      onClick={() => {
                        setSelected(row);
                        setModal("deposit");
                      }}
                    >
                      Collect EMI
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <DepositTxnModal
        open={modal === "deposit"}
        onClose={() => setModal(null)}
        account={selected}
        kind="deposit"
      />
      <OpenDepositAccountModal
        open={modal === "open"}
        onClose={() => setModal(null)}
        product="RD"
      />
    </div>
  );
}
