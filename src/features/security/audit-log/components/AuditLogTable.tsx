"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Eye } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type {
  AuditLog,
  PaginationMeta,
} from "@/features/security/audit-log/types/audit-log.types";
import { AUDIT_ACTIONS } from "@/features/security/audit-log/types/audit-log.types";

type AuditLogTableProps = {
  items: AuditLog[];
  meta: PaginationMeta | null;
  page: number;
  pageSize: number;
  loading: boolean;
  error: boolean;
  errorMessage?: string;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onView: (row: AuditLog) => void;
};

function actionTone(
  action: number,
): "success" | "info" | "warning" | "neutral" | "danger" {
  if (action === AUDIT_ACTIONS.create) return "success";
  if (action === AUDIT_ACTIONS.update) return "info";
  if (action === AUDIT_ACTIONS.delete) return "danger";
  if (action === AUDIT_ACTIONS.login) return "neutral";
  if (action === AUDIT_ACTIONS.logout) return "warning";
  return "neutral";
}

export function AuditLogTable({
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
  onView,
}: AuditLogTableProps) {
  const t = useTranslations("security.auditLog");

  const columns = useMemo<DataTableColumn<AuditLog>[]>(
    () => [
      {
        id: "createdAt",
        header: t("columns.createdAt"),
        cell: (row) => (
          <span className="whitespace-nowrap font-mono text-xs text-slate-700">
            {row.createdAt}
          </span>
        ),
      },
      {
        id: "action",
        header: t("columns.action"),
        cell: (row) => (
          <Badge tone={actionTone(row.action)} caps>
            {row.actionName}
          </Badge>
        ),
      },
      {
        id: "menuName",
        header: t("columns.menu"),
        cell: (row) => (
          <span className="font-medium text-slate-800">
            {row.menuName ?? ""}
          </span>
        ),
      },
      {
        id: "tableName",
        header: t("columns.table"),
        cell: (row) => (
          <span className="font-mono text-xs text-muted">
            {row.tableName ?? ""}
          </span>
        ),
      },
      {
        id: "userId",
        header: t("columns.userId"),
        cell: (row) => (
          <span className="font-mono text-sm text-slate-700">
            {row.userId ?? ""}
          </span>
        ),
      },
      {
        id: "ipAddress",
        header: t("columns.ip"),
        cell: (row) => (
          <span className="font-mono text-xs text-muted">
            {row.ipAddress ?? ""}
          </span>
        ),
      },
    ],
    [t],
  );

  return (
    <DataTable<AuditLog>
      title={t("title")}
      description={t("description")}
      data={items}
      columns={columns}
      getRowKey={(row) => String(row.auditId)}
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
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={Eye}
            tooltip={t("view")}
            onClick={() => onView(row)}
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
