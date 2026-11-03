import { Skeleton } from "@/components/ui/Skeleton";
import { DataTableSkeleton } from "@/components/shared/skeletons/DataTableSkeleton";
import { sectionTabsGridClass } from "@/components/shared/section-tabs-grid";

type PageListSkeletonProps = {
  filterFields?: number;
  tableRows?: number;
  tableColumns?: number;
  /** Section tab cards. 0 hides them. */
  tabs?: number;
  activeTab?: number;
  className?: string;
};

function SectionTabsSkeleton({
  count,
  activeIndex,
}: {
  count: number;
  activeIndex: number;
}) {
  return (
    <div className={`grid gap-3 ${sectionTabsGridClass(count)}`}>
      {Array.from({ length: count }).map((_, index) => {
        const active = index === activeIndex;
        const block = active ? "bg-white/40" : "skeleton-block";
        return (
          <div
            key={index}
            className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 ${
              active ? "border-brand bg-brand" : "border-border bg-surface"
            }`}
          >
            <span className={`h-9 w-9 shrink-0 rounded-xl ${block}`} aria-hidden />
            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className={`h-3 w-[60%] rounded-md ${block}`} aria-hidden />
              <span className={`h-2.5 w-[85%] rounded-md ${block}`} aria-hidden />
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * List page loading: optional section tabs, filter row, and table card.
 * The page title stays in the app header, so this skeleton does not repeat it.
 */
export function PageListSkeleton({
  filterFields = 3,
  tableRows = 6,
  tableColumns = 5,
  tabs = 0,
  activeTab = 0,
  className = "",
}: PageListSkeletonProps) {
  const safeActive = Math.min(Math.max(activeTab, 0), Math.max(tabs - 1, 0));

  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={`flex min-w-0 flex-col gap-4 sm:gap-5 ${className}`.trim()}
    >
      {tabs > 0 ? (
        <SectionTabsSkeleton count={tabs} activeIndex={safeActive} />
      ) : null}

      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-3 shadow-[var(--shadow-card)] sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          {Array.from({ length: filterFields }).map((_, index) => (
            <div
              key={index}
              className="w-full min-w-0 space-y-1.5 sm:min-w-[10rem] sm:max-w-[18rem] sm:flex-1"
            >
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full" rounded="xl" />
            </div>
          ))}
          <Skeleton className="h-10 w-full sm:w-24 sm:flex-none" rounded="xl" />
        </div>
      </section>

      <DataTableSkeleton
        rows={tableRows}
        columns={tableColumns}
        showHeading
      />
    </div>
  );
}
