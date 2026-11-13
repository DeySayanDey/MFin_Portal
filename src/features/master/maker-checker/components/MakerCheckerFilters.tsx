"use client";

import { useTranslations } from "next-intl";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { SelectField } from "@/components/ui/Form";

export type MakerCheckerFilterValues = {
  voucherType: string;
  isActive: "" | "1" | "0";
};

type MakerCheckerFiltersProps = {
  values: MakerCheckerFilterValues;
  voucherOptions: Array<{ value: string; label: string }>;
  voucherTypesDisabled: boolean;
  onChange: (values: MakerCheckerFilterValues) => void;
  onReset: () => void;
};

export function MakerCheckerFilters({
  values,
  voucherOptions,
  voucherTypesDisabled,
  onChange,
  onReset,
}: MakerCheckerFiltersProps) {
  const t = useTranslations("master.makerChecker");
  const tUi = useTranslations("ui");

  return (
    <FilterPanel onReset={onReset}>
      <div className="min-w-[10rem] sm:max-w-[14rem]">
        <SelectField
          label={t("filters.voucherType")}
          value={values.voucherType}
          searchable
          disabled={voucherTypesDisabled}
          placeholder={t("filters.statusAll")}
          searchPlaceholder={tUi("selectSearch")}
          emptyMessage={tUi("selectEmpty")}
          options={[{ value: "", label: t("filters.statusAll") }, ...voucherOptions]}
          onChange={(voucherType) => onChange({ ...values, voucherType })}
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
              isActive: isActive as MakerCheckerFilterValues["isActive"],
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
