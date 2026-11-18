"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Form";

export type AcctHeadFilterValues = {
  keyword: string;
  categId: string;
  isActive: "" | "1" | "0";
};

export type AcctHeadCategoryOption = {
  value: string;
  label: string;
};

type AcctHeadFiltersProps = {
  values: AcctHeadFilterValues;
  categories: AcctHeadCategoryOption[];
  onChange: (values: AcctHeadFilterValues) => void;
  onReset: () => void;
};

export function AcctHeadFilters({
  values,
  categories,
  onChange,
  onReset,
}: AcctHeadFiltersProps) {
  const t = useTranslations("master.acctHead");
  const tUi = useTranslations("ui");
  return (
    <FilterPanel onReset={onReset}>
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
            />
          </span>
        </label>

        <div className="min-w-[12rem] sm:max-w-[16rem]">
          <SelectField
            label={t("filters.category")}
            value={values.categId}
            searchable
            placeholder={t("filters.categoryAll")}
            searchPlaceholder={tUi("selectSearch")}
            emptyMessage={tUi("selectEmpty")}
            onChange={(categId) => onChange({ ...values, categId })}
            options={[
              { value: "", label: t("filters.categoryAll") },
              ...categories,
            ]}
          />
        </div>

        <div className="min-w-[9rem] sm:max-w-[12rem]">
          <SelectField
            label={t("filters.status")}
            value={values.isActive}
            searchable={false}
            placeholder={t("filters.statusAll")}
            searchPlaceholder={tUi("selectSearch")}
            emptyMessage={tUi("selectEmpty")}
            onChange={(isActive) =>
              onChange({
                ...values,
                isActive: isActive as AcctHeadFilterValues["isActive"],
              })
            }
            options={[
              { value: "", label: t("filters.statusAll") },
              { value: "1", label: t("statusActive") },
              { value: "0", label: t("statusInactive") },
            ]}
          />
        </div>

    </FilterPanel>
  );
}
