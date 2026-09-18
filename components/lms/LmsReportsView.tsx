"use client";

import { useState } from "react";
import {
  BarChart3,
  ClipboardList,
  Download,
  FileSpreadsheet,
  PieChart,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  formatInr,
  lmsLoans,
  metricToneClass,
} from "@/components/lms/lms-data";

const reportPacks = [
  {
    id: "demand",
    title: "Kendra Demand Sheet",
    body: "Meeting-wise EMI due list with member attendance blanks for field officers.",
    icon: ClipboardList,
    tone: "blue" as const,
  },
  {
    id: "collection",
    title: "Collection Efficiency MIS",
    body: "Demand vs collection, cash vs UPI split, and vault hand-in reconciliation.",
    icon: BarChart3,
    tone: "green" as const,
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

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Portfolio Reports Studio
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
            Demand, collection efficiency, PAR aging, and credit bureau export
            packs for lending operations
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={FileSpreadsheet}>
            Schedule Email Pack
          </Button>
          <Button icon={Download}>Download Selected</Button>
        </div>
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

        <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {activePack.title}
              </h2>
              <p className="mt-1 text-sm text-muted">{activePack.body}</p>
            </div>
            <Badge tone={activePack.tone} caps={false}>
              Selected
            </Badge>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  <th className="px-3 py-2.5">Branch</th>
                  <th className="px-3 py-2.5 text-right">A/cs</th>
                  <th className="px-3 py-2.5 text-right">Outstanding</th>
                  <th className="px-3 py-2.5 text-right">Collection</th>
                  <th className="px-3 py-2.5 text-right">PAR %</th>
                </tr>
              </thead>
              <tbody>
                {branchRows.map((row) => (
                  <tr key={row.branch} className="border-t border-slate-100">
                    <td className="px-3 py-2.5 font-medium text-slate-800">
                      {row.branch}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-600">
                      {row.accounts}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-900">
                      {formatInr(row.outstanding, 0)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-emerald-700">
                      {formatInr(row.collection, 0)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-amber-700">
                      {row.par.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button icon={Download}>Download CSV</Button>
            <Button variant="secondary" icon={FileSpreadsheet}>
              Download Excel
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
