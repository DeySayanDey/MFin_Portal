import type { ReactNode } from "react";

export type DataTableAlign = "start" | "center" | "end";

/**
 * Domain-agnostic column definition.
 * Features supply headers, cell renderers, and row typing.
 */
export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T, rowIndex: number) => ReactNode;
  className?: string;
  headerClassName?: string;
  align?: DataTableAlign;
};

export type DataTablePaginationConfig = {
  page: number;
  pageSize: number;
  total: number;
  /** Optional override; defaults to ceil(total / pageSize). */
  totalPages?: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
};

export type DataTableSelectionConfig<T> = {
  /** Stable row identity for selection. */
  getRowKey: (row: T, rowIndex: number) => string;
  selectedKeys: ReadonlyArray<string>;
  onSelectionChange: (selectedKeys: string[]) => void;
};

export type DataTableRowActions<T> = {
  /** Rendered in a trailing Actions column when provided. */
  render: (row: T, rowIndex: number) => ReactNode;
  header?: ReactNode;
  className?: string;
};

export type DataTableProps<T> = {
  data: ReadonlyArray<T>;
  columns: ReadonlyArray<DataTableColumn<T>>;
  /** Stable key for each row. Defaults to row index when omitted. */
  getRowKey?: (row: T, rowIndex: number) => string;
  loading?: boolean;
  error?: boolean;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  pagination?: DataTablePaginationConfig;
  selection?: DataTableSelectionConfig<T>;
  rowActions?: DataTableRowActions<T>;
  /** Extra class on the outer card/section. */
  className?: string;
  /** Minimum table width for horizontal scroll (CSS length). */
  minWidth?: string;
  caption?: string;
  onRowClick?: (row: T, rowIndex: number) => void;
};
