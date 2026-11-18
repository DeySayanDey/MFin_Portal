"use client";

import { useTranslations } from "next-intl";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { SelectField } from "@/components/ui/Form";

export type DepositSchemeChargesFilterValues = {
  schemeId: string;
  chargesId: string;
  isActive: "" | "1" | "0";
};

type DepositSchemeChargesFiltersProps = {
  values: DepositSchemeChargesFilterValues;
  schemes?: { id: number; schemeName: string }[];
  charges?: { chargeId: number; chargeName: string }[];
  onChange: (values: DepositSchemeChargesFilterValues) => void;
  onReset: () => void;
};

export function DepositSchemeChargesFilters({
  values,
  schemes = [],
  charges = [],
  onChange,
  onReset,
}: DepositSchemeChargesFiltersProps) {
  const t = useTranslations("master.depositSchemes.charges");
  const tUi = useTranslations("ui");

  const schemeFilterOptions = [
    { value: "", label: t("filters.schemeAll") },
    ...schemes.map((scheme) => ({
      value: String(scheme.id),
      label: scheme.schemeName,
    })),
  ];

  const chargeFilterOptions = [
    { value: "", label: t("filters.chargeAll") },
    ...charges.map((charge) => ({
      value: String(charge.chargeId),
      label: charge.chargeName,
    })),
  ];

  return (
    <FilterPanel onReset={onReset}>
      <div className="min-w-[10rem] sm:max-w-[13rem]">
        <SelectField
          label={t("filters.scheme")}
          value={values.schemeId}
          placeholder={t("filters.schemeAll")}
          searchPlaceholder={tUi("selectSearch")}
          emptyMessage={tUi("selectEmpty")}
          onChange={(schemeId) => onChange({ ...values, schemeId })}
          options={schemeFilterOptions}
        />
      </div>

      <div className="min-w-[10rem] sm:max-w-[13rem]">
        <SelectField
          label={t("filters.charge")}
          value={values.chargesId}
          placeholder={t("filters.chargeAll")}
          searchPlaceholder={tUi("selectSearch")}
          emptyMessage={tUi("selectEmpty")}
          onChange={(chargesId) => onChange({ ...values, chargesId })}
          options={chargeFilterOptions}
        />
      </div>

      <div className="min-w-[8rem] sm:max-w-[10rem]">
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
              isActive: isActive as DepositSchemeChargesFilterValues["isActive"],
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
