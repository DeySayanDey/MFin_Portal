"use client";

import { useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Ban, CircleCheck, Pencil } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ACCT_CATEGORY_TYPE_OPTIONS } from "@/features/master/acct-category/types/acct-category.types";
import type {
  AcctHead,
  PaginationMeta,
} from "@/features/master/acct-head/types/acct-head.types";

type AcctHeadTableProps = {
  items: AcctHead[];
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
  onEdit: (row: AcctHead) => void;
  onToggleStatus: (row: AcctHead) => void;
  headerActions?: ReactNode;
};

function isKnownType(
  value: string,
): value is (typeof ACCT_CATEGORY_TYPE_OPTIONS)[number] {
  return (ACCT_CATEGORY_TYPE_OPTIONS as readonly string[]).includes(value);
}

export function AcctHeadTable({
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
}: AcctHeadTableProps) {
  const t = useTranslations("master.acctHead");
  const tCategory = useTranslations("master.acctCategory");

  const columns = useMemo<DataTableColumn<AcctHead>[]>(
    () => [
      {
        id: "mainhdCode",
        header: t("columns.mainhdCode"),
        cell: (row) => (
          <span className="font-mono text-xs text-slate-700">
            {row.mainhdCode}
          </span>
        ),
      },
      {
        id: "category",
        header: t("columns.category"),
        cell: (row) => {
          const name = row.categName?.trim() || "—";
          const code = row.categCode?.trim();
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
        id: "mainhdName",
        header: t("columns.mainhdName"),
        cell: (row) => (
          <span className="font-medium text-slate-800">{row.mainhdName}</span>
        ),
      },
      {
        id: "categoryType",
        header: t("columns.categoryType"),
        cell: (row) => {
          if (!row.categoryType) {
            return <span className="text-slate-400">—</span>;
          }
          const label = isKnownType(row.categoryType)
            ? tCategory(`types.${row.categoryType}`)
            : row.categoryType;
          return (
            <Badge tone="info" caps={false}>
              {label}
            </Badge>
          );
        },
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
    [t, tCategory],
  );

  return (
    <DataTable<AcctHead>
      title={t("title")}
      description={t("description")}
      actions={headerActions}
      data={items}
      columns={columns}
      getRowKey={(row) => String(row.mainhdId)}
      loading={loading}
      error={error}
      errorTitle={t("loadErrorTitle")}
      errorMessage={errorMessage}
      onRetry={onRetry}
      emptyTitle={t("emptyTitle")}
      emptyMessage={t("emptyMessage")}
      minWidth="900px"
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
              disabled={statusBusyId === row.mainhdId}
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
