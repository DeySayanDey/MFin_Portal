"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MisReportShell } from "@/features/mis/components/MisReportShell";
import { collectionRows, formatInr } from "@/features/mis/components/mis-data";

type CollectionRow = (typeof collectionRows)[number];

const columns: DataTableColumn<CollectionRow>[] = [
  {
    id: "receipt",
    header: "Receipt",
    className: "font-semibold text-slate-900",
    cell: (row) => row.receipt,
  },
  {
    id: "member",
    header: "Member",
    className: "font-medium text-slate-800",
    cell: (row) => row.member,
  },
  {
    id: "loan",
    header: "Loan A/c",
    className: "text-slate-600",
    cell: (row) => row.loan,
  },
  {
    id: "kendra",
    header: "Kendra",
    className: "text-slate-600",
    cell: (row) => row.kendra,
  },
  {
    id: "agent",
    header: "Agent",
    className: "text-slate-600",
    cell: (row) => row.agent,
  },
  {
    id: "amount",
    header: "Amount",
    align: "end",
    className: "font-semibold text-emerald-700",
    cell: (row) => formatInr(row.amount),
  },
  {
    id: "mode",
    header: "Mode",
    cell: (row) => (
      <Badge tone={row.mode === "UPI" ? "info" : "neutral"} caps={false}>
        {row.mode}
      </Badge>
    ),
  },
  {
    id: "time",
    header: "Time",
    className: "text-slate-600",
    cell: (row) => row.time,
  },
];

export function MisCollectionView() {
  const [query, setQuery] = useState("");
  const total = collectionRows.reduce((sum, row) => sum + row.amount, 0);
  const cash = collectionRows
    .filter((row) => row.mode === "Cash")
    .reduce((sum, row) => sum + row.amount, 0);
  const upi = total - cash;

  const q = query.trim().toLowerCase();
  const filtered = !q
    ? collectionRows
    : collectionRows.filter(
        (row) =>
          row.receipt.toLowerCase().includes(q) ||
          row.member.toLowerCase().includes(q) ||
          row.loan.toLowerCase().includes(q) ||
          row.agent.toLowerCase().includes(q),
      );

  return (
    <MisReportShell
      title="Daily Collection & Cash Register"
      subtitle="Every receipt generated in Kendra meetings or branch counter with GL Dr/Cr mapping."
      banglaHint="দৈনিক আদায় ও ক্যাশ রেজিস্টার"
      metrics={[
        {
          label: "Total Debit (Cash/Bank)",
          value: formatInr(total),
          hint: "Vault cash & UPI",
          tone: "green",
        },
        {
          label: "Cash Collections",
          value: formatInr(cash),
          hint: "Field + counter",
          tone: "amber",
        },
        {
          label: "UPI / Digital",
          value: formatInr(upi),
          hint: "Instant GL credit",
          tone: "blue",
        },
        {
          label: "Receipts Today",
          value: String(collectionRows.length),
          hint: "Posted vouchers",
          tone: "violet",
        },
      ]}
    >
      <div className="mb-4 relative max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
        <input autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter receipts..."
          className="w-full rounded-xl border border-border bg-surface-muted py-2.5 pr-3 pl-9 text-sm outline-none focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10"
        />
      </div>
      <DataTable
        title="Collection Register"
        description="Agent attribution, mode, and receipt timestamps"
        data={filtered}
        columns={columns}
        getRowKey={(row) => row.receipt}
        minWidth="980px"
      />
    </MisReportShell>
  );
}
