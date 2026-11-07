"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { DateField, SelectField, TextField } from "@/components/ui/Form";
import { fetchApplOptions } from "@/features/master/appl-options";
import { fetchBranchList } from "@/features/master/branch/services/branch-client";
import { fetchStaffList } from "@/features/master/staff/services/staff-client";
import { OPT_INSPECTION_RESULT } from "../los-application.constants";

export type LosFieldVerificationFilterValues = {
  search: string;
  status: "pending" | "history";
  resultCd: string;
  branchId: string;
  foId: string;
  fromDate: string;
  toDate: string;
};

export const emptyLosFieldVerificationFilters: LosFieldVerificationFilterValues =
  {
    search: "",
    status: "pending",
    resultCd: "",
    branchId: "",
    foId: "",
    fromDate: "",
    toDate: "",
  };

type LosFieldVerificationFiltersProps = {
  values: LosFieldVerificationFilterValues;
  isHead: boolean;
  branchName: string;
  onChange: (values: LosFieldVerificationFilterValues) => void;
  onReset: () => void;
};

export function LosFieldVerificationFilters({
  values,
  isHead,
  branchName,
  onChange,
  onReset,
}: LosFieldVerificationFiltersProps) {
  const t = useTranslations("loanModule.screens.fieldVerification");
  const [branches, setBranches] = useState<{ value: string; label: string }[]>(
    [],
  );
  const [officers, setOfficers] = useState<{ value: string; label: string }[]>(
    [],
  );
  const [results, setResults] = useState<{ value: string; label: string }[]>(
    [],
  );

  useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      const [branchResult, staffResult, resultOptions] = await Promise.all([
        isHead
          ? fetchBranchList({ page: 1, perPage: 200, isActive: 1 }).catch(
              () => null,
            )
          : Promise.resolve(null),
        fetchStaffList({ page: 1, perPage: 200, status: 1 }).catch(() => null),
        fetchApplOptions(OPT_INSPECTION_RESULT).catch(() => []),
      ]);
      if (cancelled) return;
      setBranches(
        (branchResult?.items ?? []).map((branch) => ({
          value: String(branch.branchId),
          label: branch.branchCode
            ? `${branch.branchCode} · ${branch.branchName}`
            : branch.branchName,
        })),
      );
      setOfficers(
        (staffResult?.items ?? []).map((staff) => ({
          value: String(staff.staffId),
          label: staff.employeeCode
            ? `${staff.fullName} (${staff.employeeCode})`
            : staff.fullName,
        })),
      );
      setResults(
        resultOptions.map((option) => ({
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

  const showResultFilter = values.status === "history";

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
          label={t("filters.status")}
          value={values.status}
          options={[
            { value: "pending", label: t("filters.statusPending") },
            { value: "history", label: t("filters.statusHistory") },
          ]}
          onChange={(status) =>
            onChange({
              ...values,
              status: status as LosFieldVerificationFilterValues["status"],
              resultCd: status === "pending" ? "" : values.resultCd,
            })
          }
        />
      </div>
      {showResultFilter ? (
        <div className="min-w-[10rem] sm:max-w-[14rem]">
          <SelectField
            label={t("filters.result")}
            value={values.resultCd}
            options={[
              { value: "", label: t("filters.resultAll") },
              ...results,
            ]}
            onChange={(resultCd) => onChange({ ...values, resultCd })}
          />
        </div>
      ) : null}
      <div className="min-w-[10rem] sm:max-w-[16rem]">
        <SelectField
          label={t("filters.officer")}
          value={values.foId}
          options={[
            { value: "", label: t("filters.officerAll") },
            ...officers,
          ]}
          onChange={(foId) => onChange({ ...values, foId })}
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
