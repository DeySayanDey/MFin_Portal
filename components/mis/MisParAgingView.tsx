"use client";

import { MisReportShell, MisTableCard } from "@/components/mis/MisReportShell";
import { formatInr, parBuckets } from "@/components/mis/mis-data";

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
      <MisTableCard
        title="PAR Aging Buckets"
        subtitle={`Indicative total provision ${formatInr(provision)}`}
      >
        <div className="table-scroll">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-soft">
                <th className="pb-3 pr-3">Bucket</th>
                <th className="pb-3 pr-3 text-right">Accounts</th>
                <th className="pb-3 pr-3 text-right">Outstanding</th>
                <th className="pb-3 pr-3 text-right">Prov %</th>
                <th className="pb-3 text-right">Provision Amt</th>
              </tr>
            </thead>
            <tbody>
              {parBuckets.map((row) => (
                <tr key={row.bucket} className="border-t border-border/70">
                  <td className="py-3.5 pr-3 font-semibold text-slate-900">
                    {row.bucket}
                  </td>
                  <td className="py-3.5 pr-3 text-right text-slate-700">
                    {row.accounts}
                  </td>
                  <td className="py-3.5 pr-3 text-right font-semibold text-slate-900">
                    {formatInr(row.amount)}
                  </td>
                  <td className="py-3.5 pr-3 text-right text-slate-600">
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
