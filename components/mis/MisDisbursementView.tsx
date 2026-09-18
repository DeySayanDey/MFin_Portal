"use client";

import { Badge } from "@/components/ui/Badge";
import { MisReportShell, MisTableCard } from "@/components/mis/MisReportShell";
import { disbursementRows, formatInr } from "@/components/mis/mis-data";

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
      <MisTableCard
        title="Disbursement Register"
        subtitle="Application → loan account → payout mode"
      >
        <div className="table-scroll">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-soft">
                <th className="pb-3 pr-3">App #</th>
                <th className="pb-3 pr-3">Loan A/c</th>
                <th className="pb-3 pr-3">Borrower</th>
                <th className="pb-3 pr-3">Product</th>
                <th className="pb-3 pr-3 text-right">Gross</th>
                <th className="pb-3 pr-3 text-right">Net</th>
                <th className="pb-3 pr-3">Mode</th>
                <th className="pb-3 pr-3">Date</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {disbursementRows.map((row) => (
                <tr key={row.app} className="border-t border-border/70">
                  <td className="py-3.5 pr-3 font-semibold text-slate-900">
                    {row.app}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-700">{row.loan}</td>
                  <td className="py-3.5 pr-3 font-medium text-slate-800">
                    {row.borrower}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-600">{row.product}</td>
                  <td className="py-3.5 pr-3 text-right font-semibold text-slate-900">
                    {formatInr(row.gross)}
                  </td>
                  <td className="py-3.5 pr-3 text-right font-semibold text-emerald-700">
                    {formatInr(row.net)}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-600">{row.mode}</td>
                  <td className="py-3.5 pr-3 text-slate-600">{row.date}</td>
                  <td className="py-3.5">
                    <Badge
                      tone={row.status === "Disbursed" ? "success" : "warning"}
                      caps={false}
                    >
                      {row.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MisTableCard>
    </MisReportShell>
  );
}
