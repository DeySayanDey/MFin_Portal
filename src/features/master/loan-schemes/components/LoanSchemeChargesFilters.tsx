"use client";

import { useTranslations } from "next-intl";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { SelectField } from "@/components/ui/Form";

export type LoanSchemeChargesFilterValues = {
  schemeId: string;
  chargeId: string;
  isActive: "" | "1" | "0";
};

type LoanSchemeChargesFiltersProps = {
  values: LoanSchemeChargesFilterValues;
  schemes?: { id: number; schemeName: string }[];
  charges?: { chargeId: number; chargeName: string }[];
  onChange: (values: LoanSchemeChargesFilterValues) => void;
  onReset: () => void;
};

export function LoanSchemeChargesFilters({
  values,
  schemes = [],
  charges = [],
  onChange,
  onReset,
}: LoanSchemeChargesFiltersProps) {
  const t = useTranslations("master.loanSchemes.charges");
  const tUi = useTranslations("ui");

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
          options={[
            { value: "", label: t("filters.schemeAll") },
            ...schemes.map((scheme) => ({
              value: String(scheme.id),
              label: scheme.schemeName,
            })),
          ]}
        />
      </div>

      <div className="min-w-[10rem] sm:max-w-[13rem]">
        <SelectField
          label={t("filters.charge")}
          value={values.chargeId}
          placeholder={t("filters.chargeAll")}
          searchPlaceholder={tUi("selectSearch")}
          emptyMessage={tUi("selectEmpty")}
          onChange={(chargeId) => onChange({ ...values, chargeId })}
          options={[
            { value: "", label: t("filters.chargeAll") },
            ...charges.map((charge) => ({
              value: String(charge.chargeId),
              label: charge.chargeName,
            })),
          ]}
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
              isActive: isActive as LoanSchemeChargesFilterValues["isActive"],
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
