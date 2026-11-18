import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: ReactNode;
  className?: string;
};

/**
 * Page-level heading used across feature modules.
 * Callers supply already-translated title/description strings.
 */
export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className = "",
}: PageHeaderProps) {
  return (
    <header
      className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between ${className}`.trim()}
    >
      <div className="min-w-0">
        {breadcrumbs ? (
          <div className="mb-2 text-xs text-muted">{breadcrumbs}</div>
        ) : null}
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
