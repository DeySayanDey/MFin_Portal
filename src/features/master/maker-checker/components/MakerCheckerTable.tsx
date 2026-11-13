"use client";

import { useMemo, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Ban, CircleCheck, Pencil } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type {
  MakerCheckerRule,
  PaginationMeta,
} from "@/features/master/maker-checker/types/maker-checker.types";

type MakerCheckerTableProps = {
  items: MakerCheckerRule[];
  meta: PaginationMeta | null;
  page: number;
  pageSize: number;
  loading: boolean;
  error: boolean;
  errorMessage?: string;
  statusBusyId?: number | null;
  roleNameById: Record<string, string>;
  voucherNameByCode: Record<string, string>;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (row: MakerCheckerRule) => void;
  onToggleStatus: (row: MakerCheckerRule) => void;
  headerActions?: ReactNode;
};

function formatAmount(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function MakerCheckerTable({
  items,
  meta,
  page,
  pageSize,
  loading,
  error,
  errorMessage,
  roleNameById,
  voucherNameByCode,
  onRetry,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onToggleStatus,
  statusBusyId = null,
  headerActions,
}: MakerCheckerTableProps) {
  const t = useTranslations("master.makerChecker");
  const locale = useLocale();

  const columns = useMemo<DataTableColumn<MakerCheckerRule>[]>(
    () => [
      {
        id: "id",
        header: t("columns.id"),
        cell: (row) => (
          <span className="font-mono text-slate-700">{row.id}</span>
        ),
      },
      {
        id: "voucherType",
        header: t("columns.voucherType"),
        cell: (row) => (
          <span className="font-medium text-slate-800">{voucherNameByCode[String(row.voucherType)] || row.voucherType}</span>
        ),
      },
      {
        id: "thresholdLimit",
        header: t("columns.thresholdLimit"),
        cell: (row) => (
          <span className="tabular-nums text-slate-800">
            {formatAmount(row.thresholdLimit, locale)}
          </span>
        ),
      },
      {
        id: "checkerRoleId",
        header: t("columns.checkerRole"),
        cell: (row) => {
          const name = roleNameById[row.checkerRoleId];
          return (
            <span className="text-sm text-slate-800">
              {name
                ? `${name} (${row.checkerRoleId})`
                : row.checkerRoleId || "—"}
            </span>
          );
        },
      },
      {
        id: "dualAuthReq",
        header: t("columns.dualAuthReq"),
        cell: (row) => (
          <Badge tone={row.dualAuthReq ? "info" : "neutral"} caps>
            {row.dualAuthReq ? t("yes") : t("no")}
          </Badge>
        ),
      },
      {
        id: "autoApprv",
        header: t("columns.autoApprv"),
        cell: (row) => (
          <Badge tone={row.autoApprv ? "success" : "neutral"} caps>
            {row.autoApprv ? t("yes") : t("no")}
          </Badge>
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
      {
        id: "createdAt",
        header: t("columns.createdAt"),
        cell: (row) => (
          <span className="text-sm text-muted">{row.createdAt}</span>
        ),
      },
    ],
    [locale, roleNameById, voucherNameByCode, t],
  );

  return (
    <DataTable<MakerCheckerRule>
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
              disabled={statusBusyId === row.id}
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
        pageSizeOptions: [10, 20, 50],
        onPageChange,
        onPageSizeChange,
      }}
    />
  );
}
