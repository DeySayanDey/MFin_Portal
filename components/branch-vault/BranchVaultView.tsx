"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Coins,
  Info,
  KeyRound,
  Network,
  Truck,
  UserPlus,
  Vault,
} from "lucide-react";

const branches = [
  "Kolkata Shyambazar Hub Branch",
  "Sonarpur Branch",
  "Barasat Branch",
  "Halisahar Branch",
] as const;

const inflows = [
  { label: "Kendra Field Collections", amount: 42850 },
  { label: "Branch Counter Repayments", amount: 18200 },
  { label: "Bachat Gat Savings Deposits", amount: 14350 },
  { label: "Any-Branch Walk-in Collections", amount: 10000, emphasis: true },
];

const outflows = [
  { label: "Loan Disbursal (Cash Portion)", amount: 25000 },
  { label: "Savings Account Withdrawals", amount: 12000 },
  { label: "Branch Petty Cash Expenses", amount: 3000 },
  { label: "Transit to Other Branches", amount: 5000, emphasis: true },
];

const denominationDefs = [
  { label: "₹500 Notes", value: 500, initial: 480 },
  { label: "₹200 Notes", value: 200, initial: 50 },
  { label: "₹100 Notes", value: 100, initial: 80 },
  { label: "₹50 Notes", value: 50, initial: 60 },
  { label: "₹20 Notes", value: 20, initial: 80 },
  { label: "₹10 Notes", value: 10, initial: 47 },
] as const;

const tabs = [
  {
    id: "vault",
    label: "Vault & Day Balancing",
    bn: "ভল্ট ও দিন খতিয়ান",
    icon: Vault,
  },
  {
    id: "transfers",
    label: "Inter-Branch Cash Transfers",
    bn: "আন্তঃশাখা নগদ স্থানান্তর",
    icon: Truck,
    count: 0,
  },
  {
    id: "transactions",
    label: "Any-Branch Customer Transactions",
    bn: "আন্তঃশাখা গ্রাহক সেবা",
    icon: Network,
    count: 0,
  },
] as const;

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);
}

export function BranchVaultView() {
  const [branch, setBranch] = useState<(typeof branches)[number]>(branches[0]);
  const [activeTab, setActiveTab] =
    useState<(typeof tabs)[number]["id"]>("vault");
  const [counts, setCounts] = useState<number[]>(
    denominationDefs.map((item) => item.initial),
  );

  const totalInflow = inflows.reduce((sum, item) => sum + item.amount, 0);
  const totalOutflow = outflows.reduce((sum, item) => sum + item.amount, 0);
  const openingCash = 200000;
  const currentBalance = openingCash + totalInflow - totalOutflow;

  const physicalTotal = useMemo(
    () =>
      denominationDefs.reduce(
        (sum, item, index) => sum + item.value * (counts[index] || 0),
        0,
      ),
    [counts],
  );

  const variance = physicalTotal - currentBalance;

  function updateCount(index: number, next: number) {
    setCounts((prev) =>
      prev.map((value, i) => (i === index ? Math.max(0, next) : value)),
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Vault className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-soft">
                  Operational Branch:
                </p>
                <label className="relative inline-flex min-w-0">
                  <Building2 className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-soft" />
                  <select
                    value={branch}
                    onChange={(event) =>
                      setBranch(event.target.value as (typeof branches)[number])
                    }
                    className="max-w-full appearance-none rounded-xl border border-border bg-surface-muted py-2 pr-8 pl-8 text-sm font-medium text-slate-800 outline-none focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10"
                  >
                    {branches.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Real-time branch vault ledger, dual-custody cash reconciliation,
                inter-branch transfers & cross-branch customer transactions.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:max-w-sm lg:w-auto">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
            >
              <Coins className="h-4 w-4" />
              <span className="text-left">
                Physical Cash Audit{" "}
                <span className="font-normal opacity-90">(মুদ্রা ও নোট গণনা)</span>
              </span>
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <Truck className="h-4 w-4" />
              <span className="text-left">
                Inter-Branch Transfer{" "}
                <span className="font-normal opacity-90">(নগদ স্থানান্তর)</span>
              </span>
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              <UserPlus className="h-4 w-4" />
              <span className="text-left">
                Any-Branch Transact{" "}
                <span className="font-normal opacity-90">(আন্তঃশাখা লেনদেন)</span>
              </span>
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            label="Branch Day Status"
            value="Day Closed (বন্ধ)"
            tone="slate"
            dot
          />
          <MetricCard
            label="Opening Vault Cash"
            value={formatInr(openingCash)}
            tone="slate"
          />
          <MetricCard
            label="Total Inflow (+)"
            value={`+ ${formatInr(totalInflow)}`}
            tone="green"
          />
          <MetricCard
            label="Total Outflow (-)"
            value={`- ${formatInr(totalOutflow)}`}
            tone="rose"
          />
          <MetricCard
            label="Current Vault Balance"
            value={formatInr(currentBalance)}
            tone="amber"
          />
          <MetricCard
            label="Cash Variance"
            value={`${formatInr(Math.abs(variance))} (Balanced)`}
            tone="slate"
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 lg:grid-cols-3">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition ${
                  active
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-border bg-surface-muted text-slate-700 hover:bg-white"
                }`}
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 text-sm font-semibold leading-snug">
                  {tab.label}{" "}
                  <span className={active ? "font-normal opacity-90" : "font-normal text-muted"}>
                    ({tab.bn})
                  </span>
                </span>
                {"count" in tab ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-white text-slate-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      {activeTab === "vault" ? (
        <>
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.9fr)]">
            <article className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Coins className="h-4 w-4" />
                </span>
                <h2 className="text-sm font-semibold text-blue-900 sm:text-base">
                  Today&apos;s Cash Movement Register{" "}
                  <span className="font-medium text-blue-700/80">
                    (দৈনিক নগদ লেনদেন বিবরণী)
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <MovementPanel
                  title="Cash Receipts / Inflows (+)"
                  tone="green"
                  icon={ArrowDownLeft}
                  rows={inflows}
                  totalLabel="Total Day Inflow:"
                  total={totalInflow}
                />
                <MovementPanel
                  title="Cash Payments / Outflows (-)"
                  tone="rose"
                  icon={ArrowUpRight}
                  rows={outflows}
                  totalLabel="Total Day Outflow:"
                  total={totalOutflow}
                />
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <KeyRound className="h-4 w-4" />
                </span>
                <h2 className="text-sm font-semibold text-blue-900 sm:text-base">
                  Dual Custody Handover Certificate
                </h2>
              </div>

              <div className="space-y-3">
                <SignOffCard
                  label="Cashier Sign-off"
                  name="Ramesh Gaikwad (Head Cashier)"
                  note="Verified physical cash counted."
                />
                <SignOffCard
                  label="Branch Manager Counter-sign"
                  name="Abhijit Bhattacharya (Branch Manager)"
                  note="Vault double-lock engaged."
                />
                <div className="flex items-start gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-3.5 py-3 text-sm text-blue-800">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Morning Day-Open executed. Wi-Fi manifest synchronized with
                    Head Office.
                  </p>
                </div>
              </div>
            </article>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <Coins className="h-4 w-4" />
                </span>
                <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
                  Physical Cash Denomination Tally{" "}
                  <span className="font-medium text-muted">
                    (নোট ও কয়েন গণনা)
                  </span>
                </h2>
              </div>
              <span className="w-fit rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-ink">
                Reconciled Zero Variance
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              {denominationDefs.map((item, index) => (
                <label
                  key={item.label}
                  className="rounded-2xl border border-border bg-surface-muted/60 p-3"
                >
                  <span className="block text-xs font-semibold text-slate-700">
                    {item.label}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={counts[index]}
                    onChange={(event) =>
                      updateCount(index, Number(event.target.value) || 0)
                    }
                    className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/10"
                  />
                  <span className="mt-2 block text-xs text-muted">
                    {formatInr(item.value * (counts[index] || 0))}
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-border bg-surface-muted/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-slate-900">
                Total Physical Counted Cash: {formatInr(physicalTotal)}
              </p>
              <p
                className={`text-sm font-semibold ${
                  Math.abs(variance) < 1 ? "text-brand-ink" : "text-amber-700"
                }`}
              >
                Variance: {formatInr(variance)}{" "}
                {Math.abs(variance) < 1 ? "(Balanced)" : "(Review)"}
              </p>
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-2xl border border-border bg-surface p-8 text-center shadow-[var(--shadow-card)]">
          <p className="text-sm font-semibold text-slate-900">
            {tabs.find((tab) => tab.id === activeTab)?.label}
          </p>
          <p className="mt-2 text-sm text-muted">
            No records in queue for this branch today.
          </p>
        </section>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
  dot = false,
}: {
  label: string;
  value: string;
  tone: "slate" | "green" | "rose" | "amber";
  dot?: boolean;
}) {
  const tones = {
    slate: "bg-surface-muted text-slate-800",
    green: "bg-emerald-50 text-emerald-800",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-900",
  };

  return (
    <div className={`rounded-2xl px-3.5 py-3 ${tones[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-70">
        {label}
      </p>
      <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold">
        {dot ? (
          <span className="h-2 w-2 rounded-full bg-slate-400" aria-hidden />
        ) : null}
        <span className="truncate">{value}</span>
      </p>
    </div>
  );
}

function MovementPanel({
  title,
  tone,
  icon: Icon,
  rows,
  totalLabel,
  total,
}: {
  title: string;
  tone: "green" | "rose";
  icon: typeof ArrowDownLeft;
  rows: { label: string; amount: number; emphasis?: boolean }[];
  totalLabel: string;
  total: number;
}) {
  const shell =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50/60"
      : "border-rose-200 bg-rose-50/60";
  const titleColor =
    tone === "green" ? "text-emerald-800" : "text-rose-700";
  const totalColor =
    tone === "green" ? "text-emerald-700" : "text-rose-600";
  const iconWrap =
    tone === "green"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-rose-100 text-rose-600";

  return (
    <div className={`rounded-2xl border p-3.5 sm:p-4 ${shell}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className={`text-sm font-semibold ${titleColor}`}>{title}</h3>
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full ${iconWrap}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <ul className="space-y-2.5">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-start justify-between gap-3 text-sm"
          >
            <span
              className={`min-w-0 ${
                row.emphasis
                  ? tone === "green"
                    ? "font-medium text-emerald-800"
                    : "font-medium text-rose-700"
                  : "text-slate-700"
              }`}
            >
              {row.label}
            </span>
            <span className="shrink-0 font-semibold text-slate-900">
              {formatInr(row.amount)}
            </span>
          </li>
        ))}
      </ul>
      <div
        className={`mt-4 flex items-center justify-between gap-3 border-t pt-3 text-sm font-semibold ${
          tone === "green" ? "border-emerald-200" : "border-rose-200"
        } ${totalColor}`}
      >
        <span>{totalLabel}</span>
        <span>{formatInr(total)}</span>
      </div>
    </div>
  );
}

function SignOffCard({
  label,
  name,
  note,
}: {
  label: string;
  name: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl bg-surface-muted px-3.5 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-soft">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold text-slate-900">{name}</p>
      <p className="mt-1.5 inline-flex items-start gap-1.5 text-xs text-brand-ink">
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {note}
      </p>
    </div>
  );
}
