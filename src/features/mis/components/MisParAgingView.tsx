"use client";

import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { MisReportShell } from "@/features/mis/components/MisReportShell";
import { formatInr, parBuckets } from "@/features/mis/components/mis-data";

type ParBucketRow = (typeof parBuckets)[number];

const columns: DataTableColumn<ParBucketRow>[] = [
  {
    id: "bucket",
    header: "Bucket",
    className: "font-semibold text-slate-900",
    cell: (row) => row.bucket,
  },
  {
    id: "accounts",
    header: "Accounts",
    align: "end",
    cell: (row) => row.accounts,
  },
  {
    id: "outstanding",
    header: "Outstanding",
    align: "end",
    className: "font-semibold text-slate-900",
    cell: (row) => formatInr(row.amount),
  },
  {
    id: "provisionPct",
    header: "Prov %",
    align: "end",
    className: "text-slate-600",
    cell: (row) => `${row.provisionPct}%`,
  },
  {
    id: "provision",
    header: "Provision Amt",
    align: "end",
    className: "font-semibold text-amber-700",
    cell: (row) => formatInr(row.provision),
  },
];

export function MisParAgingView() {
  const atRisk = parBuckets
    .filter((row) => row.bucket !== "Current (0 DPD)")
    .reduce((sum, row) => sum + row.amount, 0);
  const provision = parBuckets.reduce((sum, row) => sum + row.provision, 0);
  const npa = parBuckets.find((row) => row.bucket.includes("90+"))!;

  return (
    <MisReportShell
      title="Portfolio at Risk (PAR) Aging"
      subtitle="Industry standard PAR aging breakdown by bucket with indicative IRAC provisioning."
      banglaHint="পোর্টফোলিও অ্যাট রিস্ক (PAR) এজিং"
      metrics={[
        {
          label: "Total At-Risk (PAR)",
          value: formatInr(atRisk, 0),
          hint: "GL 121200 PAR Portfolio",
          tone: "amber",
        },
        {
          label: "PAR 1–30 (SMA-0)",
          value: formatInr(parBuckets[1]!.amount, 0),
          hint: `Prov ${formatInr(parBuckets[1]!.provision)}`,
          tone: "blue",
        },
        {
          label: "PAR 31–60 (SMA-1)",
          value: formatInr(parBuckets[2]!.amount, 0),
          hint: `Prov ${formatInr(parBuckets[2]!.provision)}`,
          tone: "violet",
        },
        {
          label: "NPA 90+",
          value: formatInr(npa.amount, 0),
          hint: "GL 511000 / 121900",
          tone: "rose",
        },
      ]}
    >
      <DataTable
        title="PAR Aging Buckets"
        description={`Indicative total provision ${formatInr(provision)}`}
        data={parBuckets}
        columns={columns}
        getRowKey={(row) => row.bucket}
        minWidth="760px"
      />
    </MisReportShell>
  );
}
