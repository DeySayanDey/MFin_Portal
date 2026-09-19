"use client";

import { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MisReportShell, MisTableCard } from "@/features/mis/components/MisReportShell";
import { exportPacks } from "@/features/mis/components/mis-data";

export function MisExportsView() {
  const [selected, setSelected] = useState(exportPacks[0]!.id);
  const active = exportPacks.find((pack) => pack.id === selected) ?? exportPacks[0]!;

  return (
    <MisReportShell
      title="Scheduled Exports & Regulatory Packs"
      subtitle="Download or schedule daily, weekly, monthly, and quarterly MIS / CIC / RBI export packs."
      banglaHint="নির্ধারিত এক্সপোর্ট ও রেগুলেটরি প্যাক"
      metrics={[
        {
          label: "Export Packs",
          value: String(exportPacks.length),
          hint: "Ready to generate",
          tone: "blue",
        },
        {
          label: "Daily Jobs",
          value: "1",
          hint: "07:30 PM auto",
          tone: "green",
        },
        {
          label: "Monthly CIC",
          value: "Due 5th",
          hint: "CIBIL / CRIF / Equifax",
          tone: "violet",
        },
        {
          label: "Selected Pack",
          value: active.format,
          hint: active.schedule,
          tone: "amber",
        },
      ]}
      actions={
        <Button icon={Download}>
          Run Selected Export
        </Button>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <MisTableCard
          title="Available Export Packs"
          subtitle="Select a pack to preview schedule and formats"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {exportPacks.map((pack) => (
              <button
                key={pack.id}
                type="button"
                onClick={() => setSelected(pack.id)}
                className={`rounded-xl border px-4 py-3.5 text-left transition ${
                  selected === pack.id
                    ? "border-blue-300 bg-blue-50 ring-4 ring-blue-500/10"
                    : "border-border hover:border-slate-300 hover:bg-surface-muted"
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">
                  {pack.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">{pack.body}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="neutral" caps={false}>
                    {pack.schedule}
                  </Badge>
                  <Badge tone="info" caps={false}>
                    {pack.format}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </MisTableCard>

        <MisTableCard title={active.title} subtitle={active.body}>
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm">
            <p>
              <span className="text-slate-500">Schedule:</span>{" "}
              <strong className="text-slate-900">{active.schedule}</strong>
            </p>
            <p>
              <span className="text-slate-500">Formats:</span>{" "}
              <strong className="text-slate-900">{active.format}</strong>
            </p>
            <p>
              <span className="text-slate-500">Delivery:</span>{" "}
              <strong className="text-slate-900">
                Secure download + optional email to Super Admin
              </strong>
            </p>
            <p className="text-xs leading-5 text-muted">
              All packs reconcile to N-Level COA with debit/credit invariant
              checks before export.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button icon={Download}>Download Now</Button>
            <Button variant="secondary" icon={FileSpreadsheet}>
              Schedule Email
            </Button>
          </div>
        </MisTableCard>
      </div>
    </MisReportShell>
  );
}
