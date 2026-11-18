"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Form";
import { fetchApplOptions } from "@/features/master/appl-options";
import type { ApplOption } from "@/features/master/appl-options";
import {
  LOAN_PRODUCT_TYPE_OPT_GRP_ID,
  LOAN_REPAY_TYPE_OPT_GRP_ID,
} from "../constants";

export type LoanSchemeSetupFilterValues = {
  search: string;
  productTypeCd: string;
  repayTypeCd: string;
  isActive: "" | "1" | "0";
};

type LoanSchemeSetupFiltersProps = {
  values: LoanSchemeSetupFilterValues;
  onChange: (values: LoanSchemeSetupFilterValues) => void;
  onReset: () => void;
};

export function LoanSchemeSetupFilters({
  values,
  onChange,
  onReset,
}: LoanSchemeSetupFiltersProps) {
  const t = useTranslations("master.loanSchemes.setup");
  const tUi = useTranslations("ui");
  const [productTypes, setProductTypes] = useState<ApplOption[]>([]);
  const [repayTypes, setRepayTypes] = useState<ApplOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [products, repays] = await Promise.all([
          fetchApplOptions(LOAN_PRODUCT_TYPE_OPT_GRP_ID),
          fetchApplOptions(LOAN_REPAY_TYPE_OPT_GRP_ID),
        ]);
        if (cancelled) return;
        setProductTypes(products);
        setRepayTypes(repays);
      } catch {
        // Filters stay usable without the option lists.
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <FilterPanel onReset={onReset}>
      <label className="relative block min-w-[14rem] flex-1 sm:max-w-md">
        <span className="mb-1.5 block text-xs font-semibold text-foreground">
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
          label={t("filters.productType")}
          value={values.productTypeCd}
          placeholder={t("filters.productTypeAll")}
          searchPlaceholder={tUi("selectSearch")}
          emptyMessage={tUi("selectEmpty")}
          onChange={(productTypeCd) => onChange({ ...values, productTypeCd })}
          options={[
            { value: "", label: t("filters.productTypeAll") },
            ...productTypes.map((option) => ({
              value: String(option.optCode),
              label: option.optDescription,
            })),
          ]}
        />
      </div>

      <div className="min-w-[10rem] sm:max-w-[14rem]">
        <SelectField
          label={t("filters.repayType")}
          value={values.repayTypeCd}
          placeholder={t("filters.repayTypeAll")}
          searchPlaceholder={tUi("selectSearch")}
          emptyMessage={tUi("selectEmpty")}
          onChange={(repayTypeCd) => onChange({ ...values, repayTypeCd })}
          options={[
            { value: "", label: t("filters.repayTypeAll") },
            ...repayTypes.map((option) => ({
              value: String(option.optCode),
              label: option.optDescription,
            })),
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
              isActive: isActive as LoanSchemeSetupFilterValues["isActive"],
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
