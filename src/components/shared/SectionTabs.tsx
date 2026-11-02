"use client";

import type { LucideIcon } from "lucide-react";

export type SectionTab<T extends string = string> = {
  id: T;
  title: string;
  icon: LucideIcon;
};

type SectionTabsProps<T extends string> = {
  tabs: readonly SectionTab<T>[];
  activeId: T;
  onChange: (id: T) => void;
  label: string;
  /** Icon above the title, or beside it on one line. */
  layout?: "stack" | "inline";
};

function gridClass(count: number): string {
  if (count <= 2) return "grid-cols-2 xl:grid-cols-4";
  if (count === 3) return "grid-cols-2 sm:grid-cols-3";
  if (count === 4) return "grid-cols-2 sm:grid-cols-2 xl:grid-cols-4";
  return "grid-cols-2 sm:grid-cols-3 xl:grid-cols-5";
}

/**
 * Compact section switcher used on master pages with more than one panel.
 * Two tabs stay card-sized on wide screens instead of stretching into bars.
 */
export function SectionTabs<T extends string>({
  tabs,
  activeId,
  onChange,
  label,
  layout = "stack",
}: SectionTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={`grid gap-2.5 ${gridClass(tabs.length)}`}
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
            className={`flex cursor-pointer rounded-2xl border px-3.5 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
              layout === "inline"
                ? "flex-row items-center gap-2"
                : "flex-col items-start gap-1.5"
            } ${
              active
                ? "border-brand bg-brand text-white shadow-sm"
                : "border-border bg-surface-muted text-foreground transition-colors duration-150 hover:border-brand/30 hover:bg-surface motion-reduce:transition-none"
            }`}
          >
            <Icon
              className={`h-4 w-4 ${active ? "text-white" : "text-muted"}`}
              aria-hidden
            />
            <span className="text-xs font-semibold leading-snug">
              {tab.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}
