"use client";

import { useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { formatDateDMY } from "@/lib/date-format";
import { Ban, CircleCheck } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type {
  DepositSchemeSlab,
  PaginationMeta,
} from "../types/deposit-interest.types";

type DepositInterestTableProps = {
  items: DepositSchemeSlab[];
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
  onToggleActive: (row: DepositSchemeSlab) => void;
  headerActions?: ReactNode;
};

export function DepositInterestTable({
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
  onToggleActive,
  statusBusyId = null,
  headerActions,
}: DepositInterestTableProps) {
  const t = useTranslations("master.depositInterest");
  const tCommon = useTranslations("common");

  const columns = useMemo<DataTableColumn<DepositSchemeSlab>[]>(
    () => [
      {
        id: "schemeName",
        header: t("fields.scheme", { fallback: "Deposit Scheme" }),
        cell: (row) => (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">
              {row.schemeName}
            </span>
            {row.schemeCode ? (
              <span className="font-mono text-xs text-muted">
                {row.schemeCode}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        id: "duration",
        header: t("fields.durationRange", { fallback: "Duration Range" }),
        cell: (row) => (
          <span className="font-medium text-foreground">
            {row.minDuration} – {row.maxDuration} {row.termDesc}
          </span>
        ),
      },
      {
        id: "roi",
        header: t("fields.roi", { fallback: "RoI (%)" }),
        cell: (row) => (
          <span className="inline-flex items-center font-bold text-foreground">
            {Number(row.roi).toFixed(2)}%
          </span>
        ),
      },
      {
        id: "lockPeriod",
        header: t("fields.lockPeriod", { fallback: "Lock Period" }),
        cell: (row) => (
          <span className="text-foreground">
            {row.lockPeriod != null
              ? `${row.lockPeriod} ${row.termDesc}`
              : "—"}
          </span>
        ),
      },
      {
        id: "effectivePeriod",
        header: t("fields.effectivePeriod", { fallback: "Effective Period" }),
        cell: (row) => (
          <div className="flex items-center text-xs text-foreground">
            <span>{formatDateDMY(row.effectFrm)}</span>
            <span className="mx-1 text-muted">→</span>
            <span>
              {row.effectUpto ? formatDateDMY(row.effectUpto) :
                t("fields.openEnded", { fallback: "Open-ended" })}
            </span>
          </div>
        ),
      },
      {
        id: "isActive",
        header: t("fields.isActive", { fallback: "Status" }),
        cell: (row) => (
          <Badge tone={row.isActive ? "success" : "neutral"} caps>
            {row.isActive
              ? t("statusActive", { fallback: "Active" })
              : t("statusInactive", { fallback: "Inactive" })}
          </Badge>
        ),
      },
    ],
    [t],
  );

  return (
    <DataTable<DepositSchemeSlab>
      title={t("tableCaption", { fallback: "Deposit Interest Slabs" })}
      description={""}
      actions={headerActions}
      data={items}
      columns={columns}
      getRowKey={(row) => String(row.id)}
      loading={loading}
      error={error}
      errorTitle={t("loadErrorTitle", {
        fallback: "Unable to load deposit interest slabs",
      })}
      errorMessage={errorMessage}
      onRetry={onRetry}
      emptyTitle={t("emptyTitle", { fallback: "No interest slabs found" })}
      emptyMessage={t("emptyMessage", {
        fallback: "No deposit interest slabs match the current filters.",
      })}
      minWidth="960px"
      caption={t("tableCaption", { fallback: "Deposit Interest Slabs" })}
      rowActions={{
        header: tCommon("actions", { fallback: "Actions" }),
        render: (row) => (
          <div className="inline-flex items-center gap-1.5">
            <Button
              type="button"
              variant={row.isActive ? "warning" : "success"}
              size="sm"
              icon={row.isActive ? Ban : CircleCheck}
              tooltip={
                row.isActive
                  ? t("deactivate", { fallback: "Deactivate" })
                  : t("activate", { fallback: "Activate" })
              }
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
