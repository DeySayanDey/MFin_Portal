"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import type { DataTablePaginationConfig } from "./types";

type DataTablePaginationProps = DataTablePaginationConfig & {
  className?: string;
};

function resolveTotalPages(pageSize: number, total: number, totalPages?: number) {
  if (typeof totalPages === "number" && totalPages >= 1) {
    return totalPages;
  }
  if (pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

export function DataTablePagination({
  page,
  pageSize,
  total,
  totalPages: totalPagesProp,
  pageSizeOptions = [10, 20, 50],
  onPageChange,
  onPageSizeChange,
  className = "",
}: DataTablePaginationProps) {
  const t = useTranslations("ui");
  const tCommon = useTranslations("common");

  const totalPages = resolveTotalPages(pageSize, total, totalPagesProp);
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = total === 0 ? 0 : Math.min(safePage * pageSize, total);
  const canPrev = safePage > 1;
  const canNext = safePage < totalPages;

  return (
    <div
      className={`flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between ${className}`.trim()}
    >
      <p className="text-xs text-muted" aria-live="polite">
        {t("showingRecords", { from, to, total })}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {onPageSizeChange ? (
          <label className="inline-flex items-center gap-2 text-xs text-muted">
            <span className="whitespace-nowrap">{t("rowsPerPage")}</span>
            <Select
              size="sm"
              searchable={false}
              className="w-[4.5rem]"
              aria-label={t("rowsPerPage")}
              value={String(pageSize)}
              onChange={(next) =>
                onPageSizeChange(Number(next) || pageSize)
              }
              options={pageSizeOptions.map((size) => ({
                value: String(size),
                label: String(size),
              }))}
            />
          </label>
        ) : null}

        <p className="text-xs font-medium text-slate-600">
          {t("pageOf", { page: safePage, totalPages })}
        </p>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={ChevronLeft}
            disabled={!canPrev}
            onClick={() => onPageChange(safePage - 1)}
            aria-label={tCommon("previous")}
          >
            {tCommon("previous")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!canNext}
            onClick={() => onPageChange(safePage + 1)}
            aria-label={tCommon("next")}
          >
            {tCommon("next")}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
