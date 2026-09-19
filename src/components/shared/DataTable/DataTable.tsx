"use client";

import type { DataTableAlign, DataTableProps } from "./types";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { DataTableSkeleton } from "@/components/shared/skeletons/DataTableSkeleton";
import { DataTablePagination } from "./DataTablePagination";

const alignClass: Record<DataTableAlign, string> = {
  start: "text-start",
  center: "text-center",
  end: "text-end",
};

function defaultRowKey<T>(_row: T, index: number) {
  return String(index);
}

export function DataTable<T>({
  data,
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
  caption,
  onRowClick,
}: DataTableProps<T>) {
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

  if (loading) {
    return (
      <DataTableSkeleton
        columns={columns.length + (rowActions ? 1 : 0) + (selection ? 1 : 0)}
        className={className}
      />
    );
  }

  if (error) {
    return (
      <section
        className={`rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5 ${className}`.trim()}
      >
        <ErrorState
          title={errorTitle}
          message={errorMessage}
          onRetry={onRetry}
        />
      </section>
    );
  }

  if (data.length === 0) {
    return (
      <section
        className={`rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5 ${className}`.trim()}
      >
        <EmptyState
          title={emptyTitle}
          message={emptyMessage}
          action={emptyAction}
        />
        {pagination ? (
          <DataTablePagination {...pagination} className="mt-3" />
        ) : null}
      </section>
    );
  }

  return (
    <section
      className={`rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5 ${className}`.trim()}
    >
      <div className="table-scroll scrollbar-thin">
        <table className="w-full text-left text-sm" style={{ minWidth }}>
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
          <tbody>
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
                  } ${selected ? "bg-brand-soft/30" : ""}`.trim()}
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
                      className={`py-3.5 pe-3 text-slate-700 ${alignClass[column.align ?? "start"]} ${column.className ?? ""}`.trim()}
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
