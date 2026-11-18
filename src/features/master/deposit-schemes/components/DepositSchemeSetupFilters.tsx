"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Form";
import { fetchApplOptions } from "@/features/master/appl-options";
import type { ApplOption } from "@/features/master/appl-options";

export type DepositSchemeSetupFilterValues = {
  search: string;
  depositTypeCd: string;
  isActive: "" | "1" | "0";
};

type DepositSchemeSetupFiltersProps = {
  values: DepositSchemeSetupFilterValues;
  onChange: (values: DepositSchemeSetupFilterValues) => void;
  onReset: () => void;
};

export function DepositSchemeSetupFilters({
  values,
  onChange,
  onReset,
}: DepositSchemeSetupFiltersProps) {
  const t = useTranslations("master.depositSchemes.setup");
  const tUi = useTranslations("ui");

  const [depositTypeOptions, setDepositTypeOptions] = useState<ApplOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function loadDepositTypes() {
      try {
        const options = await fetchApplOptions(3); // Opt_Grp_Id = 3
        if (!cancelled) setDepositTypeOptions(options);
      } catch {
        // keep fallback
      }
    }
    void loadDepositTypes();
    return () => {
      cancelled = true;
    };
  }, []);

  const depositTypeSelectOptions = [
    { value: "", label: t("filters.depositTypeAll") },
    ...depositTypeOptions.map((o) => ({
      value: String(o.optCode),
      label: o.optDescription,
    })),
  ];

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
          label={t("filters.depositType")}
          value={values.depositTypeCd}
          searchable={false}
          placeholder={t("filters.depositTypeAll")}
          searchPlaceholder={tUi("selectSearch")}
          emptyMessage={tUi("selectEmpty")}
          onChange={(depositTypeCd) =>
            onChange({ ...values, depositTypeCd })
          }
          options={depositTypeSelectOptions}
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
              isActive: isActive as DepositSchemeSetupFilterValues["isActive"],
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
