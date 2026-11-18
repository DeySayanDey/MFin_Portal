"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Form";

export type RoleFilterValues = {
  keyword: string;
  status: "" | "1" | "0";
  isAdmin: "" | "1" | "0";
};

type RolesFiltersProps = {
  values: RoleFilterValues;
  onChange: (values: RoleFilterValues) => void;
  onReset: () => void;
};

export function RolesFilters({
  values,
  onChange,
  onReset,
}: RolesFiltersProps) {
  const t = useTranslations("master.roles");
  const tUi = useTranslations("ui");
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

        <div className="min-w-[9rem] sm:max-w-[12rem]">
          <SelectField
            label={t("filters.status")}
            value={values.status}
            searchable={false}
            placeholder={t("filters.statusAll")}
            searchPlaceholder={tUi("selectSearch")}
            emptyMessage={tUi("selectEmpty")}
            onChange={(status) =>
              onChange({
                ...values,
                status: status as RoleFilterValues["status"],
              })
            }
            options={[
              { value: "", label: t("filters.statusAll") },
              { value: "1", label: t("statusActive") },
              { value: "0", label: t("statusInactive") },
            ]}
          />
        </div>

        <div className="min-w-[9rem] sm:max-w-[12rem]">
          <SelectField
            label={t("filters.isAdmin")}
            value={values.isAdmin}
            searchable={false}
            placeholder={t("filters.isAdminAll")}
            searchPlaceholder={tUi("selectSearch")}
            emptyMessage={tUi("selectEmpty")}
            onChange={(isAdmin) =>
              onChange({
                ...values,
                isAdmin: isAdmin as RoleFilterValues["isAdmin"],
              })
            }
            options={[
              { value: "", label: t("filters.isAdminAll") },
              { value: "1", label: t("filters.isAdminYes") },
              { value: "0", label: t("filters.isAdminNo") },
            ]}
          />
        </div>

    </FilterPanel>
  );
}
