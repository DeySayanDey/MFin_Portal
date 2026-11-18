"use client";

import { useState } from "react";
import { CalendarClock, Plus, Search, UserPlus } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
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

  const columns: DataTableColumn<DepositAccount>[] = [
      {
        id: "account",
        header: "Account No.",
        className: "font-semibold text-slate-900",
        cell: (row) => row.account,
      },
      {
        id: "member",
        header: "Member",
        className: "font-medium text-slate-800",
        cell: (row) => row.member,
      },
      {
        id: "group",
        header: "Group",
        className: "text-slate-600",
        cell: (row) => row.group,
      },
      {
        id: "installment",
        header: "Installment",
        align: "end",
        className: "font-semibold text-slate-900",
        cell: (row) => formatInr(row.installment ?? 0),
      },
      {
        id: "tenure",
        header: "Tenure",
        className: "text-slate-700",
        cell: (row) => `${row.tenureMonths} months`,
      },
      {
        id: "maturity",
        header: "Maturity",
        className: "text-slate-700",
        cell: (row) => row.maturityDate,
      },
      {
        id: "rate",
        header: "Rate",
        className: "text-slate-700",
        cell: (row) => `${row.rate}% p.a.`,
      },
      {
        id: "balance",
        header: "Balance",
        align: "end",
        className: "font-semibold text-emerald-700",
        cell: (row) => formatInr(row.balance),
      },
      {
        id: "actions",
        header: "Actions",
        cell: (row) => (
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
        ),
      },
  ];

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
        getRowKey={(row) => row.account}
        minWidth="1080px"
        title={
          <span className="inline-flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-slate-500" />
            RD Account Register
          </span>
        }
        description="Installment, tenure, maturity date, and accrued balance"
      />

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
