"use client";

import type { FormEvent, ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button, ButtonActions } from "@/components/ui/Button";

type FilterPanelProps = {
  children: ReactNode;
  /** Optional heading above the filter controls. */
  title?: string;
  onApply?: () => void;
  onReset?: () => void;
  /** When true, render Apply/Reset using shared labels. Default true if either handler is set. */
  showActions?: boolean;
  applyLabel?: string;
  resetLabel?: string;
  className?: string;
  /** Wrap children in a form and submit via Apply. */
  asForm?: boolean;
};

/**
 * Layout shell for feature-provided filter controls.
 * Does not define domain-specific filters.
 */
export function FilterPanel({
  children,
  title,
  onApply,
  onReset,
  showActions,
  applyLabel,
  resetLabel,
  className = "",
  asForm = false,
}: FilterPanelProps) {
  const t = useTranslations("ui");
  const tCommon = useTranslations("common");

  const shouldShowActions =
    showActions ?? Boolean(onApply || onReset);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onApply?.();
  }

  const content = (
    <>
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-slate-800">
          {title ?? t("filtersHeading")}
        </h2>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        {children}
      </div>

      {shouldShowActions ? (
        <ButtonActions className="mt-4">
          {onReset ? (
            <Button type="button" variant="secondary" onClick={onReset}>
              {resetLabel ?? tCommon("reset")}
            </Button>
          ) : null}
          {onApply ? (
            <Button type={asForm ? "submit" : "button"} onClick={asForm ? undefined : onApply}>
              {applyLabel ?? tCommon("apply")}
            </Button>
          ) : null}
        </ButtonActions>
      ) : null}
    </>
  );

  const shellClass = `rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5 ${className}`.trim();

  if (asForm) {
    return (
      <form className={shellClass} onSubmit={handleSubmit}>
        {content}
      </form>
    );
  }

  return <section className={shellClass}>{content}</section>;
}
