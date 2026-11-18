"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { DateField, SelectField, TextField } from "@/components/ui/Form";
import { fetchApplOptions } from "@/features/master/appl-options";
import { fetchBranchList } from "@/features/master/branch/services/branch-client";
import { OPT_PAYMENT_MODE } from "@/features/los/los-disbursement.constants";

export type LmsDisbursementFilterValues = {
  search: string;
  approval: "" | "pending" | "approved";
  branchId: string;
  paymentModeCd: string;
  tranche: "" | "final" | "draft";
  fromDate: string;
  toDate: string;
};

export const emptyLmsDisbursementFilters: LmsDisbursementFilterValues = {
  search: "",
  approval: "",
  branchId: "",
  paymentModeCd: "",
  tranche: "",
  fromDate: "",
  toDate: "",
};

type LmsDisbursementFiltersProps = {
  values: LmsDisbursementFilterValues;
  isHead: boolean;
  branchName: string;
  onChange: (values: LmsDisbursementFilterValues) => void;
  onReset: () => void;
};

export function LmsDisbursementFilters({
  values,
  isHead,
  branchName,
  onChange,
  onReset,
}: LmsDisbursementFiltersProps) {
  const t = useTranslations("loanModule.screens.disbursement");
  const [branches, setBranches] = useState<{ value: string; label: string }[]>(
    [],
  );
  const [paymentModes, setPaymentModes] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      const [branchResult, modeOptions] = await Promise.all([
        isHead
          ? fetchBranchList({ page: 1, perPage: 200, isActive: 1 }).catch(
              () => null,
            )
          : Promise.resolve(null),
        fetchApplOptions(OPT_PAYMENT_MODE).catch(() => []),
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
      setPaymentModes(
        modeOptions.map((option) => ({
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
          label={t("filters.approval")}
          value={values.approval}
          options={[
            { value: "", label: t("filters.approvalAll") },
            { value: "pending", label: t("filters.approvalPending") },
            { value: "approved", label: t("filters.approvalApproved") },
          ]}
          onChange={(approval) =>
            onChange({
              ...values,
              approval: approval as LmsDisbursementFilterValues["approval"],
            })
          }
        />
      </div>
      <div className="min-w-[10rem] sm:max-w-[14rem]">
        <SelectField
          label={t("filters.paymentMode")}
          value={values.paymentModeCd}
          options={[
            { value: "", label: t("filters.paymentModeAll") },
            ...paymentModes,
          ]}
          onChange={(paymentModeCd) => onChange({ ...values, paymentModeCd })}
        />
      </div>
      <div className="min-w-[10rem] sm:max-w-[14rem]">
        <SelectField
          label={t("filters.tranche")}
          value={values.tranche}
          options={[
            { value: "", label: t("filters.trancheAll") },
            { value: "final", label: t("filters.trancheFinal") },
            { value: "draft", label: t("filters.trancheDraft") },
          ]}
          onChange={(tranche) =>
            onChange({
              ...values,
              tranche: tranche as LmsDisbursementFilterValues["tranche"],
            })
          }
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
