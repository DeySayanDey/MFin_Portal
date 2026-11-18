"use client";

import { useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Ban, CircleCheck, Pencil } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type {
  OperationalDay,
  PaginationMeta,
} from "@/features/master/operational-days/types/operational-days.types";

const DAY_MESSAGE_KEYS = {
  1: "days.1",
  2: "days.2",
  3: "days.3",
  4: "days.4",
  5: "days.5",
  6: "days.6",
  7: "days.7",
} as const;

type OperationalDayTableProps = {
  items: OperationalDay[];
  meta: PaginationMeta | null;
  page: number;
  pageSize: number;
  loading: boolean;
  error: boolean;
  errorMessage?: string;
  statusBusyId: number | null;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (row: OperationalDay) => void;
  onToggleStatus: (row: OperationalDay) => void;
  headerActions?: ReactNode;
};

export function OperationalDayTable({
  items,
  meta,
  page,
  pageSize,
  loading,
  error,
  errorMessage,
  statusBusyId,
  onRetry,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onToggleStatus,
  headerActions,
}: OperationalDayTableProps) {
  const t = useTranslations("master.operationalDays");

  const columns = useMemo<DataTableColumn<OperationalDay>[]>(
    () => [
      {
        id: "branch",
        header: t("columns.branch"),
        cell: (row) => (
          <div className="min-w-0">
            <p className="font-medium text-slate-800">
              {row.branchName ?? "—"}
            </p>
            {row.branchCode ? (
              <p className="font-mono text-xs text-slate-500">
                {row.branchCode}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        id: "dayOfWeek",
        header: t("columns.dayOfWeek"),
        cell: (row) => {
          const dayKey =
            DAY_MESSAGE_KEYS[row.dayOfWeek as keyof typeof DAY_MESSAGE_KEYS];
          return (
            <span className="font-medium text-slate-800">
              {row.dayName ?? (dayKey ? t(dayKey) : String(row.dayOfWeek))}
            </span>
          );
        },
      },
      {
        id: "hours",
        header: t("columns.hours"),
        cell: (row) => (
          <span className="font-mono text-xs text-slate-700">
            {row.openTime && row.closeTime
              ? `${row.openTime} – ${row.closeTime}`
              : "—"}
          </span>
        ),
      },
      {
        id: "isOperational",
        header: t("columns.isOperational"),
        cell: (row) => (
          <Badge tone={row.isOperational ? "success" : "neutral"} caps>
            {row.isOperational
              ? t("labels.operational")
              : t("labels.nonOperational")}
          </Badge>
        ),
      },
      {
        id: "isHalfDay",
        header: t("columns.isHalfDay"),
        cell: (row) =>
          row.isHalfDay ? (
            <Badge tone="amber" caps>
              {t("labels.halfDay")}
            </Badge>
          ) : (
            <span className="text-slate-400">—</span>
          ),
      },
      {
        id: "status",
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
    <DataTable<OperationalDay>
      title={t("title")}
      description={t("description")}
      actions={headerActions}
      data={items}
      columns={columns}
      getRowKey={(row) => String(row.recId)}
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
              disabled={statusBusyId === row.recId}
              onClick={() => onToggleStatus(row)}
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
