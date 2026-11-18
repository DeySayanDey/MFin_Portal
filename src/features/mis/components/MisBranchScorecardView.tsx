"use client";

import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MisReportShell } from "@/features/mis/components/MisReportShell";
import { formatInr, scorecardRows } from "@/features/mis/components/mis-data";

type ScorecardRow = (typeof scorecardRows)[number];

const columns: DataTableColumn<ScorecardRow>[] = [
  {
    id: "rank",
    header: "Rank",
    className: "font-bold text-slate-900",
    cell: (row) => `#${row.rank}`,
  },
  {
    id: "branch",
    header: "Branch",
    className: "font-semibold text-slate-800",
    cell: (row) => row.branch,
  },
  {
    id: "aum",
    header: "AUM",
    align: "end",
    className: "font-semibold text-slate-900",
    cell: (row) => formatInr(row.aum, 0),
  },
  {
    id: "collectionEff",
    header: "Coll. Eff",
    align: "end",
    className: "font-semibold text-emerald-700",
    cell: (row) => `${row.collectionEff.toFixed(1)}%`,
  },
  {
    id: "par30",
    header: "PAR 30",
    align: "end",
    className: "font-semibold text-amber-700",
    cell: (row) => `${row.par30.toFixed(2)}%`,
  },
  {
    id: "npa",
    header: "NPA %",
    align: "end",
    className: "text-rose-600",
    cell: (row) => `${row.npa.toFixed(2)}%`,
  },
  {
    id: "disbursal",
    header: "Disbursals",
    align: "end",
    cell: (row) => row.disbursal,
  },
  {
    id: "band",
    header: "Band",
    cell: (row) => (
      <Badge
        tone={row.rank === 1 ? "success" : row.rank <= 3 ? "info" : "neutral"}
        caps={false}
      >
        {row.rank === 1 ? "Leader" : row.rank <= 3 ? "Strong" : "Improve"}
      </Badge>
    ),
  },
];

export function MisBranchScorecardView() {
  const top = scorecardRows[0]!;
  const avgEff =
    scorecardRows.reduce((sum, row) => sum + row.collectionEff, 0) /
    scorecardRows.length;

  return (
    <MisReportShell
      title="Branch Performance Scorecard"
      subtitle="Ranked branch scorecard on AUM, collection efficiency, PAR, NPA, and disbursal throughput."
      banglaHint="শাখা পারফরম্যান্স র‌্যাঙ্কিং"
      metrics={[
        {
          label: "Top Branch",
          value: top.branch.split(" ")[0]!,
          hint: `#1 · Eff ${top.collectionEff}%`,
          tone: "green",
        },
        {
          label: "Avg Collection Eff",
          value: `${avgEff.toFixed(1)}%`,
          hint: "All operating branches",
          tone: "blue",
        },
        {
          label: "Branches Tracked",
          value: String(scorecardRows.length),
          hint: "Active network",
          tone: "violet",
        },
        {
          label: "Best PAR 30",
          value: `${Math.min(...scorecardRows.map((row) => row.par30)).toFixed(2)}%`,
          hint: "Lowest risk book",
          tone: "amber",
        },
      ]}
    >
      <DataTable
        title="Branch Ranking Matrix"
        description="Composite operational KPIs for BM review"
        data={scorecardRows}
        columns={columns}
        getRowKey={(row) => row.branch}
        minWidth="920px"
      />
    </MisReportShell>
  );
}
