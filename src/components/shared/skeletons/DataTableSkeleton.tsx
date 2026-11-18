import { Skeleton } from "@/components/ui/Skeleton";

type DataTableSkeletonProps = {
  rows?: number;
  columns?: number;
  showPagination?: boolean;
  /** Title, description, and action button, matching DataTable's card heading. */
  showHeading?: boolean;
  className?: string;
  /** Skip the outer card when the parent already provides one. */
  bare?: boolean;
};

const cardClass =
  "rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5";

function headerClass(index: number, columns: number): string {
  if (index === columns - 1) return "h-2.5 w-14 shrink-0";
  if (columns >= 3 && index === columns - 2) return "h-2.5 w-16 shrink-0";
  if (index === 0) return "h-2.5 w-16 shrink-0";
  return "h-2.5 min-w-0 flex-1";
}

function DataTableSkeletonRows({
  rows,
  columns,
}: {
  rows: number;
  columns: number;
}) {
  return (
    <div className="overflow-hidden">
      <div className="mb-1 flex items-center gap-3 border-b border-border pb-3">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton
            key={`h-${index}`}
            className={headerClass(index, columns)}
          />
        ))}
      </div>
      <div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`r-${rowIndex}`}
            className="flex items-center gap-3 border-b border-border/70 py-3.5 last:border-0"
          >
            {Array.from({ length: columns }).map((_, colIndex) => {
              const isActions = colIndex === columns - 1;
              const isStatus = columns >= 3 && colIndex === columns - 2;
              if (isActions) {
                return (
                  <div
                    key={`c-${rowIndex}-${colIndex}`}
                    className="flex w-14 shrink-0 items-center gap-1.5"
                  >
                    <Skeleton className="h-8 w-8" rounded="xl" />
                    <Skeleton className="h-8 w-8" rounded="xl" />
                  </div>
                );
              }
              if (isStatus) {
                return (
                  <Skeleton
                    key={`c-${rowIndex}-${colIndex}`}
                    className="h-6 w-16 shrink-0"
                    rounded="full"
                  />
                );
              }
              return (
                <Skeleton
                  key={`c-${rowIndex}-${colIndex}`}
                  className={`h-3.5 ${
                    colIndex === 0 ? "w-20 shrink-0" : "min-w-0 flex-1"
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function DataTableSkeletonPagination() {
  return (
    <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
      <Skeleton className="h-3 w-36" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-[4.75rem]" rounded="xl" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex items-center justify-end gap-1.5">
          <Skeleton className="h-8 w-24" rounded="xl" />
          <Skeleton className="h-8 w-20" rounded="xl" />
        </div>
      </div>
    </div>
  );
}

function DataTableSkeletonHeading() {
  return (
    <div className="mb-4 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-2">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-3.5 w-full max-w-sm" />
      </div>
      <Skeleton className="h-10 w-36 shrink-0" rounded="xl" />
    </div>
  );
}

/**
 * Table-shaped loading placeholder matching DataTable:
 * heading, column row, body, and pager.
 */
export function DataTableSkeleton({
  rows = 6,
  columns = 5,
  showPagination = true,
  showHeading = false,
  className = "",
  bare = false,
}: DataTableSkeletonProps) {
  const body = (
    <>
      {showHeading ? <DataTableSkeletonHeading /> : null}
      <DataTableSkeletonRows rows={rows} columns={columns} />
      {showPagination ? <DataTableSkeletonPagination /> : null}
    </>
  );

  if (bare) {
    return (
      <div role="status" aria-busy="true" aria-live="polite">
        {body}
      </div>
    );
  }

  return (
    <section
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={`${cardClass} ${className}`.trim()}
    >
      {body}
    </section>
  );
}
