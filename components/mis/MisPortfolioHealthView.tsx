"use client";

import { Badge } from "@/components/ui/Badge";
import { MisReportShell, MisTableCard } from "@/components/mis/MisReportShell";
import {
  branchGlRows,
  formatInr,
  parBuckets,
} from "@/components/mis/mis-data";

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

      <MisTableCard
        title="Branch Portfolio Quality"
        subtitle="Concentration, efficiency, and PAR by operating branch"
      >
        <div className="table-scroll">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-soft">
                <th className="pb-3 pr-3">Branch</th>
                <th className="pb-3 pr-3 text-right">AUM</th>
                <th className="pb-3 pr-3 text-right">Collection</th>
                <th className="pb-3 pr-3 text-right">Eff %</th>
                <th className="pb-3 pr-3 text-right">PAR %</th>
                <th className="pb-3">Health</th>
              </tr>
            </thead>
            <tbody>
              {branchGlRows.map((row) => (
                <tr key={row.jlg} className="border-t border-border/70">
                  <td className="py-3.5 pr-3 font-semibold text-slate-900">
                    {row.branch}
                  </td>
                  <td className="py-3.5 pr-3 text-right font-semibold text-slate-900">
                    {formatInr(row.debit)}
                  </td>
                  <td className="py-3.5 pr-3 text-right font-semibold text-emerald-700">
                    {formatInr(row.collection)}
                  </td>
                  <td className="py-3.5 pr-3 text-right text-slate-700">
                    {row.efficiency.toFixed(2)}%
                  </td>
                  <td className="py-3.5 pr-3 text-right font-semibold text-amber-700">
                    {row.par.toFixed(2)}%
                  </td>
                  <td className="py-3.5">
                    <Badge
                      tone={row.par < 1 ? "success" : row.par < 2 ? "warning" : "danger"}
                      caps={false}
                    >
                      {row.par < 1 ? "Strong" : row.par < 2 ? "Watch" : "Stress"}
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
