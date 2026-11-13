"use client";

import { useMemo, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Ban, CircleCheck, Pencil } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { ApplOption } from "@/features/master/appl-options";
import { FIGURE_PERCENT_OPT_CODE } from "../constants";
import type {
  ChargeKind,
  ChargeSetup,
  ChargeSetupPagination,
} from "../types/charges-setup.types";

type ChargesSetupTableProps = {
  kind: ChargeKind;
  items: ChargeSetup[];
  meta: ChargeSetupPagination | null;
  page: number;
  pageSize: number;
  loading: boolean;
  error: boolean;
  errorMessage?: string;
  statusBusyId?: number | null;
  figureOptions: ApplOption[];
  duringOptions: ApplOption[];
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (row: ChargeSetup) => void;
  onToggleActive: (row: ChargeSetup) => void;
  headerActions?: ReactNode;
};

function optionLabel(options: ApplOption[], code: number): string {
  return (
    options.find((option) => option.optCode === code)?.optDescription ??
    String(code)
  );
}

export function ChargesSetupTable({
  kind,
  items,
  meta,
  page,
  pageSize,
  loading,
  error,
  errorMessage,
  statusBusyId = null,
  figureOptions,
  duringOptions,
  onRetry,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onToggleActive,
  headerActions,
}: ChargesSetupTableProps) {
  const t = useTranslations("master.chargesSetup");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const amountFormat = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale],
  );

  const columns = useMemo<DataTableColumn<ChargeSetup>[]>(
    () => [
      {
        id: "chargeName",
        header: t("fields.chargeName"),
        cell: (row) => (
          <span className="font-semibold text-foreground">
            {row.chargeName}
          </span>
        ),
      },
      ...(kind === "deposit" ? [{
        id: "chargeType",
        header: t("chargeTypeLabel"),
        cell: (row: ChargeSetup) => row.chargeTypeDesc || (row.chargeType != null ? String(row.chargeType) : "—"),
      }] : []),
      {
        id: "chargeRate",
        header: t("fields.chargeRate"),
        cell: (row) => (
          <span className="font-medium text-foreground">
            {row.chargeRate == null
              ? "—"
              : row.figureCd === FIGURE_PERCENT_OPT_CODE
                ? `${amountFormat.format(row.chargeRate)}%`
                : amountFormat.format(row.chargeRate)}
          </span>
        ),
      },
      {
        id: "figureCd",
        header: t("fields.figureCd"),
        cell: (row) =>
          row.figureCd == null
            ? "—"
            : row.figureDesc || optionLabel(figureOptions, row.figureCd),
      },
      {
        id: "maxAmount",
        header: t("fields.maxAmount"),
        cell: (row) =>
          row.maxAmount != null ? amountFormat.format(row.maxAmount) : "—",
      },
      {
        id: "taxPercent",
        header: t("fields.taxPercent"),
        cell: (row) => `${amountFormat.format(row.taxPercent)}%`,
      },
      {
        id: "duringCd",
        header:
          kind === "loan"
            ? t("fields.deductDuringCd")
            : t("fields.chargesDuringCd"),
        cell: (row) =>
          row.duringCd == null
            ? "—"
            : row.duringDesc || optionLabel(duringOptions, row.duringCd),
      },
      {
        id: "chargesGl",
        header: t("fields.chargesGl"),
        cell: (row) =>
          row.chargesGlName
            ? `${row.chargesGlName}${row.chargesGlCode ? ` (${row.chargesGlCode})` : ""}`
            : "—",
      },
      ...(kind === "loan"
        ? [
            {
              id: "isRefundable",
              header: t("fields.isRefundable"),
              cell: (row: ChargeSetup) => (
                <Badge tone={row.isRefundable ? "success" : "neutral"} caps={false}>
                  {row.isRefundable ? t("refundable") : t("nonRefundable")}
                </Badge>
              ),
            },
          ]
        : []),
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
    [amountFormat, duringOptions, figureOptions, kind, t],
  );

  const caption =
    kind === "deposit" ? t("tableCaptionDeposit") : t("tableCaptionLoan");

  return (
    <DataTable<ChargeSetup>
      title={caption}
      actions={headerActions}
      data={items}
      columns={columns}
      getRowKey={(row) => String(row.chargeId)}
      loading={loading}
      error={error}
      errorTitle={t("loadErrorTitle")}
      errorMessage={errorMessage}
      onRetry={onRetry}
      emptyTitle={t("emptyTitle")}
      emptyMessage={t("emptyMessage")}
      minWidth="1100px"
      caption={caption}
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
              disabled={statusBusyId === row.chargeId}
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
