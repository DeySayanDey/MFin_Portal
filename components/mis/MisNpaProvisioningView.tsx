"use client";

import { Badge } from "@/components/ui/Badge";
import { MisReportShell, MisTableCard } from "@/components/mis/MisReportShell";
import { formatInr, npaRows } from "@/components/mis/mis-data";

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
      <MisTableCard
        title="NPA Asset Register"
        subtitle="Classification · DPD · Provision %"
      >
        <div className="table-scroll">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-soft">
                <th className="pb-3 pr-3">Loan A/c</th>
                <th className="pb-3 pr-3">Borrower</th>
                <th className="pb-3 pr-3">Branch</th>
                <th className="pb-3 pr-3 text-right">Outstanding</th>
                <th className="pb-3 pr-3 text-center">DPD</th>
                <th className="pb-3 pr-3">Class</th>
                <th className="pb-3 pr-3 text-right">Prov %</th>
                <th className="pb-3 text-right">Provision</th>
              </tr>
            </thead>
            <tbody>
              {npaRows.map((row) => (
                <tr key={row.loan} className="border-t border-border/70">
                  <td className="py-3.5 pr-3 font-semibold text-slate-900">
                    {row.loan}
                  </td>
                  <td className="py-3.5 pr-3 font-medium text-slate-800">
                    {row.borrower}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-600">{row.branch}</td>
                  <td className="py-3.5 pr-3 text-right font-semibold text-slate-900">
                    {formatInr(row.outstanding)}
                  </td>
                  <td className="py-3.5 pr-3 text-center font-semibold text-rose-600">
                    {row.dpd}
                  </td>
                  <td className="py-3.5 pr-3">
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
                  </td>
                  <td className="py-3.5 pr-3 text-right text-slate-700">
                    {row.provisionPct}%
                  </td>
                  <td className="py-3.5 text-right font-semibold text-amber-700">
                    {formatInr(row.provision)}
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
