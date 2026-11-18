"use client";

import { useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { formatDateDMY } from "@/lib/date-format";
import { Ban, CircleCheck, Pencil } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type {
  FinYear,
  PaginationMeta,
} from "@/features/master/fin-year/types/fin-year.types";

type FinYearTableProps = {
  items: FinYear[];
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
  onEdit: (row: FinYear) => void;
  onToggleActive: (row: FinYear) => void;
  headerActions?: ReactNode;
};

export function FinYearTable({
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
}: FinYearTableProps) {
  const t = useTranslations("master.finYear");

  const columns = useMemo<DataTableColumn<FinYear>[]>(
    () => [
      {
        id: "yearId",
        header: t("columns.id"),
        cell: (row) => (
          <span className="font-mono text-slate-700">{row.yearId}</span>
        ),
      },
      {
        id: "yearName",
        header: t("columns.yearName"),
        cell: (row) => (
          <span className="font-medium text-slate-800">{row.yearName}</span>
        ),
      },
      {
        id: "startDate",
        header: t("columns.startDate"),
        cell: (row) => (
          <span className="font-mono text-xs text-slate-700">{formatDateDMY(row.startDate)}</span>
        ),
      },
      {
        id: "endDate",
        header: t("columns.endDate"),
        cell: (row) => (
          <span className="font-mono text-xs text-slate-700">{formatDateDMY(row.endDate)}</span>
        ),
      },
      {
        id: "isActive",
        header: t("columns.status"),
        cell: (row) => (
          <Badge tone={row.isActive ? "success" : "neutral"} caps>
            {row.isActive ? t("statusActive") : t("statusInactive")}
          </Badge>
        ),
      },
    ],
    [t],
  );

  return (
    <DataTable<FinYear>
      title={t("title")}
      description={t("description")}
      actions={headerActions}
      data={items}
      columns={columns}
      getRowKey={(row) => String(row.yearId)}
      loading={loading}
      error={error}
      errorTitle={t("loadErrorTitle")}
      errorMessage={errorMessage}
      onRetry={onRetry}
      emptyTitle={t("emptyTitle")}
      emptyMessage={t("emptyMessage")}
      minWidth="880px"
      caption={t("tableCaption")}
      rowActions={{
        header: t("columns.actions"),
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
              disabled={statusBusyId === row.yearId}
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
