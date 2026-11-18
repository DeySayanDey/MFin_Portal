"use client";

import { useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Ban, CircleCheck, Pencil } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type {
  AcctSubledgerBranch,
  PaginationMeta,
} from "@/features/master/acct-subledger-branch/types/acct-subledger-branch.types";

type AcctSubledgerBranchTableProps = {
  items: AcctSubledgerBranch[];
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
  onEdit: (row: AcctSubledgerBranch) => void;
  onToggleStatus: (row: AcctSubledgerBranch) => void;
  headerActions?: ReactNode;
};

function nameCodeCell(name: string | null, code: string | null) {
  const display = name?.trim() || "—";
  return (
    <div className="min-w-0">
      <p className="truncate font-medium text-slate-800">{display}</p>
      {code?.trim() ? (
        <p className="font-mono text-[11px] text-slate-500">{code.trim()}</p>
      ) : null}
    </div>
  );
}

export function AcctSubledgerBranchTable({
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
}: AcctSubledgerBranchTableProps) {
  const t = useTranslations("master.acctSubledgerBranch");

  const columns = useMemo<DataTableColumn<AcctSubledgerBranch>[]>(
    () => [
      {
        id: "ledger",
        header: t("columns.ledger"),
        cell: (row) => {
          if (!row.ledgerName?.trim()) {
            return <span className="text-slate-400">—</span>;
          }
          return nameCodeCell(row.ledgerName, row.ledgerCode);
        },
      },
      {
        id: "subledger",
        header: t("columns.subledger"),
        cell: (row) => nameCodeCell(row.subledgName, row.subledgCode),
      },
      {
        id: "branch",
        header: t("columns.branch"),
        cell: (row) => nameCodeCell(row.branchName, row.branchCode),
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
    <DataTable<AcctSubledgerBranch>
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
      minWidth="860px"
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
        pageSizeOptions: [20, 50, 100, 200],
        onPageChange,
        onPageSizeChange,
      }}
    />
  );
}
