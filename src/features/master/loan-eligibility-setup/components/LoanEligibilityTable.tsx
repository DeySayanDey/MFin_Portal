"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Ban, CircleCheck, Pencil } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { isLoanEligibilityDataType } from "../constants";
import type {
  LoanEligibilityParameter,
  PaginationMeta,
} from "../types/loan-eligibility.types";

type LoanEligibilityTableProps = {
  items: LoanEligibilityParameter[];
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
  onEdit: (row: LoanEligibilityParameter) => void;
  onToggleActive: (row: LoanEligibilityParameter) => void;
};

function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
    value,
  );
}

function formatIsoDate(value: string, locale: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}

export function LoanEligibilityTable({
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
}: LoanEligibilityTableProps) {
  const t = useTranslations("master.loanEligibility");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const columns = useMemo<DataTableColumn<LoanEligibilityParameter>[]>(
    () => [
      {
        id: "parameterName",
        header: t("fields.parameterName"),
        cell: (row) => (
          <span className="font-semibold text-foreground">{row.parameterName}</span>
        ),
      },
      {
        id: "dataType",
        header: t("fields.dataType"),
        cell: (row) => (
          <span className="text-foreground">
            {isLoanEligibilityDataType(row.dataType)
              ? t(`dataTypes.${row.dataType}`)
              : row.dataType}
          </span>
        ),
      },
      {
        id: "operator",
        header: t("fields.operator"),
        cell: (row) => (
          <span className="font-medium text-foreground">{row.operator}</span>
        ),
      },
      {
        id: "reqValue",
        header: t("fields.reqValue"),
        cell: (row) => (
          <span className="text-foreground">
            {row.dataType === "BOOLEAN"
              ? row.reqValue === 1
                ? t("yes")
                : row.reqValue === 0
                  ? t("no")
                  : "—"
              : row.reqValue == null
                ? "—"
                : formatNumber(row.reqValue, locale)}
          </span>
        ),
      },
      {
        id: "valueCd",
        header: t("fields.valueCd"),
        cell: (row) => (
          <span className="text-foreground">{row.valueDesc || "—"}</span>
        ),
      },
      {
        id: "parameterValue",
        header: t("fields.parameterValue"),
        cell: (row) => (
          <span className="text-foreground">{row.parameterValue || "—"}</span>
        ),
      },
      {
        id: "isMandatory",
        header: t("fields.isMandatory"),
        cell: (row) => (
          <span className="text-foreground">{row.isMandatory ? t("yes") : t("no")}</span>
        ),
      },
      {
        id: "effectiveFrom",
        header: t("fields.effectiveFrom"),
        cell: (row) => (
          <span className="text-foreground">
            {row.effectiveFrom ? formatIsoDate(row.effectiveFrom, locale) : "—"}
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
    [locale, t],
  );

  return (
    <DataTable<LoanEligibilityParameter>
      title={t("tableCaption")}
      description=""
      data={items}
      columns={columns}
      getRowKey={(row) => String(row.paramId)}
      loading={loading}
      error={error}
      errorTitle={t("loadErrorTitle")}
      errorMessage={errorMessage}
      onRetry={onRetry}
      emptyTitle={t("emptyTitle")}
      emptyMessage={t("emptyMessage")}
      minWidth="1180px"
      caption={t("tableCaption")}
      rowActions={{
        header: tCommon("actions"),
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
              disabled={statusBusyId === row.paramId}
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
