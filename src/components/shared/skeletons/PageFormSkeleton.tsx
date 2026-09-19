import { Skeleton } from "@/components/ui/Skeleton";

type PageFormSkeletonProps = {
  fields?: number;
  showChecks?: boolean;
  className?: string;
};

/**
 * Page + card form loading placeholder (Organization, Timings, RBI, etc.).
 */
export function PageFormSkeleton({
  fields = 6,
  showChecks = true,
  className = "",
}: PageFormSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={`flex min-w-0 flex-col gap-4 sm:gap-5 ${className}`.trim()}
    >
      <div className="space-y-2">
        <Skeleton className="h-7 w-56 sm:w-72" />
        <Skeleton className="h-3.5 w-full max-w-md" />
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-3 w-full max-w-lg" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: fields }).map((_, index) => (
            <div key={index} className="space-y-1.5">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-10 w-full" rounded="xl" />
            </div>
          ))}
        </div>

        {showChecks ? (
          <div className="mt-4 space-y-3 rounded-2xl bg-surface-muted px-4 py-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-start gap-2">
                <Skeleton className="mt-0.5 h-4 w-4" rounded="md" />
                <Skeleton className="h-3.5 w-full max-w-sm" />
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex justify-end">
          <Skeleton className="h-10 w-40" rounded="xl" />
        </div>
      </section>
    </div>
  );
}
