"use client";

import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MisReportShell } from "@/features/mis/components/MisReportShell";
import { formatInr, npaRows } from "@/features/mis/components/mis-data";

type NpaRow = (typeof npaRows)[number];

const columns: DataTableColumn<NpaRow>[] = [
  {
    id: "loan",
    header: "Loan A/c",
    className: "font-semibold text-slate-900",
    cell: (row) => row.loan,
  },
  {
    id: "borrower",
    header: "Borrower",
    className: "font-medium text-slate-800",
    cell: (row) => row.borrower,
  },
  {
    id: "branch",
    header: "Branch",
    className: "text-slate-600",
    cell: (row) => row.branch,
  },
  {
    id: "outstanding",
    header: "Outstanding",
    align: "end",
    className: "font-semibold text-slate-900",
    cell: (row) => formatInr(row.outstanding),
  },
  {
    id: "dpd",
    header: "DPD",
    align: "center",
    className: "font-semibold text-rose-600",
    cell: (row) => row.dpd,
  },
  {
    id: "class",
    header: "Class",
    cell: (row) => (
      <Badge
        tone={
          row.class === "Loss"
            ? "danger"
            : row.class === "Doubtful"
              ? "warning"
              : "amber"
        }
        caps={false}
      >
        {row.class}
      </Badge>
    ),
  },
  {
    id: "provisionPct",
    header: "Prov %",
    align: "end",
    cell: (row) => `${row.provisionPct}%`,
  },
  {
    id: "provision",
    header: "Provision",
    align: "end",
    className: "font-semibold text-amber-700",
    cell: (row) => formatInr(row.provision),
  },
];

export function MisNpaProvisioningView() {
  const outstanding = npaRows.reduce((sum, row) => sum + row.outstanding, 0);
  const provision = npaRows.reduce((sum, row) => sum + row.provision, 0);

  return (
    <MisReportShell
      title="NPA Classification & Provisioning"
      subtitle="Sub-standard, doubtful and loss asset classification with IRAC provisioning amounts."
      banglaHint="এনপিএ শ্রেণীবিভাগ ও প্রভিশনিং রিপোর্ট"
      metrics={[
        {
          label: "NPA Outstanding",
          value: formatInr(outstanding, 0),
          hint: `${npaRows.length} accounts`,
          tone: "rose",
        },
        {
          label: "Required Provision",
          value: formatInr(provision, 0),
          hint: "GL 511000 debit",
          tone: "amber",
        },
        {
          label: "Coverage Ratio",
          value: `${((provision / outstanding) * 100).toFixed(1)}%`,
          hint: "Provision / NPA",
          tone: "violet",
        },
        {
          label: "Loss Assets",
          value: String(npaRows.filter((row) => row.class === "Loss").length),
          hint: "100% provisioned",
          tone: "slate",
        },
      ]}
    >
      <DataTable
        title="NPA Asset Register"
        description="Classification · DPD · Provision %"
        data={npaRows}
        columns={columns}
        getRowKey={(row) => row.loan}
        minWidth="920px"
      />
    </MisReportShell>
  );
}
