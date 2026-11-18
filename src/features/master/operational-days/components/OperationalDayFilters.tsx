"use client";

import { useTranslations } from "next-intl";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { SelectField } from "@/components/ui/Form";

export type OperationalDayFilterValues = {
  branchId: string;
  dayOfWeek: string;
  isOperational: "" | "1" | "0";
  isActive: "" | "1" | "0";
};

type Option = { value: string; label: string };

type OperationalDayFiltersProps = {
  values: OperationalDayFilterValues;
  branchOptions: Option[];
  dayOptions: Option[];
  onChange: (values: OperationalDayFilterValues) => void;
  onReset: () => void;
};

export function OperationalDayFilters({
  values,
  branchOptions,
  dayOptions,
  onChange,
  onReset,
}: OperationalDayFiltersProps) {
  const t = useTranslations("master.operationalDays");
  const tUi = useTranslations("ui");
  return (
    <FilterPanel onReset={onReset}>
        <div className="min-w-[12rem] sm:max-w-[16rem]">
          <SelectField
            label={t("filters.branch")}
            value={values.branchId}
            searchable
            placeholder={t("filters.branchAll")}
            searchPlaceholder={tUi("selectSearch")}
            emptyMessage={tUi("selectEmpty")}
            onChange={(branchId) => onChange({ ...values, branchId })}
            options={[
              { value: "", label: t("filters.branchAll") },
              ...branchOptions,
            ]}
          />
        </div>

        <div className="min-w-[10rem] sm:max-w-[14rem]">
          <SelectField
            label={t("filters.dayOfWeek")}
            value={values.dayOfWeek}
            searchable={false}
            placeholder={t("filters.dayAll")}
            searchPlaceholder={tUi("selectSearch")}
            emptyMessage={tUi("selectEmpty")}
            onChange={(dayOfWeek) => onChange({ ...values, dayOfWeek })}
            options={[
              { value: "", label: t("filters.dayAll") },
              ...dayOptions,
            ]}
          />
        </div>

        <div className="min-w-[9rem] sm:max-w-[12rem]">
          <SelectField
            label={t("filters.isOperational")}
            value={values.isOperational}
            searchable={false}
            placeholder={t("filters.isOperationalAll")}
            searchPlaceholder={tUi("selectSearch")}
            emptyMessage={tUi("selectEmpty")}
            onChange={(isOperational) =>
              onChange({
                ...values,
                isOperational:
                  isOperational as OperationalDayFilterValues["isOperational"],
              })
            }
            options={[
              { value: "", label: t("filters.isOperationalAll") },
              { value: "1", label: t("filters.operationalYes") },
              { value: "0", label: t("filters.operationalNo") },
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
                isActive: isActive as OperationalDayFilterValues["isActive"],
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
