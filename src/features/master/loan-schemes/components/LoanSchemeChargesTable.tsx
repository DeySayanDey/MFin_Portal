"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Ban, ChevronDown, ChevronRight, CircleCheck, Pencil } from "lucide-react";
import { DataTablePagination } from "@/components/shared/DataTable/DataTablePagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { DataTableSkeleton } from "@/components/shared/skeletons/DataTableSkeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FIGURE_PERCENT_OPT_CODE } from "@/features/master/charges-setup/constants";
import type { LoanSchemeCharge } from "../types/loan-schemes.types";

const EMPTY = "—";

type SchemeGroup = {
  schemeId: number;
  schemeName: string;
  schemeCode: string;
  charges: LoanSchemeCharge[];
};

type LoanSchemeChargesTableProps = {
  items: LoanSchemeCharge[];
  page: number;
  pageSize: number;
  loading: boolean;
  error: boolean;
  errorMessage?: string;
  statusBusyId?: number | null;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (row: LoanSchemeCharge) => void;
  onToggleActive: (row: LoanSchemeCharge) => void;
  headerActions?: ReactNode;
};

export function LoanSchemeChargesTable({
  items,
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
}: LoanSchemeChargesTableProps) {
  const t = useTranslations("master.loanSchemes.charges");
  const tGlobal = useTranslations("master.loanSchemes");
  const locale = useLocale();
  const [openSchemeId, setOpenSchemeId] = useState<number | null>(null);
  const numberFormat = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }),
    [locale],
  );

  const groups = useMemo(() => groupByScheme(items), [items]);
  const pageGroups = groups.slice((page - 1) * pageSize, page * pageSize);
  const cardClass =
    "rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5";

  const heading = (
    <div className="mb-4 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-foreground">
          {t("tableCaption")}
        </h2>
        <p className="mt-1 text-sm text-muted">{t("groupHint")}</p>
      </div>
      {headerActions ? (
        <div className="flex shrink-0 justify-end">{headerActions}</div>
      ) : null}
    </div>
  );

  if (loading && items.length === 0) {
    return (
      <section className={cardClass}>
        {heading}
        <DataTableSkeleton bare columns={4} />
      </section>
    );
  }

  if (error && items.length === 0) {
    return (
      <section className={cardClass}>
        {heading}
        <ErrorState
          title={t("loadErrorTitle")}
          message={errorMessage}
          onRetry={onRetry}
        />
      </section>
    );
  }

  if (groups.length === 0) {
    return (
      <section className={cardClass}>
        {heading}
        <EmptyState title={t("emptyTitle")} message={t("emptyMessage")} />
      </section>
    );
  }

  return (
    <section className={`relative ${cardClass}`}>
      <div
        className={`relative -mx-4 -mt-2 mb-3 h-0.5 overflow-hidden bg-slate-100 sm:-mx-5 transition-opacity duration-200 ${
          loading ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />
      {heading}
      <div className="space-y-2">
        {pageGroups.map((group) => {
          const open = openSchemeId === group.schemeId;
          const activeCount = group.charges.filter((charge) => charge.isActive)
            .length;
          return (
            <div
              key={group.schemeId}
              className={`overflow-hidden rounded-xl border transition-colors duration-200 motion-reduce:transition-none ${
                open ? "border-brand/40" : "border-border"
              }`}
            >
              <div
                className={`flex items-center gap-2 px-2 py-1.5 ${
                  open ? "bg-surface-muted/80" : ""
                }`}
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 text-start transition-colors duration-200 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 motion-reduce:transition-none"
                  aria-expanded={open}
                  onClick={() => setOpenSchemeId(open ? null : group.schemeId)}
                >
                  {open ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-foreground">
                      {group.schemeName || EMPTY}
                    </span>
                    {group.schemeCode ? (
                      <span className="block font-mono text-xs text-muted">
                        {group.schemeCode}
                      </span>
                    ) : null}
                  </span>
                  <span className="ms-auto shrink-0 whitespace-nowrap text-xs font-medium text-foreground">
                    <span className="sr-only">
                      {open ? t("group.collapse") : t("group.expand")}
                    </span>
                    {t("group.summary", {
                      total: group.charges.length,
                      active: activeCount,
                    })}
                  </span>
                </button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={Pencil}
                  tooltip={t("edit")}
                  onClick={() => onEdit(group.charges[0])}
                />
              </div>
              {open ? (
                <div className="border-t border-border bg-surface-muted/60 px-3 py-3">
                  <div className="table-scroll">
                    <table className="w-full min-w-[880px] text-left text-sm">
                      <caption className="sr-only">
                        {group.schemeName || t("fields.charges")}
                      </caption>
                      <thead>
                        <tr className="whitespace-nowrap border-b border-border text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-soft">
                          <th className="pb-2 pe-3">{t("fields.chargeName")}</th>
                          <th className="pb-2 pe-3">{t("fields.chargeRate")}</th>
                          <th className="pb-2 pe-3">{t("fields.figureCd")}</th>
                          <th className="pb-2 pe-3">{t("fields.maxAmount")}</th>
                          <th className="pb-2 pe-3">{t("fields.taxPercent")}</th>
                          <th className="pb-2 pe-3">
                            {t("fields.deductDuringCd")}
                          </th>
                          <th className="pb-2 pe-3">{t("fields.chargesGl")}</th>
                          <th className="pb-2 pe-3">
                            {t("fields.chargeStatus")}
                          </th>
                          <th className="pb-2 pe-3">{t("fields.isActive")}</th>
                          <th className="pb-2">{tGlobal("columns.actions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.charges.map((charge) => (
                          <tr
                            key={charge.id}
                            className="border-b border-border/70 last:border-0"
                          >
                            <td className="whitespace-nowrap py-2.5 pe-3 font-medium text-foreground">
                              {charge.chargeName || EMPTY}
                            </td>
                            <td className="whitespace-nowrap py-2.5 pe-3 text-foreground">
                              {formatRate(charge, numberFormat)}
                            </td>
                            <td className="whitespace-nowrap py-2.5 pe-3 text-foreground">
                              {charge.figureDesc || EMPTY}
                            </td>
                            <td className="whitespace-nowrap py-2.5 pe-3 text-foreground">
                              {charge.maxAmount == null
                                ? EMPTY
                                : numberFormat.format(charge.maxAmount)}
                            </td>
                            <td className="whitespace-nowrap py-2.5 pe-3 text-foreground">
                              {numberFormat.format(charge.taxPercent)}%
                            </td>
                            <td className="whitespace-nowrap py-2.5 pe-3 text-foreground">
                              {charge.deductDuringDesc || EMPTY}
                            </td>
                            <td className="whitespace-nowrap py-2.5 pe-3 text-foreground">
                              {formatGl(charge)}
                            </td>
                            <td className="py-2.5 pe-3">
                              <Badge
                                tone={
                                  charge.chargeIsActive ? "success" : "neutral"
                                }
                                caps
                              >
                                {charge.chargeIsActive
                                  ? t("statusActive")
                                  : t("statusInactive")}
                              </Badge>
                            </td>
                            <td className="py-2.5 pe-3">
                              <Badge
                                tone={charge.isActive ? "success" : "neutral"}
                                caps
                              >
                                {charge.isActive
                                  ? t("statusActive")
                                  : t("statusInactive")}
                              </Badge>
                            </td>
                            <td className="py-2.5">
                              <Button
                                type="button"
                                variant={
                                  charge.isActive ? "warning" : "success"
                                }
                                size="sm"
                                icon={charge.isActive ? Ban : CircleCheck}
                                tooltip={
                                  charge.isActive
                                    ? t("deactivate")
                                    : t("activate")
                                }
                                disabled={statusBusyId === charge.id}
                                onClick={() => onToggleActive(charge)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <DataTablePagination
        className="mt-3"
        page={page}
        pageSize={pageSize}
        total={groups.length}
        pageSizeOptions={[20, 50, 100, 200]}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </section>
  );
}

function groupByScheme(items: LoanSchemeCharge[]): SchemeGroup[] {
  const groups = new Map<number, SchemeGroup>();
  for (const item of items) {
    const existing = groups.get(item.schemeId);
    if (existing) {
      existing.charges.push(item);
      continue;
    }
    groups.set(item.schemeId, {
      schemeId: item.schemeId,
      schemeName: item.schemeName,
      schemeCode: item.schemeCode,
      charges: [item],
    });
  }
  return [...groups.values()];
}

function formatRate(
  row: LoanSchemeCharge,
  numberFormat: Intl.NumberFormat,
): string {
  if (row.chargeRate == null) return EMPTY;
  const formatted = numberFormat.format(row.chargeRate);
  return row.figureCd === FIGURE_PERCENT_OPT_CODE ? `${formatted}%` : formatted;
}

function formatGl(row: LoanSchemeCharge): string {
  if (!row.chargesGlName && row.chargesGl == null) return EMPTY;
  if (row.chargesGlName && row.chargesGlCode) {
    return `${row.chargesGlName} (${row.chargesGlCode})`;
  }
  return row.chargesGlName || EMPTY;
}
