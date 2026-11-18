"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Form";

export type AcctLedgerFilterValues = {
  keyword: string;
  categId: string;
  mainhdId: string;
  ledgerType: string;
  isActive: "" | "1" | "0";
};

export type AcctLedgerMainHeadOption = {
  value: string;
  label: string;
};

type AcctLedgerFiltersProps = {
  values: AcctLedgerFilterValues;
  mainHeads: AcctLedgerMainHeadOption[];
  categories: AcctLedgerMainHeadOption[];
  categoryOptionsError: boolean;
  mainHeadsLoading: boolean;
  mainHeadsError: boolean;
  ledgerTypes: AcctLedgerMainHeadOption[];
  ledgerTypesError: boolean;
  onChange: (values: AcctLedgerFilterValues) => void;
  onReset: () => void;
};

export function AcctLedgerFilters({
  values,
  mainHeads,
  categories,
  categoryOptionsError,
  mainHeadsLoading,
  mainHeadsError,
  ledgerTypes,
  ledgerTypesError,
  onChange,
  onReset,
}: AcctLedgerFiltersProps) {
  const t = useTranslations("master.acctLedger");
  const tUi = useTranslations("ui");
  const tHead = useTranslations("master.acctHead");
  const tCategory = useTranslations("master.acctCategory");
  const tErrors = useTranslations("errors");
  return (
    <FilterPanel onReset={onReset}>
        <label className="relative block min-w-[14rem] flex-1 sm:max-w-md">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            {t("filters.search")}
          </span>
          <span className="relative block">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
            <Input
              value={values.keyword}
              onChange={(event) =>
                onChange({ ...values, keyword: event.target.value })
              }
              placeholder={t("filters.searchPlaceholder")}
              className="pl-9"
            />
          </span>
        </label>

        <div className="min-w-[12rem] sm:max-w-[16rem]">
          <SelectField
            label={tHead("filters.category")}
            value={values.categId}
            searchable
            disabled={categoryOptionsError}
            hint={categoryOptionsError ? tErrors("generic") : undefined}
            placeholder={tHead("filters.categoryAll")}
            searchPlaceholder={tUi("selectSearch")}
            emptyMessage={tUi("selectEmpty")}
            onChange={(categId) => onChange({ ...values, categId, mainhdId: "" })}
            options={[{ value: "", label: tHead("filters.categoryAll") }, ...categories]}
          />
        </div>

        <div className="min-w-[12rem] sm:max-w-[16rem]">
          <SelectField
            label={t("filters.mainHead")}
            value={values.mainhdId}
            searchable
            disabled={mainHeadsLoading || mainHeadsError}
            hint={mainHeadsError ? tErrors("generic") : undefined}
            placeholder={t("filters.mainHeadAll")}
            searchPlaceholder={tUi("selectSearch")}
            emptyMessage={tUi("selectEmpty")}
            onChange={(mainhdId) => onChange({ ...values, mainhdId })}
            options={[
              { value: "", label: t("filters.mainHeadAll") },
              ...mainHeads,
            ]}
          />
        </div>

        <div className="min-w-[10rem] sm:max-w-[14rem]">
          <SelectField
            label={t("filters.ledgerType")}
            value={values.ledgerType}
            disabled={ledgerTypesError}
            placeholder={tCategory("filters.categoryTypeAll")}
            options={[{ value: "", label: tCategory("filters.categoryTypeAll") }, ...ledgerTypes]}
            onChange={(ledgerType) => onChange({ ...values, ledgerType })}
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
                isActive: isActive as AcctLedgerFilterValues["isActive"],
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
