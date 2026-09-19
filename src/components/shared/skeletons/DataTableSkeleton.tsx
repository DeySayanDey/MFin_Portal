import { Skeleton } from "@/components/ui/Skeleton";

type DataTableSkeletonProps = {
  rows?: number;
  columns?: number;
  showPagination?: boolean;
  className?: string;
};

/**
 * Table-shaped loading placeholder for shared DataTable.
 */
export function DataTableSkeleton({
  rows = 6,
  columns = 5,
  showPagination = true,
  className = "",
}: DataTableSkeletonProps) {
  return (
    <section
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={`rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5 ${className}`.trim()}
    >
      <div className="overflow-hidden">
        <div className="mb-3 flex gap-3 border-b border-border pb-3">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton
              key={`h-${index}`}
              className={`h-3 ${index === 0 ? "w-24" : "w-20"} flex-1`}
            />
          ))}
        </div>
        <div className="space-y-0">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
              key={`r-${rowIndex}`}
              className="flex items-center gap-3 border-b border-border/60 py-3.5 last:border-0"
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={`c-${rowIndex}-${colIndex}`}
                  className={`h-3.5 flex-1 ${
                    colIndex === columns - 1 ? "max-w-[4.5rem]" : ""
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      {showPagination ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-3.5 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" rounded="xl" />
            <Skeleton className="h-8 w-8" rounded="xl" />
            <Skeleton className="h-8 w-16" rounded="xl" />
          </div>
        </div>
      ) : null}
    </section>
  );
}
