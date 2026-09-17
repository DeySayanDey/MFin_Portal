"use client";

import type { ReactNode } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { MakerPanel } from "@/components/master/MasterPanels";

export function MakerCheckerView() {
  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          Maker-Checker Dual Authorization Setup
        </h1>
        <p className="mt-1 text-sm text-muted">
          Configure financial threshold limits, segregation of duties, and
          checker approval designations by voucher type
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active Rules"
          value="5"
          hint="Voucher types covered"
          tone="bg-amber-50 text-amber-800"
        />
        <MetricCard
          label="Dual Auth Mandatory"
          value="5"
          hint="All high-risk vouchers"
          tone="bg-blue-50 text-blue-700"
        />
        <MetricCard
          label="Pending Checker Inbox"
          value="3"
          hint="Awaiting approval"
          tone="bg-rose-50 text-rose-700"
        />
        <MetricCard
          label="Auto-Approve Enabled"
          value="4"
          hint="Below threshold"
          tone="bg-emerald-50 text-emerald-700"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <InfoCard
          icon={<ShieldCheck className="h-4 w-4" />}
          title="Segregation of Duties"
          body="Maker roles initiate vouchers; checker roles independently approve before posting."
        />
        <InfoCard
          icon={<Lock className="h-4 w-4" />}
          title="Threshold Routing"
          body="Transactions at or above the limit are routed to the Checker Authorization Inbox."
        />
        <InfoCard
          icon={<ShieldCheck className="h-4 w-4" />}
          title="Dual Sign-off"
          body="Cashier / FieldAgent makers require BranchManager or SeniorAccountant checkers."
        />
      </div>

      <MakerPanel />
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: string;
}) {
  return (
    <div className={`rounded-2xl px-4 py-4 ${tone}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs opacity-80">{hint}</p>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 text-amber-700">
        {icon}
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
    </article>
  );
}
