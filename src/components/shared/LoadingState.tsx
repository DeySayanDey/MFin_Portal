"use client";

import { useTranslations } from "next-intl";
import { PageFormSkeleton } from "@/components/shared/skeletons/PageFormSkeleton";

type LoadingStateProps = {
  /** Kept for callers / a11y; visually covered by the skeleton. */
  title?: string;
  message?: string;
  className?: string;
};

/**
 * Default page loading state — shared form/page skeleton.
 * Prefer specific skeletons (DataTableSkeleton, SidebarNavSkeleton, etc.)
 * when the layout shape is known.
 */
export function LoadingState({
  title,
  message,
  className = "",
}: LoadingStateProps) {
  const t = useTranslations("ui");
  const label = title ?? t("loadingTitle");
  const detail = message ?? t("loadingMessage");

  return (
    <div className={className} aria-label={`${label}. ${detail}`}>
      <PageFormSkeleton />
      <span className="sr-only">
        {label}. {detail}
      </span>
    </div>
  );
}
