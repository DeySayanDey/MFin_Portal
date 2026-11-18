"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  ClipboardList,
  Download,
  FileSpreadsheet,
  PieChart,
  Shield,
} from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  formatInr,
  lmsLoans,
  metricToneClass,
} from "@/features/lms/components/lms-data";

const reportPacks = [
  {
    id: "demand",
    title: "Kendra Demand Sheet",
    body: "Meeting-wise EMI due list with member attendance blanks for field officers.",
    icon: ClipboardList,
    tone: "info" as const,
  },
  {
    id: "collection",
    title: "Collection Efficiency MIS",
    body: "Demand vs collection, cash vs UPI split, and vault hand-in reconciliation.",
    icon: BarChart3,
    tone: "success" as const,
  },
  {
    id: "par",
    title: "PAR / NPA Aging Pack",
    body: "Bucket-wise outstanding, account counts, and branch comparison charts.",
    icon: PieChart,
    tone: "amber" as const,
  },
  {
    id: "bureau",
    title: "Credit Bureau Export",
    body: "Monthly CIBIL / CRIF / Equifax compliant delinquency and settlement dump.",
    icon: Shield,
    tone: "violet" as const,
  },
];

export function LmsReportsView() {
  const [selected, setSelected] = useState(reportPacks[0]!.id);

  const totalOutstanding = lmsLoans.reduce(
    (sum, row) => sum + row.outstanding,
    0,
  );
  const totalCollected = lmsLoans.reduce((sum, row) => sum + row.collected, 0);
  const parCount = lmsLoans.filter((row) => row.dpd > 0).length;
  const activePack =
    reportPacks.find((pack) => pack.id === selected) ?? reportPacks[0]!;

  const branchRows = [
    {
      branch: "Karveer Rural Branch",
      accounts: 42,
      outstanding: totalOutstanding * 0.38,
      collection: totalCollected * 0.41,
      par: 1.24,
    },
    {
      branch: "Kolkata Shyambazar Hub",
      accounts: 58,
      outstanding: totalOutstanding * 0.34,
      collection: totalCollected * 0.33,
      par: 0.86,
    },
    {
      branch: "Sonarpur Branch",
      accounts: 31,
      outstanding: totalOutstanding * 0.28,
      collection: totalCollected * 0.26,
      par: 2.15,
    },
  ];

  const branchColumns = useMemo<
    DataTableColumn<(typeof branchRows)[number]>[]
  >(
    () => [
      {
        id: "branch",
        header: "Branch",
        className: "font-medium text-slate-800",
        cell: (row) => row.branch,
      },
      {
        id: "accounts",
        header: "A/cs",
        align: "end",
        className: "text-slate-600",
        cell: (row) => row.accounts,
      },
      {
        id: "outstanding",
        header: "Outstanding",
        align: "end",
        className: "font-semibold text-slate-900",
        cell: (row) => formatInr(row.outstanding, 0),
      },
      {
        id: "collection",
        header: "Collection",
        align: "end",
        className: "font-semibold text-emerald-700",
        cell: (row) => formatInr(row.collection, 0),
      },
      {
        id: "par",
        header: "PAR %",
        align: "end",
        className: "font-semibold text-amber-700",
        cell: (row) => `${row.par.toFixed(2)}%`,
      },
    ],
    [],
  );

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" icon={FileSpreadsheet}>
          Schedule Email Pack
        </Button>
        <Button icon={Download}>Download Selected</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Portfolio GLP",
            value: formatInr(totalOutstanding, 0),
            hint: "All active loans",
            tone: "blue" as const,
          },
          {
            label: "MTD Collections",
            value: formatInr(totalCollected, 0),
            hint: "Cash + UPI credited",
            tone: "green" as const,
          },
          {
            label: "Accounts in PAR",
            value: String(parCount),
            hint: "DPD > 0",
            tone: "amber" as const,
          },
          {
            label: "Report Packs",
            value: String(reportPacks.length),
            hint: "Ready to export",
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

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
          <h2 className="text-base font-semibold text-slate-900">
            Available Report Packs
          </h2>
          <p className="mt-1 text-sm text-muted">
            Select a pack to preview branch summary and export options
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {reportPacks.map((pack) => (
              <button
                key={pack.id}
                type="button"
                onClick={() => setSelected(pack.id)}
                className={`rounded-xl border px-4 py-3.5 text-left transition ${
                  selected === pack.id
                    ? "border-blue-300 bg-blue-50 ring-4 ring-blue-500/10"
                    : "border-border hover:border-slate-300 hover:bg-surface-muted"
                }`}
              >
                <pack.icon className="h-4 w-4 text-slate-500" />
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {pack.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">{pack.body}</p>
              </button>
            ))}
          </div>
        </section>

        <div className="flex min-w-0 flex-col gap-3">
          <DataTable
            data={branchRows}
            columns={branchColumns}
            getRowKey={(row) => row.branch}
            title={
              <span className="flex w-full flex-wrap items-center justify-between gap-3">
                <span>{activePack.title}</span>
                <Badge tone={activePack.tone} caps={false}>
                  Selected
                </Badge>
              </span>
            }
            description={activePack.body}
          />
          <div className="flex flex-wrap gap-2">
            <Button icon={Download}>Download CSV</Button>
            <Button variant="secondary" icon={FileSpreadsheet}>
              Download Excel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
