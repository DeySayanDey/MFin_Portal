"use client";

import { RotateCcw, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SelectField, TextField } from "@/components/ui/Form";

export type CodeSeriesFilterValues = {
  keyword: string;
  moduleKey: string;
  status: "" | "1" | "0";
};

type CodeSeriesFiltersProps = {
  values: CodeSeriesFilterValues;
  onChange: (values: CodeSeriesFilterValues) => void;
  onReset: () => void;
};

/**
 * Single live filter bar — search hits the API (debounced in the parent).
 * No second “table-only” search.
 */
export function CodeSeriesFilters({
  values,
  onChange,
  onReset,
}: CodeSeriesFiltersProps) {
  const t = useTranslations("master.codeSeries");
  const tUi = useTranslations("ui");
  const tCommon = useTranslations("common");

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <label className="relative block min-w-[14rem] flex-1 sm:max-w-md">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            {t("filters.search")}
          </span>
          <span className="relative block">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
            <Input
              value={values.keyword}
              onChange={(event) =>
                onChange({ ...values, keyword: event.target.value })
              }
              placeholder={t("filters.searchPlaceholder")}
              className="pl-9"
              aria-label={t("filters.search")}
            />
          </span>
        </label>

        <div className="min-w-[10rem] sm:max-w-[14rem]">
          <TextField
            label={t("filters.moduleKey")}
            value={values.moduleKey}
            placeholder={t("filters.moduleKeyPlaceholder")}
            onChange={(moduleKey) => onChange({ ...values, moduleKey })}
          />
        </div>

        <div className="min-w-[9rem] sm:max-w-[12rem]">
          <SelectField
            label={t("filters.status")}
            value={values.status}
            searchable={false}
            placeholder={t("filters.statusAll")}
            searchPlaceholder={tUi("selectSearch")}
            emptyMessage={tUi("selectEmpty")}
            onChange={(status) =>
              onChange({
                ...values,
                status: status as CodeSeriesFilterValues["status"],
              })
            }
            options={[
              { value: "", label: t("filters.statusAll") },
              { value: "1", label: t("statusActive") },
              { value: "0", label: t("statusInactive") },
            ]}
          />
        </div>

        <Button type="button" variant="secondary" icon={RotateCcw} onClick={onReset}>
          {tCommon("reset")}
        </Button>
      </div>
    </div>
  );
}
