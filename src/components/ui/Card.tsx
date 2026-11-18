import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  trailing?: ReactNode;
};

/** Standard content card used by Master and report pages. */
export function Card({
  children,
  className = "",
  title,
  description,
  trailing,
}: CardProps) {
  return (
    <section
      className={`rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5 ${className}`.trim()}
    >
      {title || trailing ? (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-muted">{description}</p>
            ) : null}
          </div>
          {trailing ? (
            <div className="flex shrink-0 justify-end">{trailing}</div>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
