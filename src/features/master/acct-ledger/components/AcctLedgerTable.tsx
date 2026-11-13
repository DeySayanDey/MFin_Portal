"use client";

import { useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Ban, CircleCheck, Pencil } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type {
  AcctLedger,
  PaginationMeta,
} from "@/features/master/acct-ledger/types/acct-ledger.types";

type AcctLedgerTableProps = {
  items: AcctLedger[];
  meta: PaginationMeta | null;
  page: number;
  pageSize: number;
  loading: boolean;
  error: boolean;
  errorMessage?: string;
  statusBusyId: number | null;
  ledgerTypes: { value: string; label: string }[];
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (row: AcctLedger) => void;
  onToggleStatus: (row: AcctLedger) => void;
  headerActions?: ReactNode;
};

export function AcctLedgerTable({
  items,
  meta,
  page,
  pageSize,
  loading,
  error,
  errorMessage,
  statusBusyId,
  ledgerTypes,
  onRetry,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onToggleStatus,
  headerActions,
}: AcctLedgerTableProps) {
  const t = useTranslations("master.acctLedger");

  const columns = useMemo<DataTableColumn<AcctLedger>[]>(
    () => [
      {
        id: "ledgerCode",
        header: t("columns.ledgerCode"),
        cell: (row) => (
          <span className="font-mono text-xs text-slate-700">
            {row.ledgerCode}
          </span>
        ),
      },
      {
        id: "ledgerName",
        header: t("columns.ledgerName"),
        cell: (row) => (
          <span className="font-medium text-slate-800">{row.ledgerName}</span>
        ),
      },
      {
        id: "ledgerType",
        header: t("columns.ledgerType"),
        cell: (row) =>
          row.ledgerType ? (
            <Badge tone="info" caps>
              {ledgerTypes.find((option) => option.value === row.ledgerType)?.label ?? row.ledgerType}
            </Badge>
          ) : (
            <span className="text-slate-400">—</span>
          ),
      },
      {
        id: "mainHead",
        header: t("columns.mainHead"),
        cell: (row) => {
          const name = row.mainhdName?.trim() || "—";
          const code = row.mainhdCode?.trim();
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
        id: "category",
        header: t("columns.category"),
        cell: (row) => {
          const name = row.categName?.trim();
          if (!name) return <span className="text-slate-400">—</span>;
          return (
            <div className="min-w-0">
              <p className="truncate text-slate-800">{name}</p>
              {row.categCode ? (
                <p className="font-mono text-[11px] text-slate-500">
                  {row.categCode}
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "subledgerCount",
        header: t("columns.subledgerCount"),
        cell: (row) => (
          <span className="tabular-nums text-slate-700">
            {row.subledgerCount}
          </span>
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
    [t, ledgerTypes],
  );

  return (
    <DataTable<AcctLedger>
      title={t("title")}
      description={t("description")}
      actions={headerActions}
      data={items}
      columns={columns}
      getRowKey={(row) => String(row.ledgerId)}
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
              disabled={statusBusyId === row.ledgerId}
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
