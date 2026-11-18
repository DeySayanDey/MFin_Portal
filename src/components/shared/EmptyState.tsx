"use client";

import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { useTranslations } from "next-intl";

type EmptyStateProps = {
  title?: string;
  message?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  message,
  action,
  icon,
  className = "",
}: EmptyStateProps) {
  const t = useTranslations("ui");

  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center gap-3 px-4 py-10 text-center ${className}`.trim()}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-muted text-muted">
        {icon ?? <Inbox className="h-5 w-5" aria-hidden="true" />}
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-800">
          {title ?? t("emptyTitle")}
        </p>
        <p className="max-w-md text-sm text-muted">
          {message ?? t("emptyMessage")}
        </p>
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
