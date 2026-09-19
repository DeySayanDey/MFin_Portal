"use client";

import { RotateCcw, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Form";
import type { DesignationOption } from "@/features/master/staff/types/staff.types";
import type { Branch } from "@/features/master/branch/types/branch.types";

export type StaffFilterValues = {
  keyword: string;
  status: "" | "1" | "0";
  branchId: string;
  designationId: string;
};

type StaffFiltersProps = {
  values: StaffFilterValues;
  branches: Branch[];
  designations: DesignationOption[];
  onChange: (values: StaffFilterValues) => void;
  onReset: () => void;
};

export function StaffFilters({
  values,
  branches,
  designations,
  onChange,
  onReset,
}: StaffFiltersProps) {
  const t = useTranslations("master.staff");
  const tUi = useTranslations("ui");
  const tCommon = useTranslations("common");

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
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
                status: status as StaffFilterValues["status"],
              })
            }
            options={[
              { value: "", label: t("filters.statusAll") },
              { value: "1", label: t("statusActive") },
              { value: "0", label: t("statusInactive") },
            ]}
          />
        </div>

        <div className="min-w-[11rem] sm:max-w-[14rem]">
          <SelectField
            label={t("filters.branch")}
            value={values.branchId}
            placeholder={t("filters.branchAll")}
            searchPlaceholder={tUi("selectSearch")}
            emptyMessage={tUi("selectEmpty")}
            onChange={(branchId) => onChange({ ...values, branchId })}
            options={[
              { value: "", label: t("filters.branchAll") },
              ...branches.map((branch) => ({
                value: String(branch.branchId),
                label: `${branch.branchCode} — ${branch.branchName}`,
              })),
            ]}
          />
        </div>

        <div className="min-w-[11rem] sm:max-w-[14rem]">
          <SelectField
            label={t("filters.designation")}
            value={values.designationId}
            placeholder={t("filters.designationAll")}
            searchPlaceholder={tUi("selectSearch")}
            emptyMessage={tUi("selectEmpty")}
            onChange={(designationId) =>
              onChange({ ...values, designationId })
            }
            options={[
              { value: "", label: t("filters.designationAll") },
              ...designations.map((item) => ({
                value: String(item.designationId),
                label: item.designationName,
              })),
            ]}
          />
        </div>

        <Button type="button" variant="secondary" icon={RotateCcw} onClick={onReset}>
          {tCommon("reset")}
        </Button>
      </div>
    </div>
  );
}
