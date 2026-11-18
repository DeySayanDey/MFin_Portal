"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { DateField, SelectField, TextField } from "@/components/ui/Form";
import { fetchApplOptions } from "@/features/master/appl-options";
import { fetchBranchList } from "@/features/master/branch/services/branch-client";
import { fetchLoanSchemeSetups } from "@/features/master/loan-schemes/services/loan-schemes-client";

const OPT_CUST_TYPE = 34;

export type LosApplicationFilterValues = {
  search: string;
  stage: string;
  custTypeCd: string;
  schemeId: string;
  branchId: string;
  fromDate: string;
  toDate: string;
};

export const emptyLosApplicationFilters: LosApplicationFilterValues = {
  search: "",
  stage: "",
  custTypeCd: "",
  schemeId: "",
  branchId: "",
  fromDate: "",
  toDate: "",
};

type LosApplicationsFiltersProps = {
  values: LosApplicationFilterValues;
  isHead: boolean;
  branchName: string;
  onChange: (values: LosApplicationFilterValues) => void;
  onReset: () => void;
};

export function LosApplicationsFilters({
  values,
  isHead,
  branchName,
  onChange,
  onReset,
}: LosApplicationsFiltersProps) {
  const t = useTranslations("los.applications");
  const [schemes, setSchemes] = useState<{ value: string; label: string }[]>([]);
  const [branches, setBranches] = useState<{ value: string; label: string }[]>([]);
  const [customers, setCustomers] = useState<{ value: string; label: string }[]>(
    [],
  );

  useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      const [schemeResult, branchResult, customerOptions] = await Promise.all([
        fetchLoanSchemeSetups({ page: 1, perPage: 200, isActive: 1 }).catch(
          () => null,
        ),
        isHead
          ? fetchBranchList({ page: 1, perPage: 200, isActive: 1 }).catch(
              () => null,
            )
          : Promise.resolve(null),
        fetchApplOptions(OPT_CUST_TYPE).catch(() => []),
      ]);
      if (cancelled) return;

      setSchemes(
        (schemeResult?.items ?? []).map((scheme) => ({
          value: String(scheme.id),
          label: scheme.schemeCode
            ? `${scheme.schemeCode} · ${scheme.schemeName}`
            : scheme.schemeName,
        })),
      );
      setBranches(
        (branchResult?.items ?? []).map((branch) => ({
          value: String(branch.branchId),
          label: branch.branchCode
            ? `${branch.branchCode} · ${branch.branchName}`
            : branch.branchName,
        })),
      );
      setCustomers(
        customerOptions.map((option) => ({
          value: String(option.optCode),
          label: option.optDescription,
        })),
      );
    }
    void loadOptions();
    return () => {
      cancelled = true;
    };
  }, [isHead]);

  const stageOptions = [
    { value: "", label: t("filters.stageAll") },
    { value: "field_verification", label: t("statuses.field_verification") },
    { value: "approval", label: t("statuses.approval") },
    { value: "assessment", label: t("statuses.assessment") },
    { value: "sanctioned", label: t("statuses.sanctioned") },
    { value: "disbursed", label: t("statuses.disbursed") },
    { value: "rejected", label: t("statuses.rejected") },
  ];

  return (
    <FilterPanel onReset={onReset}>
      <div className="min-w-[12rem] sm:max-w-[16rem]">
        <TextField
          label={t("filters.search")}
          value={values.search}
          placeholder={t("filters.searchPlaceholder")}
          onChange={(search) => onChange({ ...values, search })}
        />
      </div>
      <div className="min-w-[10rem] sm:max-w-[14rem]">
        <SelectField
          label={t("filters.stage")}
          value={values.stage}
          options={stageOptions}
          onChange={(stage) => onChange({ ...values, stage })}
        />
      </div>
      <div className="min-w-[10rem] sm:max-w-[14rem]">
        <SelectField
          label={t("filters.borrowerType")}
          value={values.custTypeCd}
          options={[
            { value: "", label: t("filters.borrowerTypeAll") },
            ...customers,
          ]}
          onChange={(custTypeCd) => onChange({ ...values, custTypeCd })}
        />
      </div>
      <div className="min-w-[10rem] sm:max-w-[16rem]">
        <SelectField
          label={t("filters.scheme")}
          value={values.schemeId}
          options={[
            { value: "", label: t("filters.schemeAll") },
            ...schemes,
          ]}
          onChange={(schemeId) => onChange({ ...values, schemeId })}
        />
      </div>
      {isHead ? (
        <div className="min-w-[10rem] sm:max-w-[16rem]">
          <SelectField
            label={t("filters.branch")}
            value={values.branchId}
            options={[
              { value: "", label: t("filters.branchAll") },
              ...branches,
            ]}
            onChange={(branchId) => onChange({ ...values, branchId })}
          />
        </div>
      ) : (
        <div className="min-w-[10rem] sm:max-w-[14rem]">
          <p className="text-xs font-medium text-slate-600">
            {t("filters.branch")}
          </p>
          <p className="mt-1 truncate text-sm text-slate-800">
            {branchName || t("filters.branchFixed")}
          </p>
        </div>
      )}
      <div className="min-w-[9rem] sm:max-w-[12rem]">
        <DateField
          label={t("filters.fromDate")}
          value={values.fromDate}
          onChange={(fromDate) => onChange({ ...values, fromDate })}
        />
      </div>
      <div className="min-w-[9rem] sm:max-w-[12rem]">
        <DateField
          label={t("filters.toDate")}
          value={values.toDate}
          onChange={(toDate) => onChange({ ...values, toDate })}
        />
      </div>
    </FilterPanel>
  );
}
