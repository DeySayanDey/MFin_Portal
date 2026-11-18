import { Skeleton } from "@/components/ui/Skeleton";

type PageFormSkeletonProps = {
  fields?: number;
  showChecks?: boolean;
  className?: string;
};

/**
 * Card form loading placeholder. Matches Card: title, description, fields, save.
 * The page title stays in the app header.
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
      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3.5 w-full max-w-md" />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
              <div key={index} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 shrink-0" rounded="md" />
                <Skeleton className="h-3.5 w-full max-w-sm" />
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex justify-end">
          <Skeleton className="h-10 w-36" rounded="xl" />
        </div>
      </section>
    </div>
  );
}
