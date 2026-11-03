"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { DataTableAlign, DataTableProps } from "./types";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { DataTableSkeleton } from "@/components/shared/skeletons/DataTableSkeleton";
import { DataTablePagination } from "./DataTablePagination";

function TableHeading({
  title,
  description,
  actions,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  if (!title && !description && !actions) return null;
  return (
    <div className="mb-4 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {title ? (
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        ) : null}
        {description ? (
          <p className="mt-1 text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 justify-end">{actions}</div>
      ) : null}
    </div>
  );
}

const alignClass: Record<DataTableAlign, string> = {
  start: "text-start",
  center: "text-center",
  end: "text-end",
};

function defaultRowKey<T>(_row: T, index: number) {
  return String(index);
}

export function DataTable<T>({
  data: rawData = [],
  columns,
  getRowKey = defaultRowKey,
  loading = false,
  error = false,
  errorTitle,
  errorMessage,
  onRetry,
  emptyTitle,
  emptyMessage,
  emptyAction,
  pagination,
  selection,
  rowActions,
  className = "",
  minWidth = "640px",
  tableLayout = "auto",
  minHeight,
  maxHeight,
  caption,
  onRowClick,
  getRowClassName,
  title,
  description,
  actions,
  toolbar,
}: DataTableProps<T>) {
  const data = Array.isArray(rawData) ? rawData : [];
  const t = useTranslations("ui");

  const selectionKeys = selection ? new Set(selection.selectedKeys) : null;

  const allVisibleKeys =
    selection != null
      ? data.map((row, index) => selection.getRowKey(row, index))
      : [];
  const allSelected =
    selection != null &&
    allVisibleKeys.length > 0 &&
    allVisibleKeys.every((key) => selectionKeys!.has(key));
  const someSelected =
    selection != null &&
    allVisibleKeys.some((key) => selectionKeys!.has(key)) &&
    !allSelected;

  function toggleAll(checked: boolean) {
    if (!selection) return;
    if (checked) {
      const next = new Set(selection.selectedKeys);
      for (const key of allVisibleKeys) next.add(key);
      selection.onSelectionChange([...next]);
      return;
    }
    const remove = new Set(allVisibleKeys);
    selection.onSelectionChange(
      selection.selectedKeys.filter((key) => !remove.has(key)),
    );
  }

  function toggleRow(key: string, checked: boolean) {
    if (!selection) return;
    if (checked) {
      if (selectionKeys!.has(key)) return;
      selection.onSelectionChange([...selection.selectedKeys, key]);
      return;
    }
    selection.onSelectionChange(
      selection.selectedKeys.filter((item) => item !== key),
    );
  }

  const heading = (
    <>
      <TableHeading title={title} description={description} actions={actions} />
      {toolbar ? (
        <div className="mb-4 border-b border-border pb-4">{toolbar}</div>
      ) : null}
    </>
  );
  const hasHeading = Boolean(title || description || actions || toolbar);
  const hasCustomMinHeight = Boolean(minHeight || className.includes("min-h-"));
  const defaultMinHeightClass = hasCustomMinHeight ? "" : "min-h-[440px]";
  const cardClass =
    `rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5 ${className}`.trim();
  const awaitingFirstRows = loading && data.length === 0;
  const [showSkeleton, setShowSkeleton] = useState(false);
  const columnCount =
    columns.length + (rowActions ? 1 : 0) + (selection ? 1 : 0);

  if (!awaitingFirstRows && showSkeleton) {
    setShowSkeleton(false);
  }

  // Fast responses should not flash a skeleton. Shimmer only if the wait lasts.
  useEffect(() => {
    if (!awaitingFirstRows) return;
    const id = window.setTimeout(() => setShowSkeleton(true), 180);
    return () => window.clearTimeout(id);
  }, [awaitingFirstRows]);

  // Only show full skeleton on initial load when there is NO data yet.
  // When data is already present, keep the table visible and show a sleek background progress bar.
  if (awaitingFirstRows) {
    if (!showSkeleton) {
      return (
        <section
          className={`flex flex-col ${defaultMinHeightClass} ${cardClass}`}
          style={minHeight ? { minHeight } : undefined}
          aria-busy="true"
        >
          {heading}
          <div
            className="relative mb-3 h-0.5 overflow-hidden bg-slate-100"
            aria-hidden="true"
          >
            <div className="animate-table-progress h-full w-1/3 rounded-full bg-brand" />
          </div>
          <div className="flex-1 min-h-48" />
        </section>
      );
    }
    if (!hasHeading) {
      return (
        <DataTableSkeleton columns={columnCount} className={className} />
      );
    }
    return (
      <section
        className={`flex flex-col ${defaultMinHeightClass} ${cardClass}`}
        style={minHeight ? { minHeight } : undefined}
      >
        {heading}
        <DataTableSkeleton bare columns={columnCount} />
      </section>
    );
  }

  // Only show full ErrorState when there is NO data to show.
  if (error && data.length === 0) {
    return (
      <section
        className={`flex flex-col justify-between ${defaultMinHeightClass} ${cardClass}`}
        style={minHeight ? { minHeight } : undefined}
      >
        {heading}
        <div className="flex flex-1 items-center justify-center py-8">
          <ErrorState
            title={errorTitle}
            message={errorMessage}
            onRetry={onRetry}
          />
        </div>
      </section>
    );
  }

  if (data.length === 0) {
    return (
      <section
        className={`flex flex-col justify-between ${defaultMinHeightClass} ${cardClass}`}
        style={minHeight ? { minHeight } : undefined}
      >
        {heading}
        <div className="flex flex-1 items-center justify-center py-8">
          <EmptyState
            title={emptyTitle}
            message={emptyMessage}
            action={emptyAction}
          />
        </div>
        {pagination ? (
          <DataTablePagination {...pagination} className="mt-3" />
        ) : null}
      </section>
    );
  }

  return (
    <section className={`relative flex flex-col justify-between ${cardClass}`}>
      {/* Background reload indicator: subtle progress bar so the table never disappears or flashes */}
      <div
        className={`relative -mx-4 -mt-2 mb-3 h-0.5 overflow-hidden bg-slate-100 sm:-mx-5 transition-opacity duration-200 ${
          loading ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      >
        <div className="animate-table-progress h-full w-1/3 rounded-full bg-brand" />
      </div>

      {heading}

      {/* Non-intrusive inline error alert if background refetch fails while data is visible */}
      {error && data.length > 0 ? (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-800">
          <span>{errorMessage || errorTitle || t("loadErrorTitle")}</span>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="font-semibold underline hover:text-rose-950"
            >
              {t("retry")}
            </button>
          ) : null}
        </div>
      ) : null}

      <div
        className="table-scroll scrollbar-thin flex-1"
        style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}
      >
        <table className="w-full text-left text-sm" style={{ minWidth, tableLayout }}>
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-[0.12em] text-muted-soft">
              {selection ? (
                <th scope="col" className="w-10 pb-3 pe-3 ps-1 font-semibold">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border text-brand focus:ring-brand/30"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={(event) => toggleAll(event.target.checked)}
                    aria-label={t("selectAllRows")}
                  />
                </th>
              ) : null}
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={`pb-3 pe-3 font-semibold ${alignClass[column.align ?? "start"]} ${column.headerClassName ?? ""}`.trim()}
                >
                  {column.header}
                </th>
              ))}
              {rowActions ? (
                <th
                  scope="col"
                  className={`pb-3 font-semibold ${rowActions.className ?? ""}`.trim()}
                >
                  {rowActions.header ?? t("actionsColumn")}
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody
            className={`transition-opacity duration-150 ${
              loading ? "opacity-70" : "opacity-100"
            }`}
          >
            {data.map((row, rowIndex) => {
              const key = getRowKey(row, rowIndex);
              const selectionKey = selection
                ? selection.getRowKey(row, rowIndex)
                : key;
              const selected = selectionKeys?.has(selectionKey) ?? false;

              return (
                <tr
                  key={key}
                  className={`border-b border-border/70 last:border-0 ${
                    onRowClick ? "cursor-pointer hover:bg-surface-muted/60" : ""
                  } ${selected ? "bg-brand-soft/30" : ""} ${getRowClassName?.(row, rowIndex) ?? ""}`.trim()}
                  onClick={
                    onRowClick ? () => onRowClick(row, rowIndex) : undefined
                  }
                >
                  {selection ? (
                    <td className="py-3.5 pe-3 ps-1">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border text-brand focus:ring-brand/30"
                        checked={selected}
                        onChange={(event) =>
                          toggleRow(selectionKey, event.target.checked)
                        }
                        onClick={(event) => event.stopPropagation()}
                        aria-label={t("selectRow")}
                      />
                    </td>
                  ) : null}
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={`py-3.5 pe-3 text-foreground ${alignClass[column.align ?? "start"]} ${column.className ?? ""}`.trim()}
                    >
                      {column.cell(row, rowIndex)}
                    </td>
                  ))}
                  {rowActions ? (
                    <td
                      className={`py-3.5 ${rowActions.className ?? ""}`.trim()}
                      onClick={(event) => event.stopPropagation()}
                    >
                      {rowActions.render(row, rowIndex)}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pagination ? (
        <DataTablePagination {...pagination} className="mt-3" />
      ) : null}
    </section>
  );
}
