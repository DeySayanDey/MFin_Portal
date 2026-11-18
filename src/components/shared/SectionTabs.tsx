"use client";

import type { LucideIcon } from "lucide-react";
import { sectionTabsGridClass } from "@/components/shared/section-tabs-grid";

export type SectionTab<T extends string = string> = {
  id: T;
  title: string;
  /** Short line under the title. */
  description?: string;
  icon: LucideIcon;
};

type SectionTabsProps<T extends string> = {
  tabs: readonly SectionTab<T>[];
  activeId: T;
  onChange: (id: T) => void;
  label: string;
  /** Icon above the text, or beside it on one line. */
  layout?: "stack" | "inline";
};

/**
 * Section switcher for pages with more than one panel.
 * Two tabs stay card-sized on wide screens instead of stretching into bars.
 */
export function SectionTabs<T extends string>({
  tabs,
  activeId,
  onChange,
  label,
  layout = "inline",
}: SectionTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={`grid gap-3 ${sectionTabsGridClass(tabs.length)}`}
    >
      {tabs.map((tab) => {
        const active = activeId === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`group relative flex min-w-0 cursor-pointer overflow-hidden rounded-2xl border px-3.5 py-3 text-start transition-[background-color,border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1 motion-reduce:transition-none ${
              layout === "inline" ? "flex-row items-center gap-3" : "flex-col items-start gap-2.5"
            } ${
              active
                ? "border-brand bg-brand text-white shadow-[0_8px_20px_-10px_var(--color-brand)]"
                : "border-border bg-surface text-foreground hover:border-brand/40 hover:bg-brand-soft/40 hover:shadow-sm"
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-150 motion-reduce:transition-none ${
                active ? "bg-white/20 text-white" : "bg-brand-soft text-brand group-hover:bg-brand/15"
              }`}
              aria-hidden
            >
              <Icon className="h-4.5 w-4.5" />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-semibold leading-snug">{tab.title}</span>
              {tab.description ? (
                <span
                  className={`line-clamp-2 text-xs leading-snug ${active ? "text-white/80" : "text-muted"}`}
                >
                  {tab.description}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
