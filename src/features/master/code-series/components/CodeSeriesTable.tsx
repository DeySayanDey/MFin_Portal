"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Ban, CircleCheck, SlidersHorizontal } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type {
  CodeSeries,
  PaginationMeta,
} from "@/features/master/code-series/types/code-series.types";

type CodeSeriesTableProps = {
  items: CodeSeries[];
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
  onConfigure: (row: CodeSeries) => void;
  onToggleStatus: (row: CodeSeries) => void;
};

export function CodeSeriesTable({
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
  onConfigure,
  onToggleStatus,
  statusBusyId = null,
}: CodeSeriesTableProps) {
  const t = useTranslations("master.codeSeries");

  const columns = useMemo<DataTableColumn<CodeSeries>[]>(
    () => [
      {
        id: "module",
        header: t("columns.module"),
        cell: (row) => (
          <div className="min-w-0">
            <p className="font-medium text-slate-800">{row.moduleName}</p>
            <p className="mt-0.5 font-mono text-[11px] text-muted-soft">
              {row.moduleKey}
            </p>
          </div>
        ),
      },
      {
        id: "prefix",
        header: t("columns.prefix"),
        cell: (row) => (
          <span className="rounded-md bg-blue-50 px-2 py-1 font-mono text-xs font-semibold text-blue-700">
            {row.prefix || "—"}
          </span>
        ),
      },
      {
        id: "nextCounter",
        header: t("columns.nextCounter"),
        cell: (row) => (
          <span className="font-mono text-slate-700">{row.nextCounter}</span>
        ),
      },
      {
        id: "padding",
        header: t("columns.padding"),
        cell: (row) => (
          <span className="font-mono text-slate-700">{row.paddingDigits}</span>
        ),
      },
      {
        id: "suffix",
        header: t("columns.suffix"),
        cell: (row) => (
          <span className="text-muted">{row.suffix || "—"}</span>
        ),
      },
      {
        id: "sample",
        header: t("columns.sample"),
        cell: (row) => (
          <span className="font-mono text-sm font-semibold text-slate-800">
            {row.genCode || row.formattedSample}
          </span>
        ),
      },
      {
        id: "status",
        header: t("columns.status"),
        cell: (row) => (
          <Badge tone={row.status === 1 ? "success" : "neutral"} caps>
            {row.status === 1 ? t("statusActive") : t("statusInactive")}
          </Badge>
        ),
      },
    ],
    [t],
  );

  const total = meta?.total ?? items.length;
  const totalPages = meta?.lastPage;

  return (
    <DataTable<CodeSeries>
      title={t("title")}
      description={t("description")}
      data={items}
      columns={columns}
      getRowKey={(row) => String(row.seriesId)}
      loading={loading}
      error={error}
      errorTitle={t("loadErrorTitle")}
      errorMessage={errorMessage}
      onRetry={onRetry}
      emptyTitle={t("emptyTitle")}
      emptyMessage={t("emptyMessage")}
      minWidth="980px"
      caption={t("tableCaption")}
      rowActions={{
        header: t("columns.actions"),
        render: (row) => {
          const isActive = row.status === 1;
          return (
            <div className="inline-flex items-center gap-1.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={SlidersHorizontal}
                tooltip={t("configure")}
                onClick={() => onConfigure(row)}
              />
              <Button
                type="button"
                variant={isActive ? "warning" : "success"}
                size="sm"
                icon={isActive ? Ban : CircleCheck}
                tooltip={isActive ? t("deactivate") : t("activate")}
                disabled={statusBusyId === row.seriesId}
                onClick={() => onToggleStatus(row)}
              />
            </div>
          );
        },
      }}
      pagination={{
        page,
        pageSize,
        total,
        totalPages,
        pageSizeOptions: [10, 20, 50],
        onPageChange,
        onPageSizeChange,
      }}
    />
  );
}
