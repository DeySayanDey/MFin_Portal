"use client";

import { useTranslations } from "next-intl";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { Input } from "@/components/ui/Input";
import { DateField, SelectField } from "@/components/ui/Form";
import type { LoanSchemeChoice } from "../types/loan-roi-slabs.types";

export type LoanRoiSlabFilterValues = {
  schemeId: string;
  amount: string;
  effectiveOn: string;
  isActive: "" | "1" | "0";
};

type LoanRoiSlabsFiltersProps = {
  values: LoanRoiSlabFilterValues;
  schemes: LoanSchemeChoice[];
  onChange: (values: LoanRoiSlabFilterValues) => void;
  onReset: () => void;
};

export function LoanRoiSlabsFilters({
  values,
  schemes,
  onChange,
  onReset,
}: LoanRoiSlabsFiltersProps) {
  const t = useTranslations("master.loanRoiSlabs");
  const tUi = useTranslations("ui");

  const schemeOptions = [
    { value: "", label: t("filters.schemeAll") },
    ...schemes.map((scheme) => ({
      value: String(scheme.id),
      label: `${scheme.schemeName} (${scheme.schemeCode})`,
    })),
  ];

  return (
    <FilterPanel onReset={onReset}>
      <div className="min-w-[12rem] flex-1 sm:max-w-xs">
        <SelectField
          label={t("filters.scheme")}
          value={values.schemeId}
          placeholder={t("filters.schemeAll")}
          searchPlaceholder={tUi("selectSearch")}
          emptyMessage={tUi("selectEmpty")}
          onChange={(schemeId) => onChange({ ...values, schemeId })}
          options={schemeOptions}
        />
      </div>

      <label className="relative block min-w-[10rem] sm:max-w-[12rem]">
        <span className="mb-1.5 block text-xs font-semibold text-slate-600">
          {t("filters.amount")}
        </span>
        <Input
          value={values.amount}
          inputMode="decimal"
          placeholder={t("filters.amountPlaceholder")}
          onChange={(event) =>
            onChange({ ...values, amount: event.target.value })
          }
        />
      </label>

      <div className="min-w-[11rem] sm:max-w-[14rem]">
        <DateField
          label={t("filters.effectiveOn")}
          value={values.effectiveOn}
          onChange={(effectiveOn) => onChange({ ...values, effectiveOn })}
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
              isActive: isActive as LoanRoiSlabFilterValues["isActive"],
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
