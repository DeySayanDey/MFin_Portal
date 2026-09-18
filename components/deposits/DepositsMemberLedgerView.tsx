"use client";

import { useMemo, useState } from "react";
import { BookMarked, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  depositAccounts,
  formatInr,
  ledgerTxns,
  metricToneClass,
} from "@/components/deposits/deposits-data";

export function DepositsMemberLedgerView() {
  const [accountId, setAccountId] = useState(depositAccounts[0]!.account);
  const [query, setQuery] = useState("");

  const account =
    depositAccounts.find((row) => row.account === accountId) ??
    depositAccounts[0]!;

  const filteredAccounts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return depositAccounts;
    return depositAccounts.filter(
      (row) =>
        row.account.toLowerCase().includes(q) ||
        row.member.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          Member Deposit Ledger Passbook
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
          Complete chronological credit, debit, and interest postings for
          savings, RD, and FD accounts
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Selected Account",
            value: account.account,
            hint: account.member,
            tone: "blue" as const,
          },
          {
            label: "Current Balance",
            value: formatInr(account.balance),
            hint: account.productLabel,
            tone: "green" as const,
          },
          {
            label: "Interest Rate",
            value: `${account.rate}% p.a.`,
            hint: "Accrual basis",
            tone: "violet" as const,
          },
          {
            label: "JLG Group",
            value: account.group.split(" ").slice(0, 2).join(" "),
            hint: account.memberId,
            tone: "slate" as const,
          },
        ].map((metric) => (
          <div
            key={metric.label}
            className={`rounded-2xl border px-4 py-3.5 ${metricToneClass[metric.tone]}`}
          >
            <p className="text-xs font-semibold tracking-wide uppercase opacity-80">
              {metric.label}
            </p>
            <p className="mt-1.5 truncate text-lg font-bold tracking-tight sm:text-xl">
              {metric.value}
            </p>
            <p className="mt-1 truncate text-xs opacity-75">{metric.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold text-slate-900">Select Account</h2>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search account / member..."
              className="w-full rounded-xl border border-border bg-surface-muted py-2.5 pr-3 pl-9 text-sm outline-none focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10"
            />
          </div>
          <ul className="mt-3 max-h-[460px] space-y-1.5 overflow-y-auto scrollbar-thin">
            {filteredAccounts.map((row) => (
              <li key={row.account}>
                <button
                  type="button"
                  onClick={() => setAccountId(row.account)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                    row.account === accountId
                      ? "border-blue-200 bg-blue-50"
                      : "border-transparent hover:border-border hover:bg-surface-muted"
                  }`}
                >
                  <span className="block text-sm font-semibold text-slate-900">
                    {row.account}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {row.member}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
          <div className="border-b border-border px-4 py-4 sm:px-5">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
              <BookMarked className="h-4 w-4 text-slate-500" />
              Account No: {account.account} · {account.member}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {account.group} · ID: {account.memberId}
            </p>
          </div>

          <div className="table-scroll">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-soft">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Narrative</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3 text-right">Credit</th>
                  <th className="px-4 py-3 text-right">Debit</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledgerTxns.map((row) => (
                  <tr key={row.ref} className="border-t border-border/70">
                    <td className="px-4 py-3 text-slate-700">{row.date}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {row.ref}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.narrative}</td>
                    <td className="px-4 py-3">
                      <Badge tone="neutral" caps={false}>
                        {row.mode}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                      {row.credit ? formatInr(row.credit) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-rose-600">
                      {row.debit ? formatInr(row.debit) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatInr(row.balance)}
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
