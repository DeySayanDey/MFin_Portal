"use client";

import { Badge } from "@/components/ui/Badge";
import { MisReportShell, MisTableCard } from "@/components/mis/MisReportShell";
import { formatInr, scorecardRows } from "@/components/mis/mis-data";

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
      <MisTableCard
        title="Branch Ranking Matrix"
        subtitle="Composite operational KPIs for BM review"
      >
        <div className="table-scroll">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-soft">
                <th className="pb-3 pr-3">Rank</th>
                <th className="pb-3 pr-3">Branch</th>
                <th className="pb-3 pr-3 text-right">AUM</th>
                <th className="pb-3 pr-3 text-right">Coll. Eff</th>
                <th className="pb-3 pr-3 text-right">PAR 30</th>
                <th className="pb-3 pr-3 text-right">NPA %</th>
                <th className="pb-3 pr-3 text-right">Disbursals</th>
                <th className="pb-3">Band</th>
              </tr>
            </thead>
            <tbody>
              {scorecardRows.map((row) => (
                <tr key={row.branch} className="border-t border-border/70">
                  <td className="py-3.5 pr-3 font-bold text-slate-900">
                    #{row.rank}
                  </td>
                  <td className="py-3.5 pr-3 font-semibold text-slate-800">
                    {row.branch}
                  </td>
                  <td className="py-3.5 pr-3 text-right font-semibold text-slate-900">
                    {formatInr(row.aum, 0)}
                  </td>
                  <td className="py-3.5 pr-3 text-right font-semibold text-emerald-700">
                    {row.collectionEff.toFixed(1)}%
                  </td>
                  <td className="py-3.5 pr-3 text-right font-semibold text-amber-700">
                    {row.par30.toFixed(2)}%
                  </td>
                  <td className="py-3.5 pr-3 text-right text-rose-600">
                    {row.npa.toFixed(2)}%
                  </td>
                  <td className="py-3.5 pr-3 text-right text-slate-700">
                    {row.disbursal}
                  </td>
                  <td className="py-3.5">
                    <Badge
                      tone={
                        row.rank === 1
                          ? "success"
                          : row.rank <= 3
                            ? "info"
                            : "neutral"
                      }
                      caps={false}
                    >
                      {row.rank === 1
                        ? "Leader"
                        : row.rank <= 3
                          ? "Strong"
                          : "Improve"}
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
