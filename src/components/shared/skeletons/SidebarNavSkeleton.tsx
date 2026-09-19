import { Skeleton } from "@/components/ui/Skeleton";

type SidebarNavSkeletonProps = {
  items?: number;
  className?: string;
};

/**
 * Sidebar module menu loading placeholder.
 */
export function SidebarNavSkeleton({
  items = 6,
  className = "",
}: SidebarNavSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={`space-y-1.5 px-0 ${className}`.trim()}
    >
      {Array.from({ length: items }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-2xl border border-transparent bg-white px-3 py-2.5 shadow-[var(--shadow-card)]"
        >
          <Skeleton className="h-8 w-8 shrink-0" rounded="xl" />
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-5 w-7" rounded="full" />
          <Skeleton className="h-4 w-4 shrink-0" rounded="md" />
        </div>
      ))}
    </div>
  );
}
