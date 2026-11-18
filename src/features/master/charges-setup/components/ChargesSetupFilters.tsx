"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Form";
import type { ApplOption } from "@/features/master/appl-options";
import type { ChargeKind } from "../types/charges-setup.types";

export type ChargesSetupFilterValues = {
  search: string;
  figureCd: string;
  duringCd: string;
  isRefundable: "" | "1" | "0";
  isActive: "" | "1" | "0";
};

type ChargesSetupFiltersProps = {
  kind: ChargeKind;
  values: ChargesSetupFilterValues;
  figureOptions: ApplOption[];
  duringOptions: ApplOption[];
  onChange: (values: ChargesSetupFilterValues) => void;
  onReset: () => void;
};

export function ChargesSetupFilters({
  kind,
  values,
  figureOptions,
  duringOptions,
  onChange,
  onReset,
}: ChargesSetupFiltersProps) {
  const t = useTranslations("master.chargesSetup");
  const tUi = useTranslations("ui");
  const duringLabel =
    kind === "loan" ? t("fields.deductDuringCd") : t("fields.chargesDuringCd");

  const figureFilterOptions = [
    { value: "", label: t("filters.figureAll") },
    ...figureOptions.map((option) => ({
      value: String(option.optCode),
      label: option.optDescription,
    })),
  ];

  const duringFilterOptions = [
    { value: "", label: t("filters.duringAll") },
    ...duringOptions.map((option) => ({
      value: String(option.optCode),
      label: option.optDescription,
    })),
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
            placeholder={t("filters.searchPlaceholder")}
            className="pl-9"
          />
        </span>
      </label>

      <div className="min-w-[10rem] sm:max-w-[13rem]">
        <SelectField
          label={t("filters.figure")}
          value={values.figureCd}
          placeholder={t("filters.figureAll")}
          searchPlaceholder={tUi("selectSearch")}
          emptyMessage={tUi("selectEmpty")}
          onChange={(figureCd) => onChange({ ...values, figureCd })}
          options={figureFilterOptions}
        />
      </div>

      <div className="min-w-[10rem] sm:max-w-[14rem]">
        <SelectField
          label={duringLabel}
          value={values.duringCd}
          placeholder={t("filters.duringAll")}
          searchPlaceholder={tUi("selectSearch")}
          emptyMessage={tUi("selectEmpty")}
          onChange={(duringCd) => onChange({ ...values, duringCd })}
          options={duringFilterOptions}
        />
      </div>

      {kind === "loan" ? (
        <div className="min-w-[10rem] sm:max-w-[12rem]">
          <SelectField
            label={t("filters.refundable")}
            value={values.isRefundable}
            searchable={false}
            onChange={(isRefundable) =>
              onChange({
                ...values,
                isRefundable: isRefundable as ChargesSetupFilterValues["isRefundable"],
              })
            }
            options={[
              { value: "", label: t("filters.refundableAll") },
              { value: "1", label: t("refundable") },
              { value: "0", label: t("nonRefundable") },
            ]}
          />
        </div>
      ) : null}

      <div className="min-w-[8rem] sm:max-w-[10rem]">
        <SelectField
          label={t("filters.status")}
          value={values.isActive}
          searchable={false}
          onChange={(isActive) =>
            onChange({
              ...values,
              isActive: isActive as ChargesSetupFilterValues["isActive"],
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
