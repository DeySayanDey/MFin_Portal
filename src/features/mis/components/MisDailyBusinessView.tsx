"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MisReportShell, MisTableCard } from "@/features/mis/components/MisReportShell";
import {
  branchGlRows,
  formatInr,
  glHierarchy,
} from "@/features/mis/components/mis-data";

type BranchGlRow = (typeof branchGlRows)[number];

const columns: DataTableColumn<BranchGlRow>[] = [
  {
    id: "jlg",
    header: "JLG Code",
    className: "font-semibold text-slate-900",
    cell: (row) => row.jlg,
  },
  {
    id: "branch",
    header: "Branch",
    cell: (row) => row.branch,
  },
  {
    id: "gl",
    header: "GL Head",
    className: "text-slate-600",
    cell: (row) => row.gl,
  },
  {
    id: "members",
    header: "Members",
    align: "end",
    cell: (row) => row.members,
  },
  {
    id: "debit",
    header: "Debit (Dr)",
    align: "end",
    className: "font-semibold text-slate-900",
    cell: (row) => formatInr(row.debit),
  },
  {
    id: "credit",
    header: "Credit (Cr)",
    align: "end",
    className: "text-slate-600",
    cell: (row) => formatInr(row.credit),
  },
  {
    id: "collection",
    header: "Collection",
    align: "end",
    className: "font-semibold text-emerald-700",
    cell: (row) => formatInr(row.collection),
  },
  {
    id: "efficiency",
    header: "Eff %",
    align: "end",
    cell: (row) => (
      <Badge tone="success" caps={false}>
        {row.efficiency.toFixed(2)}%
      </Badge>
    ),
  },
];

export function MisDailyBusinessView() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return branchGlRows;
    return branchGlRows.filter(
      (row) =>
        row.jlg.toLowerCase().includes(q) ||
        row.branch.toLowerCase().includes(q) ||
        row.gl.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <MisReportShell
      title="Daily Business & MIS Report"
      subtitle="Consolidated executive snapshot of daily demand, collection, AUM, PAR and vault cash with GL breakdown."
      banglaHint="দৈনিক ব্যবসায়িক ও এমআইএস রিপোর্ট"
      metrics={[
        {
          label: "Gross Loan Portfolio (Dr)",
          value: formatInr(33814.66),
          hint: "Standard Portfolio Debit",
          tone: "green",
        },
        {
          label: "Today's Demand",
          value: formatInr(3730),
          hint: "Principal + Interest",
          tone: "blue",
        },
        {
          label: "Total Collection (Vault)",
          value: formatInr(3700),
          hint: "99.16% Efficiency",
          tone: "violet",
        },
        {
          label: "PAR 30+ Overdue",
          value: formatInr(40530, 0),
          hint: "Provisioned",
          tone: "amber",
        },
      ]}
    >
      <MisTableCard
        title="GL Hierarchy Snapshot"
        subtitle="N-Level Chart of Accounts · Debit & Credit double-entry reconciliation"
      >
        <div className="space-y-2">
          {glHierarchy.map((row) => (
            <div
              key={row.path}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm text-slate-700">{row.path}</p>
              <div className="flex gap-4 text-sm">
                <span className="font-semibold text-slate-900">
                  Dr {formatInr(row.debit)}
                </span>
                <span className="font-semibold text-emerald-700">
                  Cr {formatInr(row.credit)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </MisTableCard>

      <div className="mb-4 relative max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
        <input autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search report, GL code or head..."
          className="w-full rounded-xl border border-border bg-surface-muted py-2.5 pr-3 pl-9 text-sm outline-none focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10"
        />
      </div>
      <DataTable
        title="JLG Code × Branch GL Breakdown"
        description="Search report, GL code or head"
        data={filtered}
        columns={columns}
        getRowKey={(row) => row.jlg}
        minWidth="980px"
      />
    </MisReportShell>
  );
}
