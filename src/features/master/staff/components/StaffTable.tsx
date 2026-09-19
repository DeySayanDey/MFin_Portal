"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Ban, CircleCheck, Pencil } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type {
  PaginationMeta,
  Staff,
} from "@/features/master/staff/types/staff.types";

type StaffTableProps = {
  items: Staff[];
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
  onEdit: (row: Staff) => void;
  onToggleStatus: (row: Staff) => void;
};

export function StaffTable({
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
  onToggleStatus,
  statusBusyId = null,
}: StaffTableProps) {
  const t = useTranslations("master.staff");

  const columns = useMemo<DataTableColumn<Staff>[]>(
    () => [
      {
        id: "employeeCode",
        header: t("columns.employeeCode"),
        cell: (row) => (
          <span className="font-mono text-slate-700">{row.employeeCode}</span>
        ),
      },
      {
        id: "fullName",
        header: t("columns.fullName"),
        cell: (row) => (
          <span className="font-medium text-slate-800">{row.fullName}</span>
        ),
      },
      {
        id: "designation",
        header: t("columns.designation"),
        cell: (row) => (
          <span className="text-sm text-muted">
            {row.designationName ?? ""}
          </span>
        ),
      },
      {
        id: "mobile",
        header: t("columns.mobile"),
        cell: (row) => (
          <span className="text-sm text-muted">{row.mobile ?? ""}</span>
        ),
      },
      {
        id: "assignment",
        header: t("columns.assignment"),
        cell: (row) => (
          <span className="line-clamp-2 max-w-[14rem] text-sm text-muted">
            {row.assignment ?? ""}
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

  return (
    <DataTable<Staff>
      data={items}
      columns={columns}
      getRowKey={(row) => String(row.staffId)}
      loading={loading}
      error={error}
      errorTitle={t("loadErrorTitle")}
      errorMessage={errorMessage}
      onRetry={onRetry}
      emptyTitle={t("emptyTitle")}
      emptyMessage={t("emptyMessage")}
      minWidth="920px"
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
                icon={Pencil}
                tooltip={t("edit")}
                onClick={() => onEdit(row)}
              />
              <Button
                type="button"
                variant={isActive ? "warning" : "success"}
                size="sm"
                icon={isActive ? Ban : CircleCheck}
                tooltip={isActive ? t("deactivate") : t("activate")}
                disabled={statusBusyId === row.staffId}
                onClick={() => onToggleStatus(row)}
              />
            </div>
          );
        },
      }}
      pagination={{
        page,
        pageSize,
        total: meta?.total ?? items.length,
        totalPages: meta?.lastPage,
        pageSizeOptions: [10, 20, 50],
        onPageChange,
        onPageSizeChange,
      }}
    />
  );
}
