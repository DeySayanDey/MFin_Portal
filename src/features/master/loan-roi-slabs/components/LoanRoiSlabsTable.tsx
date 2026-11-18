"use client";

import { useMemo, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Ban, CircleCheck, Pencil } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type {
  LoanSchemeSlab,
  PaginationMeta,
} from "../types/loan-roi-slabs.types";

type LoanRoiSlabsTableProps = {
  items: LoanSchemeSlab[];
  meta: PaginationMeta | null;
  page: number;
  pageSize: number;
  loading: boolean;
  error: boolean;
  errorMessage?: string;
  statusBusyId?: number | null;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (row: LoanSchemeSlab) => void;
  onToggleActive: (row: LoanSchemeSlab) => void;
  headerActions?: ReactNode;
};

function formatWhole(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
    value,
  );
}

function formatDecimal(value: number, locale: string, digits: number): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatIsoDate(value: string, locale: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}

export function LoanRoiSlabsTable({
  items,
  meta,
  page,
  pageSize,
  loading,
  error,
  errorMessage,
  onRetry,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onToggleActive,
  statusBusyId = null,
  headerActions,
}: LoanRoiSlabsTableProps) {
  const t = useTranslations("master.loanRoiSlabs");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const columns = useMemo<DataTableColumn<LoanSchemeSlab>[]>(
    () => [
      {
        id: "scheme",
        header: t("fields.scheme"),
        cell: (row) => (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">{row.schemeName}</span>
            <span className="font-mono text-xs text-muted">{row.schemeCode}</span>
          </div>
        ),
      },
      {
        id: "amountRange",
        header: t("fields.amountRange"),
        cell: (row) => (
          <span className="font-medium text-foreground">
            {formatWhole(row.minAmount, locale)} – {formatWhole(row.maxAmount, locale)}
          </span>
        ),
      },
      {
        id: "roi",
        header: t("fields.roi"),
        cell: (row) => (
          <span className="font-bold text-foreground">
            {formatDecimal(row.roi, locale, 2)}%
          </span>
        ),
      },
      {
        id: "maxDuration",
        header: t("fields.maxDuration"),
        cell: (row) => (
          <span className="text-foreground">
            {formatWhole(row.maxDuration, locale)}
            {row.repayScheduleDesc ? ` ${row.repayScheduleDesc}` : ""}
          </span>
        ),
      },
      {
        id: "amtPer1000",
        header: t("fields.amtPer1000"),
        cell: (row) => (
          <span className="text-foreground">
            {row.amtPer1000 == null
              ? "—"
              : formatDecimal(row.amtPer1000, locale, 2)}
          </span>
        ),
      },
      {
        id: "effectFrom",
        header: t("fields.effectFrom"),
        cell: (row) => (
          <span className="text-foreground">
            {row.effectFrom ? formatIsoDate(row.effectFrom, locale) : "—"}
          </span>
        ),
      },
      {
        id: "isActive",
        header: t("fields.isActive"),
        cell: (row) => (
          <Badge tone={row.isActive ? "success" : "neutral"} caps>
            {row.isActive ? t("statusActive") : t("statusInactive")}
          </Badge>
        ),
      },
    ],
    [locale, t],
  );

  return (
    <DataTable<LoanSchemeSlab>
      title={t("tableCaption")}
      description=""
      actions={headerActions}
      data={items}
      columns={columns}
      getRowKey={(row) => String(row.id)}
      loading={loading}
      error={error}
      errorTitle={t("loadErrorTitle")}
      errorMessage={errorMessage}
      onRetry={onRetry}
      emptyTitle={t("emptyTitle")}
      emptyMessage={t("emptyMessage")}
      minWidth="1080px"
      caption={t("tableCaption")}
      rowActions={{
        header: tCommon("actions"),
        render: (row) => (
          <div className="inline-flex items-center gap-1.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Pencil}
              tooltip={t("edit")}
              onClick={() => onEdit(row)}
            />
            <Button
              type="button"
              variant={row.isActive ? "warning" : "success"}
              size="sm"
              icon={row.isActive ? Ban : CircleCheck}
              tooltip={row.isActive ? t("deactivate") : t("activate")}
              disabled={statusBusyId === row.id}
              onClick={() => onToggleActive(row)}
            />
          </div>
        ),
      }}
      pagination={{
        page,
        pageSize,
        total: meta?.total ?? items.length,
        totalPages: meta?.lastPage,
        pageSizeOptions: [20, 50, 100, 200],
        onPageChange,
        onPageSizeChange,
      }}
    />
  );
}
