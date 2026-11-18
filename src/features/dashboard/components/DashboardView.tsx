"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  CircleDollarSign,
  ClipboardList,
  FileSpreadsheet,
  HeartPulse,
  Layers,
  MapPinned,
  Percent,
  RotateCcw,
  Search,
  TrendingUp,
  UserRoundPlus,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { DashboardSkeleton } from "@/components/shared/skeletons/DashboardSkeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DateField, SelectField, TextField } from "@/components/ui/Form";
import { fetchBranchList } from "@/features/master/branch/services/branch-client";
import { todayYmd } from "@/features/deposits/savings/deposit-account.rules";
import { toneClasses } from "@/lib/nav";
import { defaultDashboardRange } from "../dashboard.rules";
import { fetchDashboard, isDashboardClientError } from "../services/dashboard-client";
import type {
  DashboardAgent,
  DashboardBranch,
  DashboardLoan,
  DashboardSnapshot,
} from "../types/dashboard.types";
import { useDashboardFormat } from "./useDashboardFormat";

const ALL = "all";

const workflows = [
  { id: "onboard", href: "/onboarding/member-registration", icon: UserRoundPlus, tone: "blue" as const },
  { id: "los", href: "/los/applications", icon: FileSpreadsheet, tone: "green" as const },
  { id: "lms", href: "/lms/disbursement", icon: ClipboardList, tone: "amber" as const },
  { id: "collection", href: "/lms/collections", icon: MapPinned, tone: "violet" as const },
] as const;

type Filters = { fromDate: string; toDate: string; branchId: string };

type DashboardViewProps = {
  canPickBranch: boolean;
};

export function DashboardView({ canPickBranch }: DashboardViewProps) {
  const { t, money, integer, percent, date } = useDashboardFormat();
  const tCommon = useTranslations("common");
  const [today] = useState(() => todayYmd());
  const [defaults] = useState(() => defaultDashboardRange());
  const [filters, setFilters] = useState<Filters>({
    fromDate: defaults.fromDate,
    toDate: defaults.toDate,
    branchId: ALL,
  });
  const [applied, setApplied] = useState<Filters>({
    fromDate: defaults.fromDate,
    toDate: defaults.toDate,
    branchId: ALL,
  });
  const [reloadKey, setReloadKey] = useState(0);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loanQuery, setLoanQuery] = useState("");
  const [branches, setBranches] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    if (!canPickBranch) return;
    let cancelled = false;
    fetchBranchList({ page: 1, perPage: 200, isActive: 1 })
      .then((result) => {
        if (!cancelled) {
          setBranches(result.items.map((branch) => ({ value: String(branch.branchId), label: branch.branchName })));
        }
      })
      .catch(() => {
        if (!cancelled) setBranches([]);
      });
    return () => {
      cancelled = true;
    };
  }, [canPickBranch]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchDashboard(
      {
        fromDate: applied.fromDate,
        toDate: applied.toDate,
        branchId: applied.branchId === ALL ? undefined : Number(applied.branchId),
      },
      reloadKey,
    )
      .then((result) => {
        if (!cancelled) setSnapshot(result);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setSnapshot(null);
        setError(isDashboardClientError(reason) ? reason.message : t("loadFailed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applied, reloadKey, t]);

  const kpis = snapshot?.kpis;
  const funds = snapshot?.funds;
  const agents = snapshot?.agents ?? [];
  const branchRows = snapshot?.branches ?? [];
  const loans = snapshot?.loans ?? [];

  const filteredLoans = useMemo(() => {
    const needle = loanQuery.trim().toLowerCase();
    if (!needle) return loans;
    return loans.filter((row) =>
      [row.loanAccountNo, row.borrower, row.groupName, row.statusDesc].join(" ").toLowerCase().includes(needle),
    );
  }, [loanQuery, loans]);

  function apply(event: FormEvent) {
    event.preventDefault();
    if (!filters.fromDate || !filters.toDate || filters.fromDate > filters.toDate) return;
    setApplied({ ...filters });
    setReloadKey((key) => key + 1);
  }

  function reset() {
    const next = { fromDate: defaults.fromDate, toDate: defaults.toDate, branchId: ALL };
    setFilters(next);
    setApplied(next);
    setLoanQuery("");
    setReloadKey((key) => key + 1);
  }

  const metricCards = [
    {
      id: "glp",
      value: money(kpis?.glp ?? 0),
      hint: t("kpis.glpHint", { savings: money(kpis?.savingsBalance ?? 0) }),
      accent: "bg-brand",
      icon: CircleDollarSign,
      iconTone: "text-brand bg-brand-soft",
    },
    {
      id: "disbursed",
      value: money(kpis?.disbursed ?? 0),
      hint: t("kpis.disbursedHint", { collection: money(kpis?.collection ?? 0) }),
      accent: "bg-accent-blue",
      icon: TrendingUp,
      iconTone: "text-accent-blue bg-accent-blue-soft",
    },
    {
      id: "par",
      value: percent(kpis?.par90Percent ?? 0),
      hint: t("kpis.parHint", { npa: percent(kpis?.npaPercent ?? 0) }),
      accent: "bg-accent-amber",
      icon: Percent,
      iconTone: "text-amber-700 bg-accent-amber-soft",
    },
    {
      id: "groups",
      value: integer(kpis?.activeGroups ?? 0),
      hint: t("kpis.groupsHint", {
        members: integer(kpis?.activeMembers ?? 0),
        pending: integer(kpis?.pendingApplications ?? 0),
      }),
      accent: "bg-accent-violet",
      icon: Users,
      iconTone: "text-accent-violet bg-accent-violet-soft",
    },
  ] as const;

  const agentColumns: DataTableColumn<DashboardAgent>[] = [
    { id: "name", header: t("agents.columns.name"), cell: (row) => row.staffName || t("dash") },
    {
      id: "groups",
      header: t("agents.columns.groups"),
      cell: (row) => t("agents.groupCount", { count: row.groupCount }),
    },
    { id: "target", header: t("agents.columns.target"), align: "end", cell: (row) => money(row.target) },
    { id: "collected", header: t("agents.columns.collected"), align: "end", cell: (row) => money(row.collected) },
    { id: "wallet", header: t("agents.columns.wallet"), align: "end", cell: (row) => money(row.wallet) },
    {
      id: "status",
      header: t("agents.columns.status"),
      cell: (row) => (
        <Badge tone={row.inField ? "info" : "success"} caps={false}>
          {row.inField ? t("agents.inField") : t("agents.cleared")}
        </Badge>
      ),
    },
  ];

  const branchColumns: DataTableColumn<DashboardBranch>[] = [
    { id: "name", header: t("branches.columns.name"), cell: (row) => row.branchName || t("dash") },
    { id: "loanBook", header: t("branches.columns.loanBook"), align: "end", cell: (row) => money(row.loanBook) },
    { id: "collection", header: t("branches.columns.collection"), align: "end", cell: (row) => money(row.collection) },
    { id: "vault", header: t("branches.columns.vault"), align: "end", cell: (row) => money(row.vault) },
    {
      id: "recovery",
      header: t("branches.columns.recovery"),
      cell: (row) => (
        <Badge tone="success" caps={false}>
          {row.recoveryPercent == null ? t("dash") : percent(row.recoveryPercent)}
        </Badge>
      ),
    },
  ];

  const loanColumns: DataTableColumn<DashboardLoan>[] = [
    {
      id: "account",
      header: t("loans.columns.account"),
      cell: (row) => row.loanAccountNo || t("dash"),
    },
    { id: "borrower", header: t("loans.columns.borrower"), cell: (row) => row.borrower || t("dash") },
    { id: "group", header: t("loans.columns.group"), cell: (row) => row.groupName || t("dash") },
    { id: "disbursed", header: t("loans.columns.disbursed"), align: "end", cell: (row) => money(row.disbursed) },
    { id: "paid", header: t("loans.columns.paid"), align: "end", cell: (row) => money(row.principalPaid) },
    { id: "outstanding", header: t("loans.columns.outstanding"), align: "end", cell: (row) => money(row.outstanding) },
    { id: "dpd", header: t("loans.columns.dpd"), align: "end", cell: (row) => integer(row.dpd) },
    {
      id: "status",
      header: t("loans.columns.status"),
      cell: (row) => (
        <Badge tone={row.dpd > 0 ? "warning" : "success"} caps={false}>
          {row.statusDesc || t("dash")}
        </Badge>
      ),
    },
  ];

  const dateError = filters.fromDate && filters.toDate && filters.fromDate > filters.toDate ? t("filters.rangeError") : undefined;

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <PageHeader title={t("title")} description={t("description")} />

      <form autoComplete="off"
        onSubmit={apply}
        className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5"
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <Layers className="h-4 w-4" aria-hidden />
          </span>
          <h2 className="text-sm font-semibold text-foreground">{t("filters.title")}</h2>
        </div>
        <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${canPickBranch ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
          <DateField
            label={t("filters.from")}
            value={filters.fromDate}
            max={filters.toDate || today}
            required
            onChange={(value) => setFilters((current) => ({ ...current, fromDate: value }))}
          />
          <DateField
            label={t("filters.to")}
            value={filters.toDate}
            min={filters.fromDate}
            max={today}
            required
            error={dateError}
            onChange={(value) => setFilters((current) => ({ ...current, toDate: value }))}
          />
          {canPickBranch ? (
            <SelectField
              label={t("filters.branch")}
              value={filters.branchId}
              onChange={(value) => setFilters((current) => ({ ...current, branchId: value }))}
              options={[{ value: ALL, label: t("filters.allBranches") }, ...branches]}
              searchable
            />
          ) : null}
          <div className="flex items-end gap-2">
            <Button type="submit" icon={Search} loading={loading} disabled={Boolean(dateError)} className="flex-1">
              {t("filters.apply")}
            </Button>
            <Button type="button" variant="secondary" icon={RotateCcw} onClick={reset} className="flex-1">
              {tCommon("reset")}
            </Button>
          </div>
        </div>
      </form>

      {loading && !snapshot ? (
        <DashboardSkeleton />
      ) : error && !snapshot ? (
        <section className="rounded-2xl border border-border bg-surface p-8 text-center shadow-[var(--shadow-card)]">
          <p className="text-sm font-semibold text-foreground">{t("loadFailed")}</p>
          <p className="mt-1 text-sm text-muted">{error}</p>
          <Button type="button" className="mt-4" onClick={() => setReloadKey((key) => key + 1)}>
            {tCommon("retry")}
          </Button>
        </section>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            {metricCards.map((metric) => (
              <article
                key={metric.id}
                className="relative overflow-hidden rounded-2xl border border-border bg-surface p-3.5 shadow-[var(--shadow-card)] sm:p-4"
              >
                <span className={`absolute inset-y-0 left-0 w-1 ${metric.accent}`} aria-hidden />
                <div className="flex items-start justify-between gap-3 ps-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-soft sm:text-[11px]">
                      {t(`kpis.${metric.id}`)}
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
                    <metric.icon className="h-4 w-4" aria-hidden />
                  </span>
                </div>
              </article>
            ))}
          </section>

          <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-900">{t("workflows.title")}</h2>
              <p className="mt-1 text-sm text-muted">{t("workflows.description")}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
              {workflows.map((item) => {
                const tones = toneClasses[item.tone];
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group flex flex-row items-center gap-3 rounded-2xl border border-border bg-surface-muted/60 px-4 py-4 text-left transition hover:border-brand/30 hover:bg-surface hover:shadow-[var(--shadow-card)] min-[480px]:flex-col min-[480px]:py-6 min-[480px]:text-center"
                  >
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl sm:h-14 sm:w-14 ${tones.icon} transition group-hover:scale-105`}
                    >
                      <item.icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
                    </span>
                    <span className="text-sm font-semibold text-slate-800">{t(`workflows.${item.id}`)}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(260px,320px)_1fr]">
            <article className="rounded-2xl bg-brand-dark p-4 text-white shadow-[var(--shadow-card)] sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300">{t("funds.title")}</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{money(funds?.total ?? 0)}</p>
              <ul className="mt-5 space-y-3 text-sm text-slate-300">
                <li className="flex items-center justify-between gap-3">
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                    <span className="truncate">{t("funds.cash")}</span>
                  </span>
                  <span className="shrink-0 font-medium text-white">{money(funds?.cash ?? 0)}</span>
                </li>
                <li className="flex items-center justify-between gap-3">
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-sky-400" />
                    <span className="truncate">{t("funds.bank")}</span>
                  </span>
                  <span className="shrink-0 font-medium text-white">{money(funds?.bank ?? 0)}</span>
                </li>
              </ul>
              <Link
                href="/master/account-ledgers"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/15 px-3 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/25"
              >
                {t("funds.openLedger")}
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </article>

            <DataTable
              title={t("agents.title")}
              description={t("agents.description", { from: date(applied.fromDate), to: date(applied.toDate) })}
              actions={
                <span className="rounded-full bg-accent-blue-soft px-3 py-1 text-xs font-semibold text-blue-700">
                  {t("agents.activeCount", { count: agents.filter((row) => row.inField).length })}
                </span>
              }
              data={agents}
              columns={agentColumns}
              getRowKey={(row) => String(row.staffId)}
              emptyTitle={t("agents.emptyTitle")}
              emptyMessage={t("agents.emptyMessage")}
              minWidth="720px"
            />
          </section>

          <DataTable
            title={t("branches.title")}
            description={t("branches.description")}
            actions={
              <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-slate-600">
                {t("branches.count", { count: branchRows.length })}
              </span>
            }
            data={branchRows}
            columns={branchColumns}
            getRowKey={(row) => String(row.branchId)}
            emptyTitle={t("branches.emptyTitle")}
            emptyMessage={t("branches.emptyMessage")}
            minWidth="720px"
          />

          <DataTable
            title={
              <span className="inline-flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-accent-blue" aria-hidden />
                {t("loans.title")}
              </span>
            }
            description={t("loans.description")}
            toolbar={
              <TextField
                label={t("loans.search")}
                value={loanQuery}
                onChange={setLoanQuery}
                placeholder={t("loans.searchPlaceholder")}
              />
            }
            data={filteredLoans}
            columns={loanColumns}
            getRowKey={(row) => String(row.loanAccountId)}
            emptyTitle={t("loans.emptyTitle")}
            emptyMessage={t("loans.emptyMessage")}
            minWidth="960px"
          />
        </>
      )}
    </div>
  );
}
