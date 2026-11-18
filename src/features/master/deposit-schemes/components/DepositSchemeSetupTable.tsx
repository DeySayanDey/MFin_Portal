"use client";

import { useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Ban, CircleCheck, Pencil } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type {
  DepositSchemeSetup,
  PaginationMeta,
} from "../types/deposit-schemes.types";

type DepositSchemeSetupTableProps = {
  items: DepositSchemeSetup[];
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
  onEdit: (row: DepositSchemeSetup) => void;
  onToggleActive: (row: DepositSchemeSetup) => void;
  headerActions?: ReactNode;
};

export function DepositSchemeSetupTable({
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
}: DepositSchemeSetupTableProps) {
  const t = useTranslations("master.depositSchemes.setup");
  const tGlobal = useTranslations("master.depositSchemes");

  const columns = useMemo<DataTableColumn<DepositSchemeSetup>[]>(
    () => [
      {
        id: "schemeCode",
        header: t("fields.schemeCode", { fallback: "Code" }),
        cell: (row) => (
          <span className="font-mono text-xs font-semibold text-slate-600">
            {row.schemeCode || `DS-${String(row.id).padStart(4, "0")}`}
          </span>
        ),
      },
      {
        id: "schemeName",
        header: t("fields.schemeName"),
        cell: (row) => (
          <span className="font-medium text-slate-800">{row.schemeName}</span>
        ),
      },
      {
        id: "depositType",
        header: t("fields.depositType"),
        cell: (row) => (
          <span className="text-slate-700">
            {row.depositTypeDesc ||
              (row.depositTypeCd === 1
                ? "Savings"
                : row.depositTypeCd === 2
                  ? "Term Deposit"
                  : String(row.depositTypeCd))}
          </span>
        ),
      },
      {
        id: "prodType",
        header: t("fields.productType"),
        cell: (row) => (
          <span className="text-slate-700">
            {row.prodTypeDesc || String(row.prodTypeCd)}
          </span>
        ),
      },
      {
        id: "roiPercent",
        header: t("fields.roiPercentage"),
        cell: (row) => (
          <span className="font-semibold text-slate-800">
            {row.roiPercent != null ? `${row.roiPercent}%` : "—"}
          </span>
        ),
      },
      {
        id: "principalLedger",
        header: t("fields.principalLedger"),
        cell: (row) => (
          <span className="text-xs text-slate-600">
            {row.prnLedgerName || "—"}
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
    [t],
  );

  return (
    <DataTable<DepositSchemeSetup>
      title={t("tableCaption")}
      description={""}
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
      minWidth="920px"
      caption={t("tableCaption")}
      rowActions={{
        header: tGlobal("columns.actions", { fallback: "Actions" }),
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
