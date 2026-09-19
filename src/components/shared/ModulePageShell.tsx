"use client";

import type { ReactNode } from "react";
import type { ModulePageMeta } from "@/lib/modules/module.types";

type ModulePageShellProps = {
  /** Serializable meta from `ModulePage.toJSON()` (kept for callers; title lives in layout Header). */
  page: ModulePageMeta;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/**
 * Common page chrome for Master (and other) modules.
 * Page title/subtitle are rendered by the app Header — this shell only wraps content + actions.
 */
export function ModulePageShell({
  children,
  actions,
  className = "",
}: ModulePageShellProps) {
  return (
    <div className={`flex min-w-0 flex-col gap-4 sm:gap-5 ${className}`.trim()}>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {actions}
        </div>
      ) : null}
      {children}
    </div>
  );
}
