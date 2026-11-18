"use client";

import { useState, type ReactNode } from "react";
import { Download, FileSpreadsheet, Printer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  metricToneClass,
  type MisMetric,
} from "@/features/mis/components/mis-data";

const periods = ["This Week", "MTD", "YTD"] as const;

type MisReportShellProps = {
  /** @deprecated Header renders route title; kept for call-site compatibility */
  title?: string;
  /** @deprecated Header renders route subtitle; kept for call-site compatibility */
  subtitle?: string;
  banglaHint?: string;
  metrics: MisMetric[];
  children: ReactNode;
  actions?: ReactNode;
};

export function MisReportShell({
  metrics,
  children,
  actions,
}: MisReportShellProps) {
  const [period, setPeriod] = useState<(typeof periods)[number]>("MTD");

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {actions}
        <Button variant="secondary" icon={RefreshCw}>
          Refresh
        </Button>
        <Button variant="secondary" icon={FileSpreadsheet}>
          Excel
        </Button>
        <Button icon={Printer}>Print</Button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-3 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
          {periods.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPeriod(item)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                period === item
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted sm:text-sm">
          Period: <strong className="text-slate-800">12 / 09 / 2026</strong> to{" "}
          <strong className="text-slate-800">12 / 09 / 2026</strong> · {period}
        </p>
        <Button size="sm" variant="ghost" icon={Download}>
          Download Pack
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
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

      {children}
    </div>
  );
}

export function MisTableCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}
