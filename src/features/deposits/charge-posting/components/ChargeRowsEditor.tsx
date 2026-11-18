"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, BadgeIndianRupee, MinusCircle, RotateCcw } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Form";
import { controlClass } from "@/components/ui/Input";
import { chargeLine, isChargeEdited, parseAmount, type ChargeAmountMap } from "../charge-posting.rules";
import type { ChargeRow } from "../types/charge-posting.types";
import { useChargeFormat } from "./useChargeFormat";

type ChargeRowsTableProps = {
  rows: ChargeRow[];
  amounts: ChargeAmountMap;
  onAmountChange: (rowKey: string, value: string) => void;
  selectedKeys: string[];
  onSelectionChange: (keys: string[]) => void;
  shortAccountIds: Set<number>;
  showAccount: boolean;
  title: string;
  description: string;
  actions?: ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle: string;
  emptyMessage: string;
  paginate?: boolean;
};

export function ChargeRowsTable({
  rows,
  amounts,
  onAmountChange,
  selectedKeys,
  onSelectionChange,
  shortAccountIds,
  showAccount,
  title,
  description,
  actions,
  loading,
  error,
  onRetry,
  emptyTitle,
  emptyMessage,
  paginate,
}: ChargeRowsTableProps) {
  const { t, money, date, percent, basis } = useChargeFormat();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys]);

  const lastPage = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, lastPage);
  const visible = paginate ? rows.slice((safePage - 1) * pageSize, safePage * pageSize) : rows;

  const accountColumns: DataTableColumn<ChargeRow>[] = showAccount
    ? [
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
          id: "available",
          header: t("columns.available"),
          align: "end",
          cell: (row) => (
            <span className="block">
              <span className="block">{money(row.availableBalance)}</span>
              <span className="block text-xs text-muted">{row.schemeName || t("dash")}</span>
            </span>
          ),
        },
      ]
    : [];

  const columns: DataTableColumn<ChargeRow>[] = [
    ...accountColumns,
    {
      id: "charge",
      header: t("columns.charge"),
      cell: (row) => (
        <span className="block">
          <span className="block font-medium text-foreground">{row.chargeName || t("dash")}</span>
          <span className="block text-xs text-muted">{basis(row)}</span>
        </span>
      ),
    },
    {
      id: "frequency",
      header: t("columns.frequency"),
      cell: (row) => (
        <span className="block">
          <span className="block text-foreground">{row.duringDesc || t("dash")}</span>
          {row.chargedThisPeriod ? (
            <Badge tone="warning" caps={false}>
              {t("columns.chargedThisPeriod")}
            </Badge>
          ) : (
            <span className="block text-xs text-muted">
              {row.lastChargedDate ? t("columns.lastCharged", { date: date(row.lastChargedDate) }) : t("columns.neverCharged")}
            </span>
          )}
        </span>
      ),
    },
    {
      id: "calculated",
      header: t("columns.calculated"),
      align: "end",
      cell: (row) => <span className="font-medium text-foreground">{money(row.calculatedAmount)}</span>,
    },
    {
      id: "amount",
      header: t("columns.amount"),
      align: "end",
      cell: (row) => {
        const raw = amounts[row.rowKey] ?? "";
        const invalid = parseAmount(raw) == null;
        const edited = !invalid && isChargeEdited(row, raw);
        return (
          <span className="flex items-center justify-end gap-1.5">
            <input autoComplete="off"
              type="text"
              inputMode="decimal"
              value={raw}
              aria-label={t("columns.amountFor", {
                charge: row.chargeName,
                account: row.fullAccountNo || row.applNo,
              })}
              aria-invalid={invalid}
              onChange={(event) => onAmountChange(row.rowKey, event.target.value.replace(/[^\d.]/g, ""))}
              className={`${controlClass} h-9 w-32 py-1.5 text-end tabular-nums ${
                invalid ? "border-danger focus:border-danger" : edited ? "border-amber-400 bg-amber-50" : ""
              }`}
            />
            {edited ? (
              <button
                type="button"
                onClick={() => onAmountChange(row.rowKey, row.calculatedAmount.toFixed(2))}
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
    {
      id: "tax",
      header: t("columns.tax"),
      align: "end",
      cell: (row) => {
        const line = chargeLine(row, amounts[row.rowKey]);
        return (
          <span className="block whitespace-nowrap">
            <span className="block">{money(line?.tax ?? null)}</span>
            <span className="block text-xs text-muted">{t("columns.taxRate", { rate: percent(row.taxPercent) })}</span>
          </span>
        );
      },
    },
    {
      id: "total",
      header: t("columns.total"),
      align: "end",
      cell: (row) => {
        const line = chargeLine(row, amounts[row.rowKey]);
        const short = selectedSet.has(row.rowKey) && shortAccountIds.has(row.accountId);
        return (
          <span className="block whitespace-nowrap">
            <span className={`block font-semibold ${short ? "text-danger" : "text-foreground"}`}>{money(line?.total ?? null)}</span>
            {short ? <span className="block text-xs text-danger">{t("columns.short")}</span> : null}
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
      getRowKey={(row) => row.rowKey}
      loading={loading}
      error={Boolean(error)}
      errorMessage={error ?? undefined}
      onRetry={onRetry}
      emptyTitle={emptyTitle}
      emptyMessage={emptyMessage}
      minWidth={showAccount ? "1180px" : "920px"}
      selection={{ getRowKey: (row) => row.rowKey, selectedKeys, onSelectionChange }}
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

type ChargePostSummaryProps = {
  rows: ChargeRow[];
  amounts: ChargeAmountMap;
  shortCount: number;
  remarks: string;
  onRemarksChange: (value: string) => void;
  posting: boolean;
  onPost: () => void;
};

export function ChargePostSummary({
  rows,
  amounts,
  shortCount,
  remarks,
  onRemarksChange,
  posting,
  onPost,
}: ChargePostSummaryProps) {
  const { t, money } = useChargeFormat();

  const summary = useMemo(() => {
    let charge = 0;
    let tax = 0;
    let invalid = 0;
    let edited = 0;
    let repeated = 0;
    for (const row of rows) {
      const line = chargeLine(row, amounts[row.rowKey]);
      if (!line || line.charge <= 0) invalid += 1;
      else {
        charge += line.charge;
        tax += line.tax;
      }
      if (isChargeEdited(row, amounts[row.rowKey])) edited += 1;
      if (row.chargedThisPeriod) repeated += 1;
    }
    return { charge, tax, total: charge + tax, invalid, edited, repeated };
  }, [amounts, rows]);

  const reasonRequired = summary.edited > 0 || summary.repeated > 0;
  const needsReason = reasonRequired && remarks.trim() === "";
  const disabled = rows.length === 0 || summary.invalid > 0 || shortCount > 0 || needsReason;

  const warnings = [
    summary.invalid > 0 ? { icon: BadgeIndianRupee, text: t("summary.invalidAmounts", { count: summary.invalid }), danger: true } : null,
    shortCount > 0 ? { icon: MinusCircle, text: t("summary.shortAccounts", { count: shortCount }), danger: true } : null,
    summary.repeated > 0 ? { icon: AlertTriangle, text: t("summary.alreadyCharged", { count: summary.repeated }), danger: false } : null,
  ].filter((item) => item != null);

  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(
          [
            ["charges", t("summary.chargeCount", { count: rows.length })],
            ["chargeTotal", money(summary.charge)],
            ["taxTotal", money(summary.tax)],
            ["total", money(summary.total)],
          ] as const
        ).map(([key, value]) => (
          <div key={key} className="min-w-0 rounded-xl bg-surface-muted px-3 py-2.5">
            <p className="text-xs text-muted">{t(`summary.${key}`)}</p>
            <p className={`truncate text-base font-semibold ${key === "total" ? "text-rose-700" : "text-foreground"}`}>
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
          required={reasonRequired}
          placeholder={t("summary.remarksPlaceholder")}
          error={needsReason ? t("summary.remarksRequired") : undefined}
          validate={(value) => (reasonRequired && value.trim() === "" ? t("summary.remarksRequired") : undefined)}
          hint={reasonRequired ? undefined : t("summary.remarksHint")}
        />
      </div>
      <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-end sm:justify-between">
        {warnings.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {warnings.map(({ icon: Icon, text, danger }) => (
              <li
                key={text}
                className={`flex items-center gap-1.5 text-xs ${danger ? "text-danger" : "text-amber-700"}`}
                role={danger ? "alert" : undefined}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        ) : (
          <span />
        )}
        <Button type="button" variant="danger" icon={MinusCircle} loading={posting} disabled={disabled} onClick={onPost}>
          {t("summary.post")}
        </Button>
      </div>
    </section>
  );
}
