"use client";

import { useCallback, useMemo, useState } from "react";
import { Check, Search, Wallet, X } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DepositTxnModal } from "@/features/deposits/components/DepositModals";
import {
  depositAccounts,
  formatInr,
  metricToneClass,
  withdrawalRequests,
  type WithdrawalRequest,
} from "@/features/deposits/components/deposits-data";

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

  const updateStatus = useCallback(
    (id: string, status: WithdrawalRequest["status"]) => {
      setRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, status } : row)),
      );
    },
    [],
  );

  const columns = useMemo<DataTableColumn<WithdrawalRequest>[]>(
    () => [
      {
        id: "id",
        header: "Request ID",
        className: "font-semibold text-slate-900",
        cell: (row) => row.id,
      },
      {
        id: "member",
        header: "Member",
        className: "font-medium text-slate-800",
        cell: (row) => row.member,
      },
      {
        id: "account",
        header: "Account",
        className: "text-slate-600",
        cell: (row) => row.account,
      },
      {
        id: "amount",
        header: "Amount",
        align: "end",
        className: "font-semibold text-rose-600",
        cell: (row) => formatInr(row.amount),
      },
      {
        id: "reason",
        header: "Reason",
        className: "text-slate-600",
        cell: (row) => row.reason,
      },
      {
        id: "mode",
        header: "Mode",
        className: "text-slate-600",
        cell: (row) => row.mode,
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => (
          <Badge tone={statusTone[row.status]} caps={false}>
            {row.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: (row) =>
          row.status === "Pending" ? (
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
          ),
      },
    ],
    [updateStatus],
  );

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="flex justify-end">
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
        getRowKey={(row) => row.id}
        minWidth="1040px"
        title="Withdrawal Request Queue"
        description="Approve, reject, or disburse after note verification"
      />

      <DepositTxnModal
        open={cashOpen}
        onClose={() => setCashOpen(false)}
        account={depositAccounts[0] ?? null}
        kind="withdrawal"
      />
    </div>
  );
}
