"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Search,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  formatInr,
  lmsLoans,
  metricToneClass,
} from "@/components/lms/lms-data";

const buckets = [
  { id: "0", label: "Current (0 DPD)", min: 0, max: 0, tone: "success" as const },
  { id: "1-30", label: "PAR 1–30", min: 1, max: 30, tone: "warning" as const },
  { id: "31-60", label: "PAR 31–60", min: 31, max: 60, tone: "amber" as const },
  { id: "61-90", label: "PAR 61–90", min: 61, max: 90, tone: "violet" as const },
  { id: "90+", label: "NPA 90+", min: 91, max: 9999, tone: "danger" as const },
];

export function LmsParNpaView() {
  const [query, setQuery] = useState("");
  const [activeBucket, setActiveBucket] = useState("all");

  const bucketStats = buckets.map((bucket) => {
    const rows = lmsLoans.filter(
      (loan) => loan.dpd >= bucket.min && loan.dpd <= bucket.max,
    );
    const amount = rows.reduce((sum, row) => sum + row.outstanding, 0);
    return { ...bucket, count: rows.length, amount };
  });

  const totalOutstanding = lmsLoans.reduce(
    (sum, row) => sum + row.outstanding,
    0,
  );
  const parAmount = lmsLoans
    .filter((row) => row.dpd > 0)
    .reduce((sum, row) => sum + row.outstanding, 0);
  const npaAmount = lmsLoans
    .filter((row) => row.dpd >= 90)
    .reduce((sum, row) => sum + row.outstanding, 0);
  const parPct = totalOutstanding
    ? ((parAmount / totalOutstanding) * 100).toFixed(2)
    : "0.00";
  const npaPct = totalOutstanding
    ? ((npaAmount / totalOutstanding) * 100).toFixed(2)
    : "0.00";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lmsLoans.filter((row) => {
      const matchesQuery =
        !q ||
        row.loanId.toLowerCase().includes(q) ||
        row.borrower.toLowerCase().includes(q);
      if (!matchesQuery) return false;
      if (activeBucket === "all") return true;
      const bucket = buckets.find((item) => item.id === activeBucket);
      if (!bucket) return true;
      return row.dpd >= bucket.min && row.dpd <= bucket.max;
    });
  }, [query, activeBucket]);

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            PAR / NPA Monitor
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
            Portfolio-at-risk aging, NPA classification, and provisioning
            exposure under RBI microfinance norms
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={BarChart3}>
            Aging Export
          </Button>
          <Button variant="warning" icon={ShieldAlert}>
            Run Provisioning
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Gross Loan Portfolio",
            value: formatInr(totalOutstanding, 0),
            hint: `${lmsLoans.length} accounts`,
            tone: "blue" as const,
          },
          {
            label: "PAR > 0",
            value: `${parPct}%`,
            hint: formatInr(parAmount, 0),
            tone: "amber" as const,
          },
          {
            label: "NPA (90+ DPD)",
            value: `${npaPct}%`,
            hint: formatInr(npaAmount, 0),
            tone: "rose" as const,
          },
          {
            label: "Provision Estimate",
            value: formatInr(npaAmount * 0.5 + parAmount * 0.1, 0),
            hint: "Indicative IRAC",
            tone: "violet" as const,
          },
        ].map((metric) => (
          <div
            key={metric.label}
            className={`rounded-2xl border px-4 py-3.5 ${metricToneClass[metric.tone]}`}
          >
            <p className="text-xs font-semibold tracking-wide uppercase opacity-80">
              {metric.label}
            </p>
            <p className="mt-1.5 text-xl font-bold tracking-tight">
              {metric.value}
            </p>
            <p className="mt-1 text-xs opacity-75">{metric.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {bucketStats.map((bucket) => (
          <button
            key={bucket.id}
            type="button"
            onClick={() =>
              setActiveBucket((prev) =>
                prev === bucket.id ? "all" : bucket.id,
              )
            }
            className={`rounded-2xl border px-4 py-3.5 text-left transition ${
              activeBucket === bucket.id
                ? "border-blue-300 ring-4 ring-blue-500/10"
                : "border-border bg-surface hover:border-slate-300"
            }`}
          >
            <p className="text-xs font-semibold text-slate-500">{bucket.label}</p>
            <p className="mt-1.5 text-lg font-bold text-slate-900">
              {formatInr(bucket.amount, 0)}
            </p>
            <p className="mt-1 text-xs text-muted">{bucket.count} accounts</p>
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              DPD Aging Register
            </h2>
            <p className="mt-1 text-sm text-muted">
              Click an aging bucket above to filter portfolio exposure
            </p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter records..."
              className="w-full rounded-xl border border-border bg-surface-muted py-2.5 pr-3 pl-9 text-sm outline-none focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10"
            />
          </div>
        </div>

        <div className="table-scroll">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-soft">
                <th className="pb-3 pr-3">Loan A/c</th>
                <th className="pb-3 pr-3">Borrower</th>
                <th className="pb-3 pr-3 text-right">Outstanding</th>
                <th className="pb-3 pr-3 text-center">DPD</th>
                <th className="pb-3 pr-3">Bucket</th>
                <th className="pb-3 pr-3 text-right">EMI</th>
                <th className="pb-3">Classification</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const bucket =
                  buckets.find(
                    (item) => row.dpd >= item.min && row.dpd <= item.max,
                  ) ?? buckets[0]!;
                return (
                  <tr key={row.loanId} className="border-t border-border/70">
                    <td className="py-3.5 pr-3 font-semibold text-slate-900">
                      {row.loanId}
                    </td>
                    <td className="py-3.5 pr-3">
                      <p className="font-medium text-slate-800">{row.borrower}</p>
                      <p className="text-xs text-muted">{row.group}</p>
                    </td>
                    <td className="py-3.5 pr-3 text-right font-semibold text-slate-900">
                      {formatInr(row.outstanding)}
                    </td>
                    <td className="py-3.5 pr-3 text-center font-semibold text-amber-700">
                      {row.dpd}
                    </td>
                    <td className="py-3.5 pr-3">
                      <Badge tone={bucket.tone} caps={false}>
                        {bucket.label}
                      </Badge>
                    </td>
                    <td className="py-3.5 pr-3 text-right text-slate-700">
                      {formatInr(row.emi)}
                    </td>
                    <td className="py-3.5">
                      <Badge
                        tone={
                          row.status === "Current"
                            ? "success"
                            : row.status === "NPA"
                              ? "danger"
                              : "warning"
                        }
                        caps={false}
                      >
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
