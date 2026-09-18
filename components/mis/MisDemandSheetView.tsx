"use client";

import { MisReportShell, MisTableCard } from "@/components/mis/MisReportShell";
import { demandRows, formatInr } from "@/components/mis/mis-data";

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
      <MisTableCard
        title="Meeting-wise Demand Register"
        subtitle="Principal and interest breakup for field officers"
      >
        <div className="table-scroll">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-soft">
                <th className="pb-3 pr-3">Kendra Centre</th>
                <th className="pb-3 pr-3">Meeting</th>
                <th className="pb-3 pr-3 text-right">Members</th>
                <th className="pb-3 pr-3 text-right">Principal</th>
                <th className="pb-3 pr-3 text-right">Interest</th>
                <th className="pb-3 text-right">Total Demand</th>
              </tr>
            </thead>
            <tbody>
              {demandRows.map((row) => (
                <tr key={row.kendra} className="border-t border-border/70">
                  <td className="py-3.5 pr-3 font-semibold text-slate-900">
                    {row.kendra}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-600">{row.meeting}</td>
                  <td className="py-3.5 pr-3 text-right text-slate-700">
                    {row.members}
                  </td>
                  <td className="py-3.5 pr-3 text-right font-medium text-slate-800">
                    {formatInr(row.principal)}
                  </td>
                  <td className="py-3.5 pr-3 text-right text-slate-600">
                    {formatInr(row.interest)}
                  </td>
                  <td className="py-3.5 text-right font-semibold text-emerald-700">
                    {formatInr(row.total)}
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
