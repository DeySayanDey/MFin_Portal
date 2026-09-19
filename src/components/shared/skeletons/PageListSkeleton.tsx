import { Skeleton } from "@/components/ui/Skeleton";
import { DataTableSkeleton } from "@/components/shared/skeletons/DataTableSkeleton";

type PageListSkeletonProps = {
  filterFields?: number;
  tableRows?: number;
  tableColumns?: number;
  className?: string;
};

/**
 * List page loading: header + filter strip + table.
 */
export function PageListSkeleton({
  filterFields = 3,
  tableRows = 6,
  tableColumns = 5,
  className = "",
}: PageListSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={`flex min-w-0 flex-col gap-4 sm:gap-5 ${className}`.trim()}
    >
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 sm:w-64" />
        <Skeleton className="h-3.5 w-full max-w-md" />
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: filterFields }).map((_, index) => (
            <div key={index} className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full" rounded="xl" />
            </div>
          ))}
        </div>
      </section>

      <DataTableSkeleton rows={tableRows} columns={tableColumns} />
    </div>
  );
}
