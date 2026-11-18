"use client";

import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MisReportShell } from "@/features/mis/components/MisReportShell";
import { disbursementRows, formatInr } from "@/features/mis/components/mis-data";

type DisbursementRow = (typeof disbursementRows)[number];

const columns: DataTableColumn<DisbursementRow>[] = [
  {
    id: "app",
    header: "App #",
    className: "font-semibold text-slate-900",
    cell: (row) => row.app,
  },
  {
    id: "loan",
    header: "Loan A/c",
    cell: (row) => row.loan,
  },
  {
    id: "borrower",
    header: "Borrower",
    className: "font-medium text-slate-800",
    cell: (row) => row.borrower,
  },
  {
    id: "product",
    header: "Product",
    className: "text-slate-600",
    cell: (row) => row.product,
  },
  {
    id: "gross",
    header: "Gross",
    align: "end",
    className: "font-semibold text-slate-900",
    cell: (row) => formatInr(row.gross),
  },
  {
    id: "net",
    header: "Net",
    align: "end",
    className: "font-semibold text-emerald-700",
    cell: (row) => formatInr(row.net),
  },
  {
    id: "mode",
    header: "Mode",
    className: "text-slate-600",
    cell: (row) => row.mode,
  },
  {
    id: "date",
    header: "Date",
    className: "text-slate-600",
    cell: (row) => row.date,
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => (
      <Badge
        tone={row.status === "Disbursed" ? "success" : "warning"}
        caps={false}
      >
        {row.status}
      </Badge>
    ),
  },
];

export function MisDisbursementView() {
  const gross = disbursementRows.reduce((sum, row) => sum + row.gross, 0);
  const net = disbursementRows.reduce((sum, row) => sum + row.net, 0);
  const queued = disbursementRows.filter((row) => row.status === "Queued").length;

  return (
    <MisReportShell
      title="Disbursement Report"
      subtitle="Gross vs net disbursal, fee/GST deductions, and NEFT/IMPS payout status."
      banglaHint="বিতরণ রিপোর্ট"
      metrics={[
        {
          label: "Gross Disbursed",
          value: formatInr(gross, 0),
          hint: "Sanctioned principal",
          tone: "blue",
        },
        {
          label: "Net Credited",
          value: formatInr(net, 0),
          hint: "After fee + GST",
          tone: "green",
        },
        {
          label: "Upfront Deductions",
          value: formatInr(gross - net),
          hint: "Fee / Ins / GST",
          tone: "amber",
        },
        {
          label: "Queued Batches",
          value: String(queued),
          hint: "Awaiting NEFT export",
          tone: "violet",
        },
      ]}
    >
      <DataTable
        title="Disbursement Register"
        description="Application → loan account → payout mode"
        data={disbursementRows}
        columns={columns}
        getRowKey={(row) => row.app}
        minWidth="980px"
      />
    </MisReportShell>
  );
}
