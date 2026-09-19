import { Skeleton } from "@/components/ui/Skeleton";

type DashboardSkeletonProps = {
  className?: string;
};

/**
 * Dashboard layout loading placeholder (metric cards + panels).
 */
export function DashboardSkeleton({ className = "" }: DashboardSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={`flex min-w-0 flex-col gap-4 sm:gap-5 ${className}`.trim()}
    >
      <section className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <article
            key={index}
            className="relative overflow-hidden rounded-2xl border border-border bg-surface p-3.5 shadow-[var(--shadow-card)] sm:p-4"
          >
            <span
              className="absolute inset-y-0 left-0 w-1 bg-slate-200"
              aria-hidden
            />
            <div className="flex items-start justify-between gap-3 pl-2">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-2.5 w-24" />
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-9 w-9 shrink-0" rounded="xl" />
            </div>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <article
            key={index}
            className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, rowIndex) => (
                <div
                  key={rowIndex}
                  className="flex items-center justify-between gap-3"
                >
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="h-6 w-20" rounded="full" />
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
