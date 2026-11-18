"use client";

import { useMemo, useState, type ReactNode } from "react";
import { BadgeIndianRupee, RotateCcw, Send } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Form";
import { controlClass } from "@/components/ui/Input";
import { isEdited, parseAmount, type AmountMap } from "../interest-posting.rules";
import type { InterestRow } from "../types/interest-posting.types";
import { useInterestFormat } from "./useInterestFormat";

type InterestRowsTableProps = {
  rows: InterestRow[];
  amounts: AmountMap;
  onAmountChange: (accountId: number, value: string) => void;
  title: string;
  description: string;
  actions?: ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle: string;
  emptyMessage: string;
  selection?: { selectedKeys: string[]; onSelectionChange: (keys: string[]) => void };
  paginate?: boolean;
};

export function InterestRowsTable({
  rows,
  amounts,
  onAmountChange,
  title,
  description,
  actions,
  loading,
  error,
  onRetry,
  emptyTitle,
  emptyMessage,
  selection,
  paginate,
}: InterestRowsTableProps) {
  const { t, money, date, percent } = useInterestFormat();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const lastPage = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, lastPage);
  const visible = paginate ? rows.slice((safePage - 1) * pageSize, safePage * pageSize) : rows;

  const columns: DataTableColumn<InterestRow>[] = [
    {
      id: "account",
      header: t("columns.account"),
      cell: (row) => (
        <span className="block min-w-0">
          <span className="block font-semibold text-foreground">{row.fullAccountNo || row.applNo || t("dash")}</span>
          <span className="block truncate text-xs text-muted">{row.holderName || t("dash")}</span>
        </span>
      ),
    },
    {
      id: "scheme",
      header: t("columns.scheme"),
      cell: (row) => (
        <span className="block">
          <span className="block text-foreground">{row.schemeName || t("dash")}</span>
          <span className="block text-xs text-muted">
            {t("columns.rateMethod", { rate: percent(row.roi), method: row.inttTypeDesc || t("dash") })}
          </span>
        </span>
      ),
    },
    { id: "balance", header: t("columns.balance"), align: "end", cell: (row) => money(row.balance) },
    {
      id: "period",
      header: t("columns.period"),
      cell: (row) =>
        row.days > 0 ? (
          <span className="block whitespace-nowrap">
            <span className="block">{t("columns.periodRange", { from: date(row.fromDate), to: date(row.toDate) })}</span>
            <span className="block text-xs text-muted">{t("columns.days", { count: row.days })}</span>
          </span>
        ) : (
          <Badge tone="neutral" caps={false}>
            {row.lastPostedDate
              ? t("columns.upToDate", { date: date(row.lastPostedDate) })
              : t("columns.notDue")}
          </Badge>
        ),
    },
    { id: "product", header: t("columns.product"), align: "end", cell: (row) => money(row.productAmount) },
    {
      id: "calculated",
      header: t("columns.calculated"),
      align: "end",
      cell: (row) => <span className="font-medium text-foreground">{money(row.calculatedInterest)}</span>,
    },
    {
      id: "interest",
      header: t("columns.interest"),
      align: "end",
      cell: (row) => {
        const raw = amounts[row.accountId] ?? "";
        const invalid = parseAmount(raw) == null;
        const edited = !invalid && isEdited(row, raw);
        return (
          <span className="flex items-center justify-end gap-1.5">
            <input autoComplete="off"
              type="text"
              inputMode="decimal"
              value={raw}
              disabled={row.days <= 0}
              aria-label={t("columns.interestFor", { account: row.fullAccountNo || row.applNo })}
              aria-invalid={invalid}
              onChange={(event) => onAmountChange(row.accountId, event.target.value.replace(/[^\d.]/g, ""))}
              className={`${controlClass} h-9 w-32 py-1.5 text-end tabular-nums ${
                invalid ? "border-danger focus:border-danger" : edited ? "border-amber-400 bg-amber-50" : ""
              }`}
            />
            {edited ? (
              <button
                type="button"
                onClick={() => onAmountChange(row.accountId, row.calculatedInterest.toFixed(2))}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                aria-label={t("columns.resetAmount")}
                title={t("columns.resetAmount")}
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              </button>
            ) : (
              <span className="h-7 w-7 shrink-0" aria-hidden />
            )}
          </span>
        );
      },
    },
  ];

  return (
    <DataTable
      title={title}
      description={description}
      actions={actions}
      data={visible}
      columns={columns}
      getRowKey={(row) => String(row.accountId)}
      loading={loading}
      error={Boolean(error)}
      errorMessage={error ?? undefined}
      onRetry={onRetry}
      emptyTitle={emptyTitle}
      emptyMessage={emptyMessage}
      minWidth="1080px"
      selection={
        selection
          ? { getRowKey: (row) => String(row.accountId), ...selection }
          : undefined
      }
      pagination={
        paginate && rows.length > 0
          ? {
              page: safePage,
              pageSize,
              total: rows.length,
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
  );
}

type InterestPostSummaryProps = {
  rows: InterestRow[];
  amounts: AmountMap;
  remarks: string;
  onRemarksChange: (value: string) => void;
  posting: boolean;
  onPost: () => void;
};

export function InterestPostSummary({ rows, amounts, remarks, onRemarksChange, posting, onPost }: InterestPostSummaryProps) {
  const { t, money } = useInterestFormat();

  const summary = useMemo(() => {
    let calculated = 0;
    let toPost = 0;
    let invalid = 0;
    let edited = 0;
    for (const row of rows) {
      calculated += row.calculatedInterest;
      const amount = parseAmount(amounts[row.accountId]);
      if (amount == null) invalid += 1;
      else toPost += amount;
      if (isEdited(row, amounts[row.accountId])) edited += 1;
    }
    return { calculated, posting: toPost, invalid, edited };
  }, [amounts, rows]);

  const needsReason = summary.edited > 0 && remarks.trim() === "";
  const disabled = rows.length === 0 || summary.invalid > 0 || needsReason;

  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(
          [
            ["accounts", t("summary.accountCount", { count: rows.length })],
            ["calculated", money(summary.calculated)],
            ["posting", money(summary.posting)],
            ["edited", t("summary.editedCount", { count: summary.edited })],
          ] as const
        ).map(([key, value]) => (
          <div key={key} className="min-w-0 rounded-xl bg-surface-muted px-3 py-2.5">
            <p className="text-xs text-muted">{t(`summary.${key}`)}</p>
            <p className={`truncate text-base font-semibold ${key === "posting" ? "text-emerald-700" : "text-foreground"}`}>
              {value}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <TextAreaField
          label={t("summary.remarks")}
          value={remarks}
          onChange={onRemarksChange}
          rows={3}
          maxLength={250}
          required={summary.edited > 0}
          placeholder={t("summary.remarksPlaceholder")}
          error={needsReason ? t("summary.remarksRequired") : undefined}
          validate={(value) =>
            summary.edited > 0 && value.trim() === "" ? t("summary.remarksRequired") : undefined
          }
          hint={summary.edited > 0 ? undefined : t("summary.remarksHint")}
        />
      </div>
      <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {summary.invalid > 0 ? (
          <p className="flex items-center gap-1.5 text-xs text-danger" role="alert">
            <BadgeIndianRupee className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {t("summary.invalidAmounts", { count: summary.invalid })}
          </p>
        ) : (
          <span />
        )}
        <Button type="button" variant="success" icon={Send} loading={posting} disabled={disabled} onClick={onPost}>
          {t("summary.post")}
        </Button>
      </div>
    </section>
  );
}
