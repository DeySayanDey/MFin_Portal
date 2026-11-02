"use client";

import { useEffect, useMemo, useState } from "react";
import { BookMarked, Landmark, PiggyBank, Search } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { SectionTabs } from "@/components/shared/SectionTabs";
import { Alert } from "@/components/ui/Alert";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { CheckboxField, DateField, SelectField } from "@/components/ui/Form";
import { parseYmd } from "@/features/deposits/savings/deposit-account.rules";
import {
  SAVINGS_DEPOSIT_TYPE,
  TERM_DEPOSIT_TYPE,
} from "@/features/deposits/savings/deposit-account.constants";
import {
  fetchDepositAccounts,
  isDepositAccountClientError,
} from "@/features/deposits/savings/services/deposit-account-client";
import type { DepositAccount } from "@/features/deposits/savings/types/deposit-account.types";
import {
  fetchSavingsTransactions,
  isSavingsTransactionClientError,
} from "@/features/deposits/savings-transaction/services/savings-transaction-client";
import {
  STATUS_PENDING,
  STATUS_POSTED,
  STATUS_REJECTED,
  TRANS_MODES,
  TRANS_WITHDRAWAL,
  type TransMode,
} from "@/features/deposits/savings-transaction/savings-transaction.constants";
import type { SavingsTransaction } from "@/features/deposits/savings-transaction/types/savings-transaction.types";

type LedgerTab = "savings" | "term";

function statusTone(statusCd: number): BadgeTone {
  if (statusCd === STATUS_POSTED) return "success";
  if (statusCd === STATUS_PENDING) return "warning";
  if (statusCd === STATUS_REJECTED) return "danger";
  return "neutral";
}

export function DepositsMemberLedgerView() {
  const t = useTranslations("deposits.memberLedger");
  const tTxn = useTranslations("deposits.savingsTransaction");
  const format = useFormatter();
  const [tab, setTab] = useState<LedgerTab>("savings");
  const [keyword, setKeyword] = useState("");
  const [accounts, setAccounts] = useState<DepositAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [rows, setRows] = useState<SavingsTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [includePending, setIncludePending] = useState(false);
  const [sort, setSort] = useState<"asc" | "desc">("desc");
  const [txnLoading, setTxnLoading] = useState(false);
  const [txnError, setTxnError] = useState<string | null>(null);
  const [savingsCount, setSavingsCount] = useState(0);
  const [termCount, setTermCount] = useState(0);

  const depositTypeCd = tab === "term" ? TERM_DEPOSIT_TYPE : SAVINGS_DEPOSIT_TYPE;
  const account = accounts.find((row) => row.accountId === accountId) ?? null;
  const dateError = Boolean(fromDate && toDate && toDate < fromDate);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setAccountsLoading(true);
      setAccountsError(null);
      fetchDepositAccounts({
        page: 1,
        perPage: 50,
        depositTypeCd,
        search: keyword.trim() || undefined,
      })
        .then((result) => {
          if (cancelled) return;
          const items = result.items ?? [];
          setAccounts(items);
          if (tab === "term") setTermCount(result.meta?.total ?? items.length);
          else setSavingsCount(result.meta?.total ?? items.length);
          setAccountId((current) =>
            current != null && items.some((row) => row.accountId === current)
              ? current
              : (items[0]?.accountId ?? null),
          );
          setPage(1);
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          setAccounts([]);
          setAccountId(null);
          setAccountsError(
            isDepositAccountClientError(error) ? error.message : t("loadError"),
          );
        })
        .finally(() => {
          if (!cancelled) setAccountsLoading(false);
        });
    }, keyword.trim() ? 350 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [depositTypeCd, keyword, t, tab]);

  useEffect(() => {
    if (accountId == null || dateError) {
      setRows([]);
      setTotal(0);
      setTxnLoading(false);
      return;
    }
    let cancelled = false;
    setTxnLoading(true);
    setTxnError(null);
    fetchSavingsTransactions({
      accountId,
      depositTypeCd,
      page,
      perPage: pageSize,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      statusCd: includePending ? undefined : STATUS_POSTED,
    })
      .then((result) => {
        if (cancelled) return;
        setRows(result.items ?? []);
        setTotal(result.meta?.total ?? result.items?.length ?? 0);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setRows([]);
        setTotal(0);
        setTxnError(
          isSavingsTransactionClientError(error) ? error.message : t("loadError"),
        );
      })
      .finally(() => {
        if (!cancelled) setTxnLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accountId, dateError, depositTypeCd, fromDate, includePending, page, pageSize, t, toDate]);

  const money = (value: number | null | undefined) =>
    value == null
      ? t("dash")
      : format.number(value, {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  const visibleRows = useMemo(() => {
    const next = [...rows];
    next.sort((left, right) => {
      const byDate = left.transDate.localeCompare(right.transDate);
      const compared = byDate !== 0 ? byDate : left.transId - right.transId;
      return sort === "asc" ? compared : -compared;
    });
    return next;
  }, [rows, sort]);

  const columns = useMemo<DataTableColumn<SavingsTransaction>[]>(
    () => [
      {
        id: "transNo",
        header: tTxn("table.transNo"),
        cell: (row) => row.transNo || String(row.transId),
      },
      {
        id: "account",
        header: tTxn("table.account"),
        cell: (row) => (
          <span className="block min-w-0">
            <span className="block truncate font-medium text-slate-900">
              {row.holderName || row.applNo || t("dash")}
            </span>
            <span className="block truncate text-xs text-muted">
              {row.schemeCode || row.schemeName || t("dash")}
            </span>
          </span>
        ),
      },
      {
        id: "type",
        header: tTxn("table.type"),
        cell: (row) =>
          row.transTypeDesc ||
          (row.transTypeCd === TRANS_WITHDRAWAL ? tTxn("types.2") : tTxn("types.1")),
      },
      {
        id: "mode",
        header: tTxn("table.mode"),
        cell: (row) =>
          row.transModeDesc ||
          (TRANS_MODES.includes(row.transMode as TransMode)
            ? tTxn(`modes.${row.transMode as TransMode}`)
            : row.transMode || t("dash")),
      },
      {
        id: "amount",
        header: tTxn("table.amount"),
        align: "end",
        cell: (row) => money(row.transAmount),
      },
      {
        id: "balance",
        header: tTxn("table.balance"),
        align: "end",
        cell: (row) =>
          row.statusCd === STATUS_PENDING ? tTxn("form.sentForApproval") : money(row.balanceAfter),
      },
      {
        id: "status",
        header: tTxn("table.status"),
        cell: (row) => (
          <Badge tone={statusTone(row.statusCd)} caps={false}>
            {row.statusDesc || t("dash")}
          </Badge>
        ),
      },
      {
        id: "date",
        header: tTxn("table.date"),
        cell: (row) => {
          const parsed = parseYmd(row.transDate);
          return parsed
            ? format.dateTime(parsed, { month: "short", day: "numeric", year: "numeric" })
            : t("dash");
        },
      },
    ],
    [format, t, tTxn],
  );

  const tabs = useMemo(
    () => [
      { id: "savings" as const, title: t("savingsCount", { count: savingsCount }), icon: PiggyBank },
      { id: "term" as const, title: t("termCount", { count: termCount }), icon: Landmark },
    ],
    [savingsCount, t, termCount],
  );

  function selectTab(next: LedgerTab) {
    if (next === tab) return;
    setTab(next);
    setKeyword("");
    setAccountId(null);
    setPage(1);
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <SectionTabs tabs={tabs} activeId={tab} onChange={selectTab} label={t("tabsLabel")} layout="inline" />

      {accountsError ? <Alert tone="error">{accountsError}</Alert> : null}
      {txnError ? <Alert tone="error">{txnError}</Alert> : null}
      {dateError ? <Alert tone="error">{t("dateOrder")}</Alert> : null}

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold text-slate-900">{t("selectAccount")}</h2>
          <label className="mt-3 block text-xs font-semibold text-slate-600" htmlFor="member-ledger-search">
            {t("search.label")}
          </label>
          <div className="relative mt-1.5">
            <Search className="pointer-events-none absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="member-ledger-search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={t("search.placeholder")}
              className="w-full rounded-xl border border-border bg-surface-muted py-2.5 ps-9 pe-3 text-sm outline-none focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10"
            />
          </div>
          {accountsLoading ? <p className="mt-3 text-sm text-muted">{t("loading")}</p> : null}
          {!accountsLoading && accounts.length === 0 ? (
            <p className="mt-3 text-sm text-muted">{t("noAccounts")}</p>
          ) : null}
          <ul className="mt-3 max-h-[460px] space-y-1.5 overflow-y-auto">
            {accounts.map((row) => {
              const active = row.accountId === accountId;
              const title = row.fullAccountNo || (row.accountNo != null ? String(row.accountNo) : row.applNo);
              return (
                <li key={row.accountId}>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountId(row.accountId);
                      setPage(1);
                    }}
                    className={`w-full rounded-xl border px-3 py-2.5 text-start transition ${
                      row.isClosed ? "opacity-60" : ""
                    } ${
                      active
                        ? "border-blue-200 bg-blue-50"
                        : "border-transparent hover:border-border hover:bg-surface-muted"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-slate-900">{title || t("dash")}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {[row.holderName || row.primaryName, row.schemeName].filter(Boolean).join(" · ") || t("dash")}
                    </span>
                    <span className="mt-1 block text-xs font-semibold tabular-nums text-slate-800">
                      {money(row.currentBalance)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="flex min-w-0 flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DateField
              label={t("filters.from")}
              value={fromDate}
              max={toDate || undefined}
              onChange={(value) => {
                setFromDate(value);
                setPage(1);
              }}
            />
            <DateField
              label={t("filters.to")}
              value={toDate}
              min={fromDate || undefined}
              onChange={(value) => {
                setToDate(value);
                setPage(1);
              }}
            />
            <SelectField
              label={t("filters.sort")}
              value={sort}
              options={[
                { value: "desc", label: t("filters.newest") },
                { value: "asc", label: t("filters.passbook") },
              ]}
              onChange={(value) => setSort(value === "asc" ? "asc" : "desc")}
            />
            <CheckboxField
              label={t("filters.pending")}
              checked={includePending}
              className="self-end pb-2"
              onChange={(checked) => {
                setIncludePending(checked);
                setPage(1);
              }}
            />
          </div>
        <DataTable
          data={account ? visibleRows : []}
          columns={columns}
          getRowKey={(row) => String(row.transId)}
          getRowClassName={(row) =>
            row.statusCd === STATUS_REJECTED ? "line-through opacity-60" : undefined
          }
          loading={account != null && txnLoading}
          minWidth="880px"
          emptyTitle={account ? tTxn("table.empty") : t("selectAccount")}
          emptyMessage={account ? t("emptyMessage") : t("selectAccountHint")}
          title={
            account ? (
              <span className="inline-flex items-center gap-2">
                <BookMarked className="h-4 w-4 text-slate-500" />
                {t("accountTitle", {
                  account:
                    account.fullAccountNo ||
                    (account.accountNo != null ? String(account.accountNo) : account.applNo),
                  holder: account.holderName || account.primaryName,
                })}
              </span>
            ) : undefined
          }
          pagination={
            account
              ? {
                  page,
                  pageSize,
                  total,
                  pageSizeOptions: [20, 50, 100],
                  onPageChange: setPage,
                  onPageSizeChange: (size) => {
                    setPageSize(size);
                    setPage(1);
                  },
                }
              : undefined
          }
        />
        </div>
      </div>
    </div>
  );
}
