"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { Input } from "@/components/ui/Input";
import { SelectField, DateField } from "@/components/ui/Form";
import {
  HOLIDAY_TYPE_FESTIVAL,
  HOLIDAY_TYPE_NATIONAL,
} from "@/features/master/holiday/types/holiday.types";

export type HolidayFilterValues = {
  search: string;
  yearSl: string;
  holiType: "" | "1" | "2";
  fromDate: string;
  toDate: string;
};

type YearOption = { value: string; label: string };

type HolidayFiltersProps = {
  values: HolidayFilterValues;
  yearOptions: YearOption[];
  onChange: (values: HolidayFilterValues) => void;
  onReset: () => void;
};

export function HolidayFilters({
  values,
  yearOptions,
  onChange,
  onReset,
}: HolidayFiltersProps) {
  const t = useTranslations("master.holiday");
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
              value={values.search}
              onChange={(event) =>
                onChange({ ...values, search: event.target.value })
              }
              placeholder={t("filters.searchPlaceholder")}
              className="pl-9"
            />
          </span>
        </label>

        <div className="min-w-[10rem] sm:max-w-[14rem]">
          <SelectField
            label={t("filters.year")}
            value={values.yearSl}
            searchable
            placeholder={t("filters.yearAll")}
            searchPlaceholder={tUi("selectSearch")}
            emptyMessage={tUi("selectEmpty")}
            onChange={(yearSl) => onChange({ ...values, yearSl })}
            options={[
              { value: "", label: t("filters.yearAll") },
              ...yearOptions,
            ]}
          />
        </div>

        <div className="min-w-[9rem] sm:max-w-[12rem]">
          <SelectField
            label={t("filters.type")}
            value={values.holiType}
            searchable={false}
            placeholder={t("filters.typeAll")}
            searchPlaceholder={tUi("selectSearch")}
            emptyMessage={tUi("selectEmpty")}
            onChange={(holiType) =>
              onChange({
                ...values,
                holiType: holiType as HolidayFilterValues["holiType"],
              })
            }
            options={[
              { value: "", label: t("filters.typeAll") },
              {
                value: String(HOLIDAY_TYPE_NATIONAL),
                label: t("types.national"),
              },
              {
                value: String(HOLIDAY_TYPE_FESTIVAL),
                label: t("types.festival"),
              },
            ]}
          />
        </div>

        <div className="min-w-[9rem] sm:max-w-[11rem]">
          <DateField
            label={t("filters.fromDate")}
            value={values.fromDate}
            onChange={(fromDate) => onChange({ ...values, fromDate })}
          />
        </div>

        <div className="min-w-[9rem] sm:max-w-[11rem]">
          <DateField
            label={t("filters.toDate")}
            value={values.toDate}
            onChange={(toDate) => onChange({ ...values, toDate })}
          />
        </div>

    </FilterPanel>
  );
}
