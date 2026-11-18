"use client";

import { useMemo, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Ban, CircleCheck, Pencil } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type {
  LoanSchemeSetup,
  PaginationMeta,
} from "../types/loan-schemes.types";

const EMPTY = "—";

type LoanSchemeSetupTableProps = {
  items: LoanSchemeSetup[];
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
  onEdit: (row: LoanSchemeSetup) => void;
  onToggleActive: (row: LoanSchemeSetup) => void;
  headerActions?: ReactNode;
};

export function LoanSchemeSetupTable({
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
}: LoanSchemeSetupTableProps) {
  const t = useTranslations("master.loanSchemes.setup");
  const tGlobal = useTranslations("master.loanSchemes");
  const locale = useLocale();
  const numberFormat = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }),
    [locale],
  );

  const columns = useMemo<DataTableColumn<LoanSchemeSetup>[]>(
    () => [
      {
        id: "schemeCode",
        header: t("fields.schemeCode"),
        cell: (row) => (
          <span className="font-mono text-xs font-semibold text-muted">
            {row.schemeCode || EMPTY}
          </span>
        ),
      },
      {
        id: "schemeName",
        header: t("fields.schemeName"),
        cell: (row) => (
          <span className="font-medium text-foreground">{row.schemeName}</span>
        ),
      },
      {
        id: "productType",
        header: t("fields.productType"),
        cell: (row) => (
          <span className="text-foreground">
            {row.productTypeDesc || EMPTY}
          </span>
        ),
      },
      {
        id: "repayType",
        header: t("fields.repayType"),
        cell: (row) => (
          <span className="text-foreground">{row.repayTypeDesc || EMPTY}</span>
        ),
      },
      {
        id: "roiPercent",
        header: t("fields.roiPercent"),
        cell: (row) => (
          <span className="font-semibold text-foreground">
            {numberFormat.format(row.roiPercent)}%
          </span>
        ),
      },
      {
        id: "repaySchedule",
        header: t("fields.repaySchedule"),
        cell: (row) => (
          <span className="text-foreground">
            {row.repayScheduleDesc || EMPTY}
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
    [numberFormat, t],
  );

  return (
    <DataTable<LoanSchemeSetup>
      title={t("tableCaption")}
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
      minWidth="960px"
      caption={t("tableCaption")}
      rowActions={{
        header: tGlobal("columns.actions"),
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
