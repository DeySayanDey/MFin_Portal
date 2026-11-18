"use client";

import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { MisReportShell } from "@/features/mis/components/MisReportShell";
import { demandRows, formatInr } from "@/features/mis/components/mis-data";

type DemandRow = (typeof demandRows)[number];

const columns: DataTableColumn<DemandRow>[] = [
  {
    id: "kendra",
    header: "Kendra Centre",
    className: "font-semibold text-slate-900",
    cell: (row) => row.kendra,
  },
  {
    id: "meeting",
    header: "Meeting",
    className: "text-slate-600",
    cell: (row) => row.meeting,
  },
  {
    id: "members",
    header: "Members",
    align: "end",
    cell: (row) => row.members,
  },
  {
    id: "principal",
    header: "Principal",
    align: "end",
    className: "font-medium text-slate-800",
    cell: (row) => formatInr(row.principal),
  },
  {
    id: "interest",
    header: "Interest",
    align: "end",
    className: "text-slate-600",
    cell: (row) => formatInr(row.interest),
  },
  {
    id: "total",
    header: "Total Demand",
    align: "end",
    className: "font-semibold text-emerald-700",
    cell: (row) => formatInr(row.total),
  },
];

export function MisDemandSheetView() {
  const totalDemand = demandRows.reduce((sum, row) => sum + row.total, 0);
  const totalPrincipal = demandRows.reduce((sum, row) => sum + row.principal, 0);
  const totalInterest = demandRows.reduce((sum, row) => sum + row.interest, 0);
  const members = demandRows.reduce((sum, row) => sum + row.members, 0);

  return (
    <MisReportShell
      title="Kendra Demand Sheet"
      subtitle="Printable field collection sheet for Kendra meeting installment collections."
      banglaHint="কেন্দ্রভিত্তিক দৈনিক ডিমান্ড শীট"
      metrics={[
        {
          label: "Kendra Centres",
          value: String(demandRows.length),
          hint: "Meetings scheduled",
          tone: "blue",
        },
        {
          label: "Members Due",
          value: String(members),
          hint: "Across centres",
          tone: "violet",
        },
        {
          label: "Principal Due",
          value: formatInr(totalPrincipal, 0),
          hint: "Scheduled principal Cr",
          tone: "slate",
        },
        {
          label: "Total Demand",
          value: formatInr(totalDemand, 0),
          hint: `Interest ${formatInr(totalInterest, 0)}`,
          tone: "green",
        },
      ]}
    >
      <DataTable
        title="Meeting-wise Demand Register"
        description="Principal and interest breakup for field officers"
        data={demandRows}
        columns={columns}
        getRowKey={(row) => row.kendra}
        minWidth="860px"
      />
    </MisReportShell>
  );
}
