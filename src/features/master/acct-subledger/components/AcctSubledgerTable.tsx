"use client";

import { useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Ban, CircleCheck, Pencil } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type {
  AcctSubledger,
  PaginationMeta,
} from "@/features/master/acct-subledger/types/acct-subledger.types";

type AcctSubledgerTableProps = {
  items: AcctSubledger[];
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
  onEdit: (row: AcctSubledger) => void;
  onToggleStatus: (row: AcctSubledger) => void;
  headerActions?: ReactNode;
};

export function AcctSubledgerTable({
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
}: AcctSubledgerTableProps) {
  const t = useTranslations("master.acctSubledger");

  const columns = useMemo<DataTableColumn<AcctSubledger>[]>(
    () => [
      {
        id: "subledgCode",
        header: t("columns.subledgCode"),
        cell: (row) => (
          <span className="font-mono text-xs text-slate-700">
            {row.subledgCode}
          </span>
        ),
      },
      {
        id: "mainHead",
        header: t("columns.mainHead"),
        cell: (row) => {
          const name = row.mainhdName?.trim();
          if (!name) return <span className="text-slate-400">—</span>;
          return (
            <div className="min-w-0">
              <p className="truncate text-slate-800">{name}</p>
              {row.mainhdCode ? (
                <p className="font-mono text-[11px] text-slate-500">
                  {row.mainhdCode}
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "ledger",
        header: t("columns.ledger"),
        cell: (row) => {
          const name = row.ledgerName?.trim() || "—";
          const code = row.ledgerCode?.trim();
          return (
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800">{name}</p>
              {code ? (
                <p className="font-mono text-[11px] text-slate-500">{code}</p>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "subledgName",
        header: t("columns.subledgName"),
        cell: (row) => (
          <span className="font-medium text-slate-800">{row.subledgName}</span>
        ),
      },
      {
        id: "branchCount",
        header: t("columns.branchCount"),
        cell: (row) => (
          <span className="tabular-nums text-slate-700">{row.branchCount}</span>
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
    <DataTable<AcctSubledger>
      title={t("title")}
      description={t("description")}
      actions={headerActions}
      data={items}
      columns={columns}
      getRowKey={(row) => String(row.subledgId)}
      loading={loading}
      error={error}
      errorTitle={t("loadErrorTitle")}
      errorMessage={errorMessage}
      onRetry={onRetry}
      emptyTitle={t("emptyTitle")}
      emptyMessage={t("emptyMessage")}
      minWidth="960px"
      maxVisibleRows={8}
      caption={t("tableCaption")}
      rowActions={{
        header: t("columns.actions"),
        render: (row) => (
          <div className="flex items-center gap-1.5">
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
              disabled={statusBusyId === row.subledgId}
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
