"use client";

import { useMemo, useState } from "react";
import { Check, Search, Wallet, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DepositTxnModal } from "@/components/deposits/DepositModals";
import {
  depositAccounts,
  formatInr,
  metricToneClass,
  withdrawalRequests,
  type WithdrawalRequest,
} from "@/components/deposits/deposits-data";

const statusTone = {
  Pending: "warning" as const,
  Approved: "info" as const,
  Rejected: "danger" as const,
  Disbursed: "success" as const,
};

export function DepositsWithdrawalsView() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState(withdrawalRequests);
  const [cashOpen, setCashOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.id.toLowerCase().includes(q) ||
        row.member.toLowerCase().includes(q) ||
        row.account.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q),
    );
  }, [query, rows]);

  const pending = rows.filter((row) => row.status === "Pending");
  const pendingAmount = pending.reduce((sum, row) => sum + row.amount, 0);

  function updateStatus(id: string, status: WithdrawalRequest["status"]) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, status } : row)),
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Withdrawal Requests
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
            Group-approved emergency withdrawals, premature RD/FD payouts, and
            cash outward posting to vault
          </p>
        </div>
        <Button
          variant="warning"
          icon={Wallet}
          onClick={() => setCashOpen(true)}
        >
          New Cash Withdrawal
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Pending Requests",
            value: String(pending.length),
            hint: "Awaiting checker",
            tone: "amber" as const,
          },
          {
            label: "Pending Amount",
            value: formatInr(pendingAmount, 0),
            hint: "Cash / NEFT queue",
            tone: "rose" as const,
          },
          {
            label: "Disbursed MTD",
            value: String(rows.filter((row) => row.status === "Disbursed").length),
            hint: "Completed payouts",
            tone: "green" as const,
          },
          {
            label: "Approval Rule",
            value: "Maker-Checker",
            hint: "BM dual auth",
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
            <h2 className="text-base font-semibold text-slate-900">
              Withdrawal Request Queue
            </h2>
            <p className="mt-1 text-sm text-muted">
              Approve, reject, or disburse after note verification
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
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-soft">
                <th className="pb-3 pr-3">Request ID</th>
                <th className="pb-3 pr-3">Member</th>
                <th className="pb-3 pr-3">Account</th>
                <th className="pb-3 pr-3 text-right">Amount</th>
                <th className="pb-3 pr-3">Reason</th>
                <th className="pb-3 pr-3">Mode</th>
                <th className="pb-3 pr-3">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-t border-border/70">
                  <td className="py-3.5 pr-3 font-semibold text-slate-900">
                    {row.id}
                  </td>
                  <td className="py-3.5 pr-3 font-medium text-slate-800">
                    {row.member}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-600">{row.account}</td>
                  <td className="py-3.5 pr-3 text-right font-semibold text-rose-600">
                    {formatInr(row.amount)}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-600">{row.reason}</td>
                  <td className="py-3.5 pr-3 text-slate-600">{row.mode}</td>
                  <td className="py-3.5 pr-3">
                    <Badge tone={statusTone[row.status]} caps={false}>
                      {row.status}
                    </Badge>
                  </td>
                  <td className="py-3.5">
                    {row.status === "Pending" ? (
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          size="sm"
                          variant="success"
                          icon={Check}
                          onClick={() => updateStatus(row.id, "Approved")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={X}
                          className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                          onClick={() => updateStatus(row.id, "Rejected")}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : row.status === "Approved" ? (
                      <Button
                        size="sm"
                        variant="warning"
                        icon={Wallet}
                        onClick={() => updateStatus(row.id, "Disbursed")}
                      >
                        Disburse
                      </Button>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <DepositTxnModal
        open={cashOpen}
        onClose={() => setCashOpen(false)}
        account={depositAccounts[0] ?? null}
        kind="withdrawal"
      />
    </div>
  );
}
