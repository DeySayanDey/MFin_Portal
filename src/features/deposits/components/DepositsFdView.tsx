"use client";

import { useMemo, useState } from "react";
import { Landmark, Search, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { OpenDepositAccountModal } from "@/features/deposits/components/DepositModals";
import {
  accountsByProduct,
  formatInr,
  metricToneClass,
} from "@/features/deposits/components/deposits-data";

export function DepositsFdView() {
  const accounts = accountsByProduct("FD");
  const [query, setQuery] = useState("");
  const [openModal, setOpenModal] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (row) =>
        row.account.toLowerCase().includes(q) ||
        row.member.toLowerCase().includes(q) ||
        row.group.toLowerCase().includes(q),
    );
  }, [accounts, query]);

  const totalBalance = accounts.reduce((sum, row) => sum + row.balance, 0);
  const matured = accounts.filter((row) => row.status === "Matured").length;

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="flex justify-end">
        <Button icon={UserPlus} onClick={() => setOpenModal(true)}>
          Open FD Account
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "FD Accounts",
            value: String(accounts.length),
            hint: "Active + matured",
            tone: "amber" as const,
          },
          {
            label: "FD Book Value",
            value: formatInr(totalBalance, 0),
            hint: "Principal outstanding",
            tone: "green" as const,
          },
          {
            label: "Matured Pending Payout",
            value: String(matured),
            hint: "Ready for settlement",
            tone: "rose" as const,
          },
          {
            label: "Peak Rate",
            value: "8.5% p.a.",
            hint: "24-month tenure",
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
              <Landmark className="h-4 w-4 text-slate-500" />
              Term Deposit Register
            </h2>
            <p className="mt-1 text-sm text-muted">
              Principal, rate, tenure, and maturity status
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
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-soft">
                <th className="pb-3 pr-3">Account No.</th>
                <th className="pb-3 pr-3">Member</th>
                <th className="pb-3 pr-3">Group</th>
                <th className="pb-3 pr-3 text-right">Principal</th>
                <th className="pb-3 pr-3">Rate</th>
                <th className="pb-3 pr-3">Opened</th>
                <th className="pb-3 pr-3">Maturity</th>
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
                  <td className="py-3.5 pr-3 text-slate-600">{row.group}</td>
                  <td className="py-3.5 pr-3 text-right font-semibold text-emerald-700">
                    {formatInr(row.balance)}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-700">{row.rate}% p.a.</td>
                  <td className="py-3.5 pr-3 text-slate-700">{row.openedOn}</td>
                  <td className="py-3.5 pr-3 text-slate-700">
                    {row.maturityDate}
                  </td>
                  <td className="py-3.5">
                    <Badge
                      tone={row.status === "Matured" ? "warning" : "success"}
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

      <OpenDepositAccountModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        product="FD"
      />
    </div>
  );
}
