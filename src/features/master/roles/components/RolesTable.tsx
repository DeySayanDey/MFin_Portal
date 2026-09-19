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
  Role,
} from "@/features/master/roles/types/role.types";

type RolesTableProps = {
  items: Role[];
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
  onEdit: (row: Role) => void;
  onToggleStatus: (row: Role) => void;
};

export function RolesTable({
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
}: RolesTableProps) {
  const t = useTranslations("master.roles");

  const columns = useMemo<DataTableColumn<Role>[]>(
    () => [
      {
        id: "id",
        header: t("columns.id"),
        cell: (row) => (
          <span className="font-mono text-slate-700">{row.id}</span>
        ),
      },
      {
        id: "roleName",
        header: t("columns.roleName"),
        cell: (row) => (
          <span className="font-medium text-slate-800">{row.roleName}</span>
        ),
      },
      {
        id: "isAdmin",
        header: t("columns.isAdmin"),
        cell: (row) => (
          <Badge tone={row.isAdmin ? "info" : "neutral"} caps>
            {row.isAdmin ? t("filters.isAdminYes") : t("filters.isAdminNo")}
          </Badge>
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
      {
        id: "createdAt",
        header: t("columns.createdAt"),
        cell: (row) => (
          <span className="text-sm text-muted">{row.createdAt}</span>
        ),
      },
    ],
    [t],
  );

  return (
    <DataTable<Role>
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
      minWidth="720px"
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
                disabled={statusBusyId === row.id}
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
