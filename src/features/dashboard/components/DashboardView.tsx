import { Link } from "@/i18n/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  CircleDollarSign,
  HeartPulse,
  Percent,
  TrendingUp,
  Users,
} from "lucide-react";
import { workflowLinks, toneClasses } from "@/lib/nav";
import { DashboardSkeleton } from "@/components/shared/skeletons/DashboardSkeleton";

const metrics = [
  {
    label: "Gross Loan Portfolio",
    value: "₹33,814.66",
    hint: "100% Qualifying",
    accent: "bg-brand",
    icon: CircleDollarSign,
    iconTone: "text-brand bg-brand-soft",
  },
  {
    label: "MTD Disbursed",
    value: "₹15,400",
    hint: "Healthy Asset",
    accent: "bg-accent-blue",
    icon: TrendingUp,
    iconTone: "text-accent-blue bg-accent-blue-soft",
  },
  {
    label: "PAR 90 / NPA",
    value: "0.00%",
    hint: "Within RBI band",
    accent: "bg-accent-amber",
    icon: Percent,
    iconTone: "text-amber-700 bg-accent-amber-soft",
  },
  {
    label: "Active Kendras",
    value: "1",
    hint: "JLG coverage live",
    accent: "bg-accent-violet",
    icon: Users,
    iconTone: "text-accent-violet bg-accent-violet-soft",
  },
];

const agents = [
  {
    name: "Priya Sen",
    kendras: "#01, #02",
    target: "₹12,000",
    collected: "₹11,450",
    wallet: "₹3,200",
    status: "In Field",
    statusTone: "bg-brand-soft text-brand-ink",
  },
  {
    name: "Amit Das",
    kendras: "#03, #04",
    target: "₹10,500",
    collected: "₹9,800",
    wallet: "₹2,150",
    status: "In Field",
    statusTone: "bg-brand-soft text-brand-ink",
  },
  {
    name: "Rina Ghosh",
    kendras: "#05",
    target: "₹8,000",
    collected: "₹7,640",
    wallet: "₹1,890",
    status: "Returning to Vault",
    statusTone: "bg-accent-amber-soft text-amber-800",
  },
];

const branches = [
  {
    name: "Sonarpur",
    loanBook: "₹28,000",
    collection: "₹8,400",
    vault: "₹12,200",
    recovery: "99.2%",
  },
  {
    name: "Barasat",
    loanBook: "₹24,000",
    collection: "₹7,100",
    vault: "₹9,850",
    recovery: "98.6%",
  },
  {
    name: "Halisahar",
    loanBook: "₹19,000",
    collection: "₹5,900",
    vault: "₹6,400",
    recovery: "97.9%",
  },
];

export function DashboardView({
  loading = false,
}: {
  loading?: boolean;
} = {}) {
  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <section className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="relative overflow-hidden rounded-2xl border border-border bg-surface p-3.5 shadow-[var(--shadow-card)] sm:p-4"
          >
            <span
              className={`absolute inset-y-0 left-0 w-1 ${metric.accent}`}
              aria-hidden
            />
            <div className="flex items-start justify-between gap-3 pl-2">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-soft sm:text-[11px]">
                  {metric.label}
                </p>
                <p className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900 sm:mt-2 sm:text-2xl">
                  {metric.value}
                </p>
                <p className="mt-2 inline-flex max-w-full items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-brand" />
                  <span className="truncate">{metric.hint}</span>
                </p>
              </div>
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl sm:h-10 sm:w-10 ${metric.iconTone}`}
              >
                <metric.icon className="h-4 w-4" />
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            Core Microfinance Workflows
          </h2>
          <p className="mt-1 text-sm text-muted">
            KYC, origination, servicing, and field collection in one pass.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
          {workflowLinks.map((item) => {
            const tones = toneClasses[item.tone];
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-row items-center gap-3 rounded-2xl border border-border bg-surface-muted/60 px-4 py-4 text-left transition hover:border-brand/30 hover:bg-white hover:shadow-[var(--shadow-card)] min-[480px]:flex-col min-[480px]:py-6 min-[480px]:text-center"
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl sm:h-14 sm:w-14 ${tones.icon} transition group-hover:scale-105`}
                >
                  <item.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </span>
                <span className="text-sm font-semibold text-slate-800">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(260px,320px)_1fr]">
        <article className="rounded-2xl bg-brand-dark p-4 text-white shadow-[var(--shadow-card)] sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
            Total Liquid Funds
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            ₹78,352.63
          </p>
          <ul className="mt-5 space-y-3 text-sm text-slate-300">
            <li className="flex items-center justify-between gap-3">
              <span className="inline-flex min-w-0 items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                <span className="truncate">Cash in Hand (Vaults)</span>
              </span>
              <span className="shrink-0 font-medium text-white">₹28,450.00</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="inline-flex min-w-0 items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full bg-sky-400" />
                <span className="truncate">Bank Balances</span>
              </span>
              <span className="shrink-0 font-medium text-white">₹49,902.63</span>
            </li>
          </ul>
          <Link
            href="/accounting"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/15 px-3 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/25"
          >
            Open Full General Ledger
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </article>

        <article className="min-w-0 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900">
                Field Collection Agent Performance
              </h2>
              <p className="mt-1 text-sm text-muted">
                Live wallets before branch vault hand-in
              </p>
            </div>
            <span className="w-fit rounded-full bg-accent-blue-soft px-3 py-1 text-xs font-semibold text-blue-700">
              3 Field Agents Active
            </span>
          </div>

          <div className="space-y-3 md:hidden">
            {agents.map((agent) => (
              <div
                key={agent.name}
                className="rounded-2xl border border-border bg-surface-muted/50 p-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{agent.name}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      Kendras {agent.kendras}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${agent.statusTone}`}
                  >
                    {agent.status}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-white px-2 py-2">
                    <dt className="text-[10px] uppercase tracking-wide text-muted-soft">
                      Target
                    </dt>
                    <dd className="mt-1 font-mono text-xs font-medium text-slate-800">
                      {agent.target}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-white px-2 py-2">
                    <dt className="text-[10px] uppercase tracking-wide text-muted-soft">
                      Collected
                    </dt>
                    <dd className="mt-1 font-mono text-xs font-medium text-slate-800">
                      {agent.collected}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-white px-2 py-2">
                    <dt className="text-[10px] uppercase tracking-wide text-muted-soft">
                      Wallet
                    </dt>
                    <dd className="mt-1 font-mono text-xs font-medium text-slate-800">
                      {agent.wallet}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>

          <div className="table-scroll hidden md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-[0.12em] text-muted-soft">
                  <th className="pb-3 pr-3 font-semibold">Agent Name</th>
                  <th className="pb-3 pr-3 font-semibold">Kendras</th>
                  <th className="pb-3 pr-3 font-semibold">Today Target</th>
                  <th className="pb-3 pr-3 font-semibold">Collected</th>
                  <th className="pb-3 pr-3 font-semibold">Live Wallet</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr
                    key={agent.name}
                    className="border-b border-border/70 last:border-0"
                  >
                    <td className="py-3.5 pr-3 font-medium text-slate-900">
                      {agent.name}
                    </td>
                    <td className="py-3.5 pr-3 text-muted">{agent.kendras}</td>
                    <td className="py-3.5 pr-3 font-mono text-[13px] text-slate-700">
                      {agent.target}
                    </td>
                    <td className="py-3.5 pr-3 font-mono text-[13px] text-slate-700">
                      {agent.collected}
                    </td>
                    <td className="py-3.5 pr-3 font-mono text-[13px] text-slate-700">
                      {agent.wallet}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${agent.statusTone}`}
                      >
                        {agent.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="min-w-0 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">
              Multi-Branch Operations & Liquidity Matrix
            </h2>
            <p className="mt-1 text-sm text-muted">
              Consolidated loan volumes, daily collections, and vault balances
            </p>
          </div>
          <span className="w-fit rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-slate-600">
            3 Active Branches
          </span>
        </div>

        <div className="space-y-3 md:hidden">
          {branches.map((branch) => (
            <div
              key={branch.name}
              className="rounded-2xl border border-border bg-surface-muted/50 p-3.5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-900">{branch.name}</p>
                <span className="rounded-full border border-brand/30 bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand-ink">
                  {branch.recovery}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-white px-2 py-2">
                  <dt className="text-[10px] uppercase tracking-wide text-muted-soft">
                    Loan Book
                  </dt>
                  <dd className="mt-1 font-mono text-xs font-medium text-slate-800">
                    {branch.loanBook}
                  </dd>
                </div>
                <div className="rounded-xl bg-white px-2 py-2">
                  <dt className="text-[10px] uppercase tracking-wide text-muted-soft">
                    Collection
                  </dt>
                  <dd className="mt-1 font-mono text-xs font-medium text-slate-800">
                    {branch.collection}
                  </dd>
                </div>
                <div className="rounded-xl bg-white px-2 py-2">
                  <dt className="text-[10px] uppercase tracking-wide text-muted-soft">
                    Vault
                  </dt>
                  <dd className="mt-1 font-mono text-xs font-medium text-slate-800">
                    {branch.vault}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>

        <div className="table-scroll hidden md:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.12em] text-muted-soft">
                <th className="pb-3 pr-3 font-semibold">Branch Name</th>
                <th className="pb-3 pr-3 font-semibold">Active Loan Book</th>
                <th className="pb-3 pr-3 font-semibold">Today&apos;s Collection</th>
                <th className="pb-3 pr-3 font-semibold">Branch Vault Cash</th>
                <th className="pb-3 font-semibold">Recovery %</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr
                  key={branch.name}
                  className="border-b border-border/70 last:border-0"
                >
                  <td className="py-3.5 pr-3 font-medium text-slate-900">
                    {branch.name}
                  </td>
                  <td className="py-3.5 pr-3 font-mono text-[13px] text-slate-700">
                    {branch.loanBook}
                  </td>
                  <td className="py-3.5 pr-3 font-mono text-[13px] text-slate-700">
                    {branch.collection}
                  </td>
                  <td className="py-3.5 pr-3 font-mono text-[13px] text-slate-700">
                    {branch.vault}
                  </td>
                  <td className="py-3.5">
                    <span className="rounded-full border border-brand/30 bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand-ink">
                      {branch.recovery}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="min-w-0 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-blue-soft text-accent-blue">
              <HeartPulse className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900">
                Live Loan Portfolio Status
              </h2>
              <p className="mt-1 text-sm text-muted">
                Active accounts, outstanding balances, and installment progress
              </p>
            </div>
          </div>
          <input
            type="search"
            placeholder="Filter records..."
            className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm outline-none placeholder:text-muted-soft focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10 sm:max-w-xs sm:w-64"
          />
        </div>
        <div className="table-scroll">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.12em] text-muted-soft">
                <th className="pb-3 pr-3 font-semibold whitespace-nowrap">
                  Account No
                </th>
                <th className="pb-3 pr-3 font-semibold">Borrower</th>
                <th className="pb-3 pr-3 font-semibold whitespace-nowrap">
                  Kendra & JLG
                </th>
                <th className="pb-3 pr-3 font-semibold">Disbursed</th>
                <th className="pb-3 pr-3 font-semibold whitespace-nowrap">
                  Principal Paid
                </th>
                <th className="pb-3 pr-3 font-semibold whitespace-nowrap">
                  Outstanding GLP
                </th>
                <th className="pb-3 pr-3 font-semibold">DPD</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={8}
                  className="py-12 text-center text-sm text-muted-soft sm:py-16"
                >
                  No records found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
