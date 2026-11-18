"use client";

import type { ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

type FilterPanelProps = {
  children: ReactNode;
  onReset?: () => void;
  resetLabel?: string;
  className?: string;
};

/**
 * Inline filter bar: fields and Reset sit on one wrapping row.
 * Feature screens supply the controls; this shell does not define them.
 */
export function FilterPanel({
  children,
  onReset,
  resetLabel,
  className = "",
}: FilterPanelProps) {
  const tCommon = useTranslations("common");

  return (
    <section
      className={`rounded-[var(--radius-card)] border border-border bg-surface p-3 shadow-[var(--shadow-card)] sm:p-4 ${className}`.trim()}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end [&>*]:w-full [&>*]:min-w-0 sm:[&>*]:w-auto sm:[&>*]:min-w-[10rem] sm:[&>*]:max-w-[18rem] sm:[&>*]:flex-1 sm:[&>button]:w-auto sm:[&>button]:max-w-none sm:[&>button]:min-w-0 sm:[&>button]:flex-none">
        {children}
        {onReset ? (
          <Button
            type="button"
            variant="secondary"
            icon={RotateCcw}
            className="w-full justify-center sm:w-auto"
            onClick={onReset}
          >
            {resetLabel ?? tCommon("reset")}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
