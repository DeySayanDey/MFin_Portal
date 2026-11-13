"use client";

import { useMemo, useState } from "react";
import { Landmark, Search, UserPlus } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { OpenDepositAccountModal } from "@/features/deposits/components/DepositModals";
import {
  accountsByProduct,
  formatInr,
  metricToneClass,
  type DepositAccount,
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
        id: "principal",
        header: "Principal",
        align: "end",
        className: "font-semibold text-emerald-700",
        cell: (row) => formatInr(row.balance),
      },
      {
        id: "rate",
        header: "Rate",
        className: "text-slate-700",
        cell: (row) => `${row.rate}% p.a.`,
      },
      {
        id: "opened",
        header: "Opened",
        className: "text-slate-700",
        cell: (row) => row.openedOn,
      },
      {
        id: "maturity",
        header: "Maturity",
        className: "text-slate-700",
        cell: (row) => row.maturityDate,
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => (
          <Badge
            tone={row.status === "Matured" ? "warning" : "success"}
            caps={false}
          >
            {row.status}
          </Badge>
        ),
      },
  ];

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
        minWidth="980px"
        title={
          <span className="inline-flex items-center gap-2">
            <Landmark className="h-4 w-4 text-slate-500" />
            Term Deposit Register
          </span>
        }
        description="Principal, rate, tenure, and maturity status"
      />

      <OpenDepositAccountModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        product="FD"
      />
    </div>
  );
}
