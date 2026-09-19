"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Coins,
  Info,
  KeyRound,
  Network,
  Plus,
  Save,
  Truck,
  UserPlus,
  Vault,
  X,
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
  { label: "₹200 Notes", value: 200, initial: 85 },
  { label: "₹100 Notes", value: 100, initial: 50 },
  { label: "₹50 Notes", value: 50, initial: 100 },
  { label: "₹20 Notes", value: 20, initial: 5 },
  { label: "₹10 Notes", value: 10, initial: 10 },
] as const;

const transferRows = [
  {
    id: "TRF-WB-4410",
    courier: "Payel Chakraborty",
    vehicle: "WB-52-T-4410",
    escort: "Subhashish Roy (Field Escort)",
    escortId: "WB-02-AX-8912",
    from: "Shyambazar Hub",
    to: "Sonarpur Branch",
    amount: 50000,
    status: "Reconciled" as const,
  },
  {
    id: "TRF-WB-2201",
    courier: "Amitava Sen",
    vehicle: "WB-02-C-2201",
    escort: "Rina Das (Vault Escort)",
    escortId: "WB-01-ES-1102",
    from: "Shyambazar Hub",
    to: "Barasat Branch",
    amount: 35000,
    status: "In Transit" as const,
  },
];

const anyBranchRows = [
  {
    customer: "CUST-WB-0006",
    name: "Kakali Mondal",
    homeBranch: "Sonarpur Branch",
    serving: "Shyambazar Hub",
    type: "Loan EMI",
    mode: "Cash",
    amount: 3500,
    status: "Posted",
  },
  {
    customer: "CUST-WB-0001",
    name: "Aparna Sardar",
    homeBranch: "Halisahar Branch",
    serving: "Shyambazar Hub",
    type: "Bachat Gat Deposit",
    mode: "UPI",
    amount: 1250,
    status: "Posted",
  },
  {
    customer: "CUST-WB-0018",
    name: "Mousumi Ghosh",
    homeBranch: "Barasat Branch",
    serving: "Shyambazar Hub",
    type: "Loan EMI",
    mode: "Cash",
    amount: 3017.49,
    status: "Pending Clear",
  },
];

const custodians = [
  {
    role: "Primary Custodian (Cashier)",
    name: "Ramesh Gaikwad",
    empId: "EMP-011",
    key: "Vault Key A",
  },
  {
    role: "Secondary Custodian (BM)",
    name: "Abhijit Bhattacharya",
    empId: "EMP-001",
    key: "Vault Key B",
  },
];

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
    count: transferRows.length,
  },
  {
    id: "transactions",
    label: "Any-Branch Customer Transactions",
    bn: "আন্তঃশাখা গ্রাহক সেবা",
    icon: Network,
    count: anyBranchRows.length,
  },
] as const;

type TabId = (typeof tabs)[number]["id"];
type ModalKind = "audit" | "transfer" | "anyBranch" | "dayClose" | null;

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);
}

export function BranchVaultMasterView() {
  const [branch, setBranch] = useState<(typeof branches)[number]>(branches[0]);
  const [activeTab, setActiveTab] = useState<TabId>("vault");
  const [modal, setModal] = useState<ModalKind>(null);
  const [counts, setCounts] = useState<number[]>(
    denominationDefs.map((item) => item.initial),
  );
  const [dayStatus, setDayStatus] = useState<"open" | "closed">("closed");
  const [glCash] = useState(262400);
  const [maxVaultLimit, setMaxVaultLimit] = useState(500000);
  const [pettyLimit, setPettyLimit] = useState(25000);

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
  const glVariance = physicalTotal - glCash;

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
                Dual-custody vault cash, denomination tally vs GL 111000, and
                day open / close controls for {branch}.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:max-w-sm lg:w-auto">
            <ActionButton
              tone="amber"
              icon={<Coins className="h-4 w-4" />}
              label="Physical Cash Audit"
              bn="মুদ্রা ও নোট গণনা"
              onClick={() => setModal("audit")}
            />
            <ActionButton
              tone="slate"
              icon={<Truck className="h-4 w-4" />}
              label="Inter-Branch Transfer"
              bn="নগদ স্থানান্তর"
              onClick={() => {
                setActiveTab("transfers");
                setModal("transfer");
              }}
            />
            <ActionButton
              tone="teal"
              icon={<UserPlus className="h-4 w-4" />}
              label="Any-Branch Transact"
              bn="আন্তঃশাখা লেনদেন"
              onClick={() => {
                setActiveTab("transactions");
                setModal("anyBranch");
              }}
            />
            <ActionButton
              tone="blue"
              icon={<Save className="h-4 w-4" />}
              label={dayStatus === "open" ? "Submit Day Close" : "Day Open"}
              bn="দিন সমাপ্তি"
              onClick={() => setModal("dayClose")}
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            label="Branch Day Status"
            value={dayStatus === "open" ? "Day Open (খোলা)" : "Day Closed (বন্ধ)"}
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
            value={`${formatInr(Math.abs(variance))} (${
              Math.abs(variance) < 1 ? "Balanced" : "Review"
            })`}
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
                  <span
                    className={
                      active ? "font-normal opacity-90" : "font-normal text-muted"
                    }
                  >
                    ({tab.bn})
                  </span>
                </span>
                {"count" in tab ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      active ? "bg-white/20 text-white" : "bg-white text-slate-500"
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
                {custodians.map((item) => (
                  <SignOffCard
                    key={item.empId}
                    label={item.role}
                    name={`${item.name} (${item.empId})`}
                    note={`${item.key} · Dual lock required`}
                  />
                ))}
                <div className="flex items-start gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-3.5 py-3 text-sm text-blue-800">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Day-Open verified with Head Office clearing scroll. Physical
                    notes/coins checked against CBS GL 111000 Cash in Hand.
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
              <span
                className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                  Math.abs(glVariance) < 1
                    ? "bg-brand-soft text-brand-ink"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {Math.abs(glVariance) < 1
                  ? "Reconciled Zero Variance"
                  : `GL Variance ${formatInr(glVariance)}`}
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

            <div className="mt-4 grid gap-3 rounded-2xl border border-border bg-surface-muted/50 px-4 py-3 sm:grid-cols-3">
              <p className="text-sm font-semibold text-slate-900">
                Physical Counted: {formatInr(physicalTotal)}
              </p>
              <p className="text-sm font-semibold text-slate-900">
                GL 111000: {formatInr(glCash)}
              </p>
              <p
                className={`text-sm font-semibold ${
                  Math.abs(variance) < 1 ? "text-brand-ink" : "text-amber-700"
                }`}
              >
                Book Variance: {formatInr(variance)}
              </p>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
              <h2 className="text-sm font-semibold text-slate-900">
                Vault Limits & Controls
              </h2>
              <p className="mt-1 text-sm text-muted">
                Maximum cash retention and petty float thresholds for this
                branch vault.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-slate-700">
                    Max Vault Cash Limit
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={maxVaultLimit}
                    onChange={(event) =>
                      setMaxVaultLimit(Number(event.target.value) || 0)
                    }
                    className="w-full rounded-xl border border-border bg-white px-3 py-2.5 outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/10"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-slate-700">
                    Petty Cash Float Limit
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={pettyLimit}
                    onChange={(event) =>
                      setPettyLimit(Number(event.target.value) || 0)
                    }
                    className="w-full rounded-xl border border-border bg-white px-3 py-2.5 outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/10"
                  />
                </label>
              </div>
              <div className="btn-actions mt-4">
                <button type="button" className="btn btn-primary">
                  <Save className="h-4 w-4" />
                  Save Vault Limits
                </button>
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
              <h2 className="text-sm font-semibold text-slate-900">
                Field Wallet Hand-in Queue
              </h2>
              <p className="mt-1 text-sm text-muted">
                Cash collected in the field before branch vault credit.
              </p>
              <ul className="mt-4 space-y-2.5">
                {[
                  {
                    agent: "Sachin Shinde",
                    amount: 8420,
                    note: "Kendra #001 evening bag",
                  },
                  {
                    agent: "Deepak Dutta",
                    amount: 6150,
                    note: "Kendra #004 bag seal OK",
                  },
                ].map((item) => (
                  <li
                    key={item.agent}
                    className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface-muted/50 px-3.5 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.agent}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">{item.note}</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-emerald-700">
                      {formatInr(item.amount)}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="btn-actions mt-4">
                <button type="button" className="btn btn-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  Accept Hand-in to Vault
                </button>
              </div>
            </article>
          </section>
        </>
      ) : null}

      {activeTab === "transfers" ? (
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
                Branch Cash Transfer Tracking
              </h2>
              <p className="mt-1 text-sm text-muted">
                Track physical cash transits, currency chest allocations, and
                destination branch receipt acknowledgments
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setModal("transfer")}
            >
              <Plus className="h-4 w-4" />
              Dispatch Transfer
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-soft">
                <tr>
                  <th className="px-3 py-3">Transit ID</th>
                  <th className="px-3 py-3">Courier / Vehicle</th>
                  <th className="px-3 py-3">Escort</th>
                  <th className="px-3 py-3">Route</th>
                  <th className="px-3 py-3 text-right">Amount</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {transferRows.map((row) => (
                  <tr key={row.id} className="border-b border-border/70">
                    <td className="px-3 py-3 font-semibold text-slate-900">
                      {row.id}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-800">{row.courier}</p>
                      <p className="text-xs text-muted">{row.vehicle}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-800">{row.escort}</p>
                      <p className="text-xs text-muted">{row.escortId}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {row.from} → {row.to}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-900">
                      {formatInr(row.amount)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          row.status === "Reconciled"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {row.status === "Reconciled" ? "✓ Reconciled" : row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === "transactions" ? (
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
                Any-Branch Customer Service Register
              </h2>
              <p className="mt-1 text-sm text-muted">
                Cross-branch walk-in loan installments, Bachat Gat deposits, and
                automated inter-branch clearing settlements
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setModal("anyBranch")}
            >
              <Plus className="h-4 w-4" />
              Process & Post
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-soft">
                <tr>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Home / Serving</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Mode</th>
                  <th className="px-3 py-3 text-right">Amount</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {anyBranchRows.map((row) => (
                  <tr key={row.customer + row.type} className="border-b border-border/70">
                    <td className="px-3 py-3">
                      <p className="font-semibold text-slate-900">{row.customer}</p>
                      <p className="text-xs text-muted">{row.name}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      <p>{row.homeBranch}</p>
                      <p className="text-xs text-muted">Serving: {row.serving}</p>
                    </td>
                    <td className="px-3 py-3">{row.type}</td>
                    <td className="px-3 py-3">{row.mode}</td>
                    <td className="px-3 py-3 text-right font-semibold">
                      {formatInr(row.amount)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          row.status === "Posted"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {modal ? (
        <ModalShell
          title={
            modal === "audit"
              ? "Physical Cash Audit (মুদ্রা ও নোট গণনা)"
              : modal === "transfer"
                ? "Inter-Branch Cash Dispatch"
                : modal === "anyBranch"
                  ? "Any-Branch Customer Service"
                  : "Branch Day Close"
          }
          onClose={() => setModal(null)}
        >
          {modal === "audit" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted">
                Dual-custody verification of physical notes/coins vs CBS General
                Ledger Cash in Hand (GL 111000).
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {denominationDefs.map((item, index) => (
                  <label
                    key={item.label}
                    className="rounded-xl border border-border bg-surface-muted/50 p-3 text-sm"
                  >
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <input
                      type="number"
                      min={0}
                      value={counts[index]}
                      onChange={(event) =>
                        updateCount(index, Number(event.target.value) || 0)
                      }
                      className="mt-2 w-full rounded-lg border border-border bg-white px-2.5 py-2 outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/10"
                    />
                  </label>
                ))}
              </div>
              <div className="rounded-xl bg-blue-50 px-3.5 py-3 text-sm text-blue-800">
                Physical total {formatInr(physicalTotal)} · GL {formatInr(glCash)} ·
                Variance {formatInr(glVariance)}
                {Math.abs(glVariance) < 1
                  ? " — Auto-Contra not required"
                  : " — Auto-Contra Voucher may post"}
              </div>
              <div className="btn-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setModal(null)}
                >
                  Confirm Audit
                </button>
              </div>
            </div>
          ) : null}

          {modal === "transfer" ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Destination Branch">
                  <select className={fieldInputClass}>
                    <option>Sonarpur Branch</option>
                    <option>Barasat Branch</option>
                    <option>Halisahar Branch</option>
                  </select>
                </Field>
                <Field label="Transfer Amount (₹)">
                  <input
                    type="number"
                    defaultValue={50000}
                    className={fieldInputClass}
                  />
                </Field>
                <Field label="Courier / Vehicle">
                  <input
                    defaultValue="Payel Chakraborty · WB-52-T-4410"
                    className={fieldInputClass}
                  />
                </Field>
                <Field label="Field Escort">
                  <input
                    defaultValue="Subhashish Roy · WB-02-AX-8912"
                    className={fieldInputClass}
                  />
                </Field>
              </div>
              <p className="text-xs text-muted">
                Enter note count to verify physical cash against transaction
                amount before dispatch.
              </p>
              <div className="btn-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setModal(null)}
                >
                  Dispatch Transfer
                </button>
              </div>
            </div>
          ) : null}

          {modal === "anyBranch" ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Serving Branch">
                  <input
                    value={branch}
                    readOnly
                    className={`${fieldInputClass} bg-surface-muted`}
                  />
                </Field>
                <Field label="Customer ID">
                  <input defaultValue="CUST-WB-0006" className={fieldInputClass} />
                </Field>
                <Field label="Transaction Type">
                  <select className={fieldInputClass}>
                    <option>Loan EMI</option>
                    <option>Bachat Gat Deposit</option>
                    <option>Savings Withdrawal</option>
                  </select>
                </Field>
                <Field label="Amount (₹)">
                  <input
                    type="number"
                    defaultValue={3500}
                    className={fieldInputClass}
                  />
                </Field>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-soft">
                  Payment Mode · Hotkeys F1–F5
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {["Cash", "Cheque/DD", "NEFT/IMPS", "A/c Transfer", "UPI"].map(
                    (mode) => (
                      <button
                        key={mode}
                        type="button"
                        className="rounded-xl border border-border bg-surface-muted px-2 py-2.5 text-xs font-semibold text-slate-700 hover:bg-white"
                      >
                        {mode}
                      </button>
                    ),
                  )}
                </div>
              </div>
              <div className="btn-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setModal(null)}
                >
                  Process & Post
                </button>
              </div>
            </div>
          ) : null}

          {modal === "dayClose" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted">
                {dayStatus === "open"
                  ? "Confirm physical tally, dual-custody sign-off, and submit branch day close to Head Office."
                  : "Open the branch day to unlock vault postings, field hand-in, and any-branch services."}
              </p>
              <div className="rounded-xl border border-border bg-surface-muted/60 px-3.5 py-3 text-sm">
                <p>
                  Physical: <strong>{formatInr(physicalTotal)}</strong>
                </p>
                <p className="mt-1">
                  Book balance: <strong>{formatInr(currentBalance)}</strong>
                </p>
                <p className="mt-1">
                  GL 111000: <strong>{formatInr(glCash)}</strong>
                </p>
              </div>
              <div className="btn-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setDayStatus((prev) => (prev === "open" ? "closed" : "open"));
                    setModal(null);
                  }}
                >
                  {dayStatus === "open" ? "Submit Day Close" : "Confirm Day Open"}
                </button>
              </div>
            </div>
          ) : null}
        </ModalShell>
      ) : null}
    </div>
  );
}

function ActionButton({
  tone,
  icon,
  label,
  bn,
  onClick,
}: {
  tone: "amber" | "slate" | "teal" | "blue";
  icon: ReactNode;
  label: string;
  bn: string;
  onClick: () => void;
}) {
  const tones = {
    amber: "bg-amber-600 hover:bg-amber-700",
    slate: "bg-slate-600 hover:bg-slate-700",
    teal: "bg-teal-600 hover:bg-teal-700",
    blue: "bg-blue-600 hover:bg-blue-700",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${tones[tone]}`}
    >
      {icon}
      <span className="text-left">
        {label} <span className="font-normal opacity-90">({bn})</span>
      </span>
    </button>
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
  const titleColor = tone === "green" ? "text-emerald-800" : "text-rose-700";
  const totalColor = tone === "green" ? "text-emerald-700" : "text-rose-600";
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

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface p-4 shadow-xl sm:p-5"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-muted hover:text-slate-800"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

const fieldInputClass =
  "w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/10";
