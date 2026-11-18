import { Skeleton } from "@/components/ui/Skeleton";

type DashboardSkeletonProps = {
  className?: string;
};

const cardClass =
  "rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5";

/**
 * Dashboard loading placeholder: metric cards, workflow grid, funds panel, and tables.
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
              className="absolute inset-y-0 left-0 w-1 bg-border"
              aria-hidden
            />
            <div className="flex items-start justify-between gap-3 pl-2">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-2.5 w-24" />
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-6 w-28" rounded="full" />
              </div>
              <Skeleton className="h-10 w-10 shrink-0" rounded="2xl" />
            </div>
          </article>
        ))}
      </section>

      <section className={cardClass}>
        <div className="mb-4 space-y-2">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-3.5 w-full max-w-md" />
        </div>
        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface-muted/60 px-4 py-4 min-[480px]:flex-col min-[480px]:py-6"
            >
              <Skeleton className="h-12 w-12 shrink-0 sm:h-14 sm:w-14" rounded="2xl" />
              <Skeleton className="h-3.5 w-28" />
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(260px,320px)_1fr]">
        <article className="rounded-2xl bg-brand-dark p-4 shadow-[var(--shadow-card)] sm:p-5">
          <div className="skeleton-block skeleton-block--inverse h-2.5 w-32 rounded-lg" />
          <div className="skeleton-block skeleton-block--inverse mt-3 h-8 w-40 rounded-lg" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="skeleton-block skeleton-block--inverse h-3.5 w-36 rounded-lg" />
                <div className="skeleton-block skeleton-block--inverse h-3.5 w-16 rounded-lg" />
              </div>
            ))}
          </div>
          <div className="skeleton-block skeleton-block--inverse mt-6 h-10 w-full rounded-xl" />
        </article>

        <article className={cardClass}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-5 w-52" />
              <Skeleton className="h-3.5 w-40" />
            </div>
            <Skeleton className="h-6 w-28" rounded="full" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-3 border-b border-border/70 pb-3 last:border-0 last:pb-0"
              >
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-6 w-20" rounded="full" />
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className={cardClass}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-64 max-w-full" />
            <Skeleton className="h-3.5 w-full max-w-sm" />
          </div>
          <Skeleton className="h-6 w-28 shrink-0" rounded="full" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 border-b border-border/70 pb-3 last:border-0 last:pb-0"
            >
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 min-w-0 flex-1" />
              <Skeleton className="h-6 w-16" rounded="full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
