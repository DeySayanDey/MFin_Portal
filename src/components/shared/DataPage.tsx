"use client";

import type { ReactNode } from "react";
import { ModulePageShell } from "@/components/shared/ModulePageShell";
import type { ModulePageMeta } from "@/lib/modules/module.types";

type DataPageProps = {
  page: ModulePageMeta;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Common list and settings page.
 * Each feature passes its own filters, DataTable rows, and form.
 */
export function DataPage({ page, actions, children, className }: DataPageProps) {
  return (
    <ModulePageShell page={page} actions={actions} className={className}>
      {children}
    </ModulePageShell>
  );
}
