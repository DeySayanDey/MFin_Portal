"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Form";
import { LOAN_ELIGIBILITY_DATA_TYPES } from "../constants";

export type LoanEligibilityFilterValues = {
  search: string;
  dataType: string;
  isMandatory: "" | "1" | "0";
  isActive: "" | "1" | "0";
};

type LoanEligibilityFiltersProps = {
  values: LoanEligibilityFilterValues;
  onChange: (values: LoanEligibilityFilterValues) => void;
  onReset: () => void;
};

export function LoanEligibilityFilters({
  values,
  onChange,
  onReset,
}: LoanEligibilityFiltersProps) {
  const t = useTranslations("master.loanEligibility");
  const tUi = useTranslations("ui");

  return (
    <FilterPanel onReset={onReset}>
      <label className="relative block min-w-[14rem] flex-1 sm:max-w-xs">
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

      <div className="min-w-[10rem] sm:max-w-[13rem]">
        <SelectField
          label={t("filters.dataType")}
          value={values.dataType}
          placeholder={t("filters.dataTypeAll")}
          searchPlaceholder={tUi("selectSearch")}
          emptyMessage={tUi("selectEmpty")}
          onChange={(dataType) => onChange({ ...values, dataType })}
          options={[
            { value: "", label: t("filters.dataTypeAll") },
            ...LOAN_ELIGIBILITY_DATA_TYPES.map((type) => ({
              value: type,
              label: t(`dataTypes.${type}`),
            })),
          ]}
        />
      </div>

      <div className="min-w-[9rem] sm:max-w-[12rem]">
        <SelectField
          label={t("filters.mandatory")}
          value={values.isMandatory}
          searchable={false}
          onChange={(isMandatory) =>
            onChange({
              ...values,
              isMandatory: isMandatory as LoanEligibilityFilterValues["isMandatory"],
            })
          }
          options={[
            { value: "", label: t("filters.mandatoryAll") },
            { value: "1", label: t("yes") },
            { value: "0", label: t("no") },
          ]}
        />
      </div>

      <div className="min-w-[8rem] sm:max-w-[10rem]">
        <SelectField
          label={t("filters.status")}
          value={values.isActive}
          searchable={false}
          onChange={(isActive) =>
            onChange({
              ...values,
              isActive: isActive as LoanEligibilityFilterValues["isActive"],
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
