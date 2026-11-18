"use client";

import { useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { formatDateDMY } from "@/lib/date-format";
import { Pencil } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type {
  Holiday,
  PaginationMeta,
} from "@/features/master/holiday/types/holiday.types";
import {
  HOLIDAY_TYPE_FESTIVAL,
  HOLIDAY_TYPE_NATIONAL,
} from "@/features/master/holiday/types/holiday.types";

type HolidayTableProps = {
  items: Holiday[];
  meta: PaginationMeta | null;
  page: number;
  pageSize: number;
  loading: boolean;
  error: boolean;
  errorMessage?: string;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (row: Holiday) => void;
  headerActions?: ReactNode;
};

export function HolidayTable({
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
  headerActions,
}: HolidayTableProps) {
  const t = useTranslations("master.holiday");

  function typeLabel(holiType: number): string {
    if (holiType === HOLIDAY_TYPE_NATIONAL) return t("types.national");
    if (holiType === HOLIDAY_TYPE_FESTIVAL) return t("types.festival");
    return String(holiType);
  }

  const columns = useMemo<DataTableColumn<Holiday>[]>(
    () => [
      {
        id: "holidayDate",
        header: t("columns.holidayDate"),
        cell: (row) => (
          <span className="font-mono text-xs text-slate-700">
            {formatDateDMY(row.holidayDate)}
          </span>
        ),
      },
      {
        id: "purpose",
        header: t("columns.purpose"),
        cell: (row) => (
          <span className="font-medium text-slate-800">{row.purpose}</span>
        ),
      },
      {
        id: "yearName",
        header: t("columns.year"),
        cell: (row) => (
          <span className="text-slate-700">
            {row.yearName ?? String(row.yearSl)}
          </span>
        ),
      },
      {
        id: "holiType",
        header: t("columns.type"),
        cell: (row) => (
          <Badge
            tone={
              row.holiType === HOLIDAY_TYPE_NATIONAL ? "info" : "amber"
            }
            caps
          >
            {typeLabel(row.holiType)}
          </Badge>
        ),
      },
    ],
    // typeLabel uses t; columns depend on t only
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  return (
    <DataTable<Holiday>
      title={t("title")}
      description={t("description")}
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
      minWidth="880px"
      caption={t("tableCaption")}
      rowActions={{
        header: t("columns.actions"),
        render: (row) => (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={Pencil}
            tooltip={t("edit")}
            onClick={() => onEdit(row)}
          />
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
