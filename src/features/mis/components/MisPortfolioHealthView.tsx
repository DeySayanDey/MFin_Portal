"use client";

import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MisReportShell } from "@/features/mis/components/MisReportShell";
import {
  branchGlRows,
  formatInr,
  parBuckets,
} from "@/features/mis/components/mis-data";

type BranchGlRow = (typeof branchGlRows)[number];

const columns: DataTableColumn<BranchGlRow>[] = [
  {
    id: "branch",
    header: "Branch",
    className: "font-semibold text-slate-900",
    cell: (row) => row.branch,
  },
  {
    id: "aum",
    header: "AUM",
    align: "end",
    className: "font-semibold text-slate-900",
    cell: (row) => formatInr(row.debit),
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
    cell: (row) => `${row.efficiency.toFixed(2)}%`,
  },
  {
    id: "par",
    header: "PAR %",
    align: "end",
    className: "font-semibold text-amber-700",
    cell: (row) => `${row.par.toFixed(2)}%`,
  },
  {
    id: "health",
    header: "Health",
    cell: (row) => (
      <Badge
        tone={row.par < 1 ? "success" : row.par < 2 ? "warning" : "danger"}
        caps={false}
      >
        {row.par < 1 ? "Strong" : row.par < 2 ? "Watch" : "Stress"}
      </Badge>
    ),
  },
];

export function MisPortfolioHealthView() {
  const totalAum = branchGlRows.reduce((sum, row) => sum + row.debit, 0);
  const avgEff =
    branchGlRows.reduce((sum, row) => sum + row.efficiency, 0) /
    branchGlRows.length;
  const atRisk = parBuckets
    .filter((row) => row.bucket !== "Current (0 DPD)")
    .reduce((sum, row) => sum + row.amount, 0);

  return (
    <MisReportShell
      title="Portfolio Health Monitor"
      subtitle="AUM quality, collection efficiency, PAR exposure, and branch concentration risk."
      banglaHint="পোর্টফোলিও স্বাস্থ্য মনিটর"
      metrics={[
        {
          label: "Gross AUM",
          value: formatInr(totalAum, 0),
          hint: "Standard + PAR books",
          tone: "green",
        },
        {
          label: "Collection Efficiency",
          value: `${avgEff.toFixed(2)}%`,
          hint: "Branch weighted MTD",
          tone: "blue",
        },
        {
          label: "At-Risk Portfolio",
          value: formatInr(atRisk, 0),
          hint: "PAR > 0 DPD",
          tone: "amber",
        },
        {
          label: "Healthy Branches",
          value: String(branchGlRows.filter((row) => row.par < 2).length),
          hint: "PAR < 2%",
          tone: "violet",
        },
      ]}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {parBuckets.map((bucket) => (
          <div
            key={bucket.bucket}
            className="rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-[var(--shadow-card)]"
          >
            <p className="text-xs font-semibold text-slate-500">{bucket.bucket}</p>
            <p className="mt-1.5 text-lg font-bold text-slate-900">
              {formatInr(bucket.amount, 0)}
            </p>
            <p className="mt-1 text-xs text-muted">{bucket.accounts} accounts</p>
          </div>
        ))}
      </div>

      <DataTable
        title="Branch Portfolio Quality"
        description="Concentration, efficiency, and PAR by operating branch"
        data={branchGlRows}
        columns={columns}
        getRowKey={(row) => row.jlg}
        minWidth="820px"
      />
    </MisReportShell>
  );
}
