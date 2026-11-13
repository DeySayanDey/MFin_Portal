"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  CreditCard,
  Download,
  IndianRupee,
  Printer,
  RotateCw,
  Search,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import {
  fetchLoanAccounts,
  isLoanAccountClientError,
} from "@/features/lms/loan-accounts/services/loan-account-client";
import type { LoanAccount } from "@/features/lms/loan-accounts/types/loan-account.types";
import {
  fetchRepaymentSchedule,
  isRepaymentScheduleClientError,
} from "../services/repayment-schedule-client";
import type { LoanScheduleRow } from "../types/repayment-schedule.types";

function scheduleStatusTone(status: string): BadgeTone {
  const s = status.toLowerCase();
  if (s === "paid") return "success";
  if (s === "due" || s === "partly paid") return "warning";
  if (s === "overdue") return "danger";
  if (s === "closed") return "neutral";
  return "neutral";
}

function loanStatusTone(loan: LoanAccount): BadgeTone {
  if (loan.isNpa) return "danger";
  if (loan.isDefaulter) return "warning";
  const s = loan.statusDesc.toLowerCase();
  if (s.includes("current") || s.includes("active") || loan.statusCd === 1) {
    return "success";
  }
  if (s.includes("closed") || loan.statusCd !== 1) return "neutral";
  return "info";
}

function toCsv(rows: LoanScheduleRow[], money: (n: number) => string) {
  const header = [
    "Installment",
    "Due Date",
    "Principal",
    "Interest",
    "EMI Total",
    "Balance",
    "Paid",
    "Status",
  ];
  const lines = rows.map((row) =>
    [
      row.installmentNo,
      row.dueDate,
      money(row.principalDue),
      money(row.interestDue),
      money(row.totalDue),
      money(row.outsPrincipal),
      money(row.paidAmount),
      row.status,
    ]
      .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

export function LmsRepaymentScheduleView() {
  const t = useTranslations("loanModule.screens.repaymentSchedule");
  const format = useFormatter();

  const [accounts, setAccounts] = useState<LoanAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [schedule, setSchedule] = useState<LoanScheduleRow[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useToastText();

  const money = useCallback(
    (val: number | null | undefined) => {
      if (val == null) return t("dash");
      return format.number(val, { style: "currency", currency: "INR" });
    },
    [format, t],
  );

  const formatDate = useCallback(
    (raw: string | null | undefined) => {
      if (!raw) return t("dash");
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return raw;
      return format.dateTime(d, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    },
    [format, t],
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    setAccountsError(null);
    try {
      const res = await fetchLoanAccounts({
        page: 1,
        perPage: 100,
        statusCd: 1,
        search: debouncedQuery || undefined,
      });
      setAccounts(res.items);
      setSelectedId((prev) => {
        if (prev != null && res.items.some((a) => a.loanAccountId === prev)) {
          return prev;
        }
        return res.items[0]?.loanAccountId ?? null;
      });
    } catch (err: unknown) {
      setAccounts([]);
      setSelectedId(null);
      setAccountsError(
        isLoanAccountClientError(err)
          ? err.message
          : err instanceof Error
            ? err.message
            : t("errors.accountsFailed"),
      );
    } finally {
      setLoadingAccounts(false);
    }
  }, [debouncedQuery, t]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  const selectedLoan = useMemo(
    () => accounts.find((a) => a.loanAccountId === selectedId) ?? null,
    [accounts, selectedId],
  );

  const loadSchedule = useCallback(async () => {
    if (!selectedId) {
      setSchedule([]);
      setScheduleError(null);
      return;
    }
    setLoadingSchedule(true);
    setScheduleError(null);
    try {
      const res = await fetchRepaymentSchedule({ loanAccountId: selectedId });
      setSchedule(res.items);
    } catch (err: unknown) {
      setSchedule([]);
      setScheduleError(
        isRepaymentScheduleClientError(err)
          ? err.message
          : err instanceof Error
            ? err.message
            : t("errors.scheduleFailed"),
      );
    } finally {
      setLoadingSchedule(false);
    }
  }, [selectedId, t]);

  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);

  const paidCount = useMemo(
    () => schedule.filter((row) => row.status.toLowerCase() === "paid").length,
    [schedule],
  );
  const upcomingCount = useMemo(
    () =>
      schedule.filter((row) => {
        const s = row.status.toLowerCase();
        return s === "upcoming" || s === "due";
      }).length,
    [schedule],
  );
  const nextDueRow = useMemo(
    () =>
      schedule.find((row) => {
        const s = row.status.toLowerCase();
        return (
          s === "due" ||
          s === "overdue" ||
          s === "partly paid" ||
          s === "upcoming"
        );
      }) ?? null,
    [schedule],
  );
  const scheduledEmi = useMemo(() => {
    if (nextDueRow) return nextDueRow.totalDue;
    const paidLike = schedule.find(
      (row) => row.status.toLowerCase() === "paid",
    );
    return paidLike?.totalDue ?? null;
  }, [nextDueRow, schedule]);

  const columns = useMemo<DataTableColumn<LoanScheduleRow>[]>(
    () => [
      {
        id: "installment",
        header: t("columns.installment"),
        className: "font-semibold text-slate-900",
        cell: (row) => `#${row.installmentNo}`,
      },
      {
        id: "dueDate",
        header: t("columns.dueDate"),
        className: "text-slate-700",
        cell: (row) => formatDate(row.dueDate),
      },
      {
        id: "principal",
        header: t("columns.principal"),
        align: "end",
        className: "font-medium text-slate-800",
        cell: (row) => money(row.principalDue),
      },
      {
        id: "interest",
        header: t("columns.interest"),
        align: "end",
        className: "text-slate-600",
        cell: (row) => money(row.interestDue),
      },
      {
        id: "total",
        header: t("columns.emiTotal"),
        align: "end",
        className: "font-semibold text-slate-900",
        cell: (row) => money(row.totalDue),
      },
      {
        id: "balance",
        header: t("columns.balance"),
        align: "end",
        className: "text-slate-600",
        cell: (row) => money(row.outsPrincipal),
      },
      {
        id: "status",
        header: t("columns.status"),
        cell: (row) => (
          <Badge tone={scheduleStatusTone(row.status)} caps={false}>
            {row.status}
          </Badge>
        ),
      },
    ],
    [formatDate, money, t],
  );

  function handleExport() {
    if (!selectedLoan || schedule.length === 0) {
      setToastMessage(t("toast.nothingToExport"));
      return;
    }
    const blob = new Blob([toCsv(schedule, money)], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `repayment-schedule-${selectedLoan.refAccountNo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToastMessage(t("toast.exported"));
  }

  function handlePrint() {
    if (!selectedLoan || schedule.length === 0) {
      setToastMessage(t("toast.nothingToPrint"));
      return;
    }
    window.print();
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <PageToast message={toastMessage} />

      <div className="flex flex-wrap justify-end gap-2 print:hidden">
        <Button
          variant="secondary"
          icon={RotateCw}
          onClick={() => {
            void loadAccounts();
            void loadSchedule();
          }}
          disabled={loadingAccounts || loadingSchedule}
        >
          {t("refresh")}
        </Button>
        <Button
          variant="secondary"
          icon={Download}
          onClick={handleExport}
          disabled={!selectedLoan || schedule.length === 0}
        >
          {t("export")}
        </Button>
        <Button
          icon={Printer}
          onClick={handlePrint}
          disabled={!selectedLoan || schedule.length === 0}
        >
          {t("print")}
        </Button>
      </div>

      {selectedLoan ? (
        <div className="mb-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
            <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              <CreditCard className="h-3.5 w-3.5 text-teal-600" />
              {t("metrics.loanAccount")}
            </span>
            <p className="mt-1 truncate text-xl font-black text-slate-900">
              {selectedLoan.refAccountNo}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {selectedLoan.primaryName}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
            <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              <IndianRupee className="h-3.5 w-3.5 text-indigo-600" />
              {t("metrics.sanctioned")}
            </span>
            <p className="mt-1 text-xl font-black text-slate-900">
              {money(selectedLoan.loanAmount)}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {t("metrics.rateHint", {
                rate: format.number(selectedLoan.interestRate, {
                  maximumFractionDigits: 2,
                }),
              })}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
            <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              {t("metrics.installmentsPaid")}
            </span>
            <p className="mt-1 text-xl font-black text-emerald-700">
              {schedule.length > 0
                ? t("metrics.paidOfTotal", {
                    paid: paidCount,
                    total: schedule.length,
                  })
                : t("metrics.paidOfTotal", {
                    paid: 0,
                    total: selectedLoan.applTenure || 0,
                  })}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {t("metrics.upcomingHint", { count: upcomingCount })}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
            <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              <CalendarClock className="h-3.5 w-3.5 text-amber-600" />
              {t("metrics.scheduledEmi")}
            </span>
            <p className="mt-1 text-xl font-black text-amber-700">
              {money(scheduledEmi)}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {nextDueRow
                ? t("metrics.nextDueHint", {
                    date: formatDate(nextDueRow.dueDate),
                  })
                : t("metrics.noNextDue")}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] print:hidden">
          <h2 className="text-sm font-semibold text-slate-900">
            {t("selectLoan")}
          </h2>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
            <input autoComplete="off"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-xl border border-border bg-surface-muted py-2.5 pr-3 pl-9 text-sm outline-none focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10"
            />
          </div>

          {accountsError ? (
            <p className="mt-3 text-xs font-medium text-rose-700">
              {accountsError}
            </p>
          ) : null}

          <ul className="mt-3 max-h-[420px] space-y-1.5 overflow-y-auto scrollbar-thin">
            {loadingAccounts ? (
              <li className="px-2 py-6 text-center text-xs text-muted">
                {t("loadingAccounts")}
              </li>
            ) : accounts.length === 0 ? (
              <li className="px-2 py-6 text-center text-xs text-muted">
                {t("noAccounts")}
              </li>
            ) : (
              accounts.map((row) => (
                <li key={row.loanAccountId}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(row.loanAccountId)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                      row.loanAccountId === selectedId
                        ? "border-blue-200 bg-blue-50"
                        : "border-transparent hover:border-border hover:bg-surface-muted"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-slate-900">
                      {row.refAccountNo}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {row.primaryName}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>

        {!selectedLoan ? (
          <div className="rounded-2xl border border-border bg-surface p-8">
            <EmptyState
              title={t("emptyTitle")}
              message={t("emptyMessage")}
            />
          </div>
        ) : (
          <DataTable
            data={schedule}
            columns={columns}
            getRowKey={(row) => String(row.scheduleId || row.installmentNo)}
            minWidth="760px"
            loading={loadingSchedule}
            error={Boolean(scheduleError)}
            errorTitle={t("errors.scheduleFailed")}
            errorMessage={scheduleError ?? undefined}
            onRetry={() => {
              void loadSchedule();
            }}
            emptyTitle={t("emptyScheduleTitle")}
            emptyMessage={t("emptyScheduleMessage")}
            title={
              <span className="flex w-full flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2">
                  <CalendarRange className="h-4 w-4 text-slate-500" />
                  {t("tableTitle", { account: selectedLoan.refAccountNo })}
                </span>
                <Badge tone={loanStatusTone(selectedLoan)} caps={false}>
                  {selectedLoan.isNpa
                    ? t("status.npa")
                    : selectedLoan.isDefaulter
                      ? t("status.defaulter")
                      : selectedLoan.statusDesc || t("status.current")}
                </Badge>
              </span>
            }
            description={t("tableDescription", {
              borrower: selectedLoan.primaryName,
              branch: selectedLoan.branchName || t("dash"),
              scheme: selectedLoan.schemeName || t("dash"),
            })}
          />
        )}
      </div>
    </div>
  );
}
