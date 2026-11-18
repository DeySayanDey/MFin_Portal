"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Form";
import type { ApplOption } from "@/features/master/appl-options";

export type DepositInterestFilterValues = {
  search: string;
  schemeId: string;
  termCd: string;
  isActive: "" | "1" | "0";
};

type DepositInterestFiltersProps = {
  values: DepositInterestFilterValues;
  schemes?: { id: number; schemeName: string }[];
  termOptions?: ApplOption[];
  onChange: (values: DepositInterestFilterValues) => void;
  onReset: () => void;
};

export function DepositInterestFilters({
  values,
  schemes = [],
  termOptions = [],
  onChange,
  onReset,
}: DepositInterestFiltersProps) {
  const t = useTranslations("master.depositInterest");
  const tUi = useTranslations("ui");

  const schemeFilterOptions = [
    { value: "", label: t("filters.schemeAll", { fallback: "All Schemes" }) },
    ...schemes.map((s) => ({ value: String(s.id), label: s.schemeName })),
  ];

  const termFilterOptions = [
    { value: "", label: t("filters.termAll", { fallback: "All Term Units" }) },
    ...(termOptions.length > 0
      ? termOptions.map((o) => ({
          value: String(o.optCode),
          label: o.optDescription,
        }))
      : [
          { value: "1", label: "Days" },
          { value: "2", label: "Months" },
          { value: "3", label: "Year" },
        ]),
  ];

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
            placeholder={t("filters.searchPlaceholder", {
              fallback: "Search by scheme name or code...",
            })}
            className="pl-9"
          />
        </span>
      </label>

      <div className="min-w-[10rem] sm:max-w-[13rem]">
        <SelectField
          label={t("fields.scheme", { fallback: "Deposit Scheme" })}
          value={values.schemeId}
          placeholder={t("filters.schemeAll", { fallback: "All Schemes" })}
          searchPlaceholder={tUi("selectSearch")}
          emptyMessage={tUi("selectEmpty")}
          onChange={(schemeId) => onChange({ ...values, schemeId })}
          options={schemeFilterOptions}
        />
      </div>

      <div className="min-w-[10rem] sm:max-w-[13rem]">
        <SelectField
          label={t("fields.termType", { fallback: "Term Unit" })}
          value={values.termCd}
          placeholder={t("filters.termAll", { fallback: "All Term Units" })}
          searchPlaceholder={tUi("selectSearch")}
          emptyMessage={tUi("selectEmpty")}
          onChange={(termCd) => onChange({ ...values, termCd })}
          options={termFilterOptions}
        />
      </div>

      <div className="min-w-[8rem] sm:max-w-[10rem]">
        <SelectField
          label={t("filters.status", { fallback: "Status" })}
          value={values.isActive}
          searchable={false}
          onChange={(isActive) =>
            onChange({
              ...values,
              isActive: isActive as DepositInterestFilterValues["isActive"],
            })
          }
          options={[
            {
              value: "",
              label: t("filters.statusAll", { fallback: "All" }),
            },
            {
              value: "1",
              label: t("statusActive", { fallback: "Active" }),
            },
            {
              value: "0",
              label: t("statusInactive", { fallback: "Inactive" }),
            },
          ]}
        />
      </div>
    </FilterPanel>
  );
}
