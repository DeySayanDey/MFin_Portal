"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { MisReportShell, MisTableCard } from "@/components/mis/MisReportShell";
import { collectionRows, formatInr } from "@/components/mis/mis-data";

export function MisCollectionView() {
  const [query, setQuery] = useState("");
  const total = collectionRows.reduce((sum, row) => sum + row.amount, 0);
  const cash = collectionRows
    .filter((row) => row.mode === "Cash")
    .reduce((sum, row) => sum + row.amount, 0);
  const upi = total - cash;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return collectionRows;
    return collectionRows.filter(
      (row) =>
        row.receipt.toLowerCase().includes(q) ||
        row.member.toLowerCase().includes(q) ||
        row.loan.toLowerCase().includes(q) ||
        row.agent.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <MisReportShell
      title="Daily Collection & Cash Register"
      subtitle="Every receipt generated in Kendra meetings or branch counter with GL Dr/Cr mapping."
      banglaHint="দৈনিক আদায় ও ক্যাশ রেজিস্টার"
      metrics={[
        {
          label: "Total Debit (Cash/Bank)",
          value: formatInr(total),
          hint: "Vault cash & UPI",
          tone: "green",
        },
        {
          label: "Cash Collections",
          value: formatInr(cash),
          hint: "Field + counter",
          tone: "amber",
        },
        {
          label: "UPI / Digital",
          value: formatInr(upi),
          hint: "Instant GL credit",
          tone: "blue",
        },
        {
          label: "Receipts Today",
          value: String(collectionRows.length),
          hint: "Posted vouchers",
          tone: "violet",
        },
      ]}
    >
      <MisTableCard
        title="Collection Register"
        subtitle="Agent attribution, mode, and receipt timestamps"
      >
        <div className="mb-4 relative max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter receipts..."
            className="w-full rounded-xl border border-border bg-surface-muted py-2.5 pr-3 pl-9 text-sm outline-none focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10"
          />
        </div>
        <div className="table-scroll">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-soft">
                <th className="pb-3 pr-3">Receipt</th>
                <th className="pb-3 pr-3">Member</th>
                <th className="pb-3 pr-3">Loan A/c</th>
                <th className="pb-3 pr-3">Kendra</th>
                <th className="pb-3 pr-3">Agent</th>
                <th className="pb-3 pr-3 text-right">Amount</th>
                <th className="pb-3 pr-3">Mode</th>
                <th className="pb-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.receipt} className="border-t border-border/70">
                  <td className="py-3.5 pr-3 font-semibold text-slate-900">
                    {row.receipt}
                  </td>
                  <td className="py-3.5 pr-3 font-medium text-slate-800">
                    {row.member}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-600">{row.loan}</td>
                  <td className="py-3.5 pr-3 text-slate-600">{row.kendra}</td>
                  <td className="py-3.5 pr-3 text-slate-600">{row.agent}</td>
                  <td className="py-3.5 pr-3 text-right font-semibold text-emerald-700">
                    {formatInr(row.amount)}
                  </td>
                  <td className="py-3.5 pr-3">
                    <Badge
                      tone={row.mode === "UPI" ? "info" : "neutral"}
                      caps={false}
                    >
                      {row.mode}
                    </Badge>
                  </td>
                  <td className="py-3.5 text-slate-600">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MisTableCard>
    </MisReportShell>
  );
}
