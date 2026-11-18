"use client";

import { useMemo } from "react";
import { Search } from "lucide-react";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Form";
import type { SelectOption } from "@/components/ui/Select";
import type { GroupFilterValues } from "../types/group.types";
import type { Branch } from "@/features/master/branch/types/branch.types";
import type { Center } from "@/features/master/center/types/center.types";
import type { ApplOption } from "@/features/master/appl-options/types/appl-options.types";
import type { Staff } from "@/features/master/staff/types/staff.types";

export type GroupManagementFiltersProps = {
  values: GroupFilterValues;
  branches: Branch[];
  centers: Center[];
  staff: Staff[];
  groupTypeOptions: ApplOption[];
  isBranchBound?: boolean;
  onChange: (values: GroupFilterValues) => void;
  onReset: () => void;
};

export function GroupManagementFilters({
  values,
  branches,
  centers,
  staff,
  groupTypeOptions,
  isBranchBound = false,
  onChange,
  onReset,
}: GroupManagementFiltersProps) {
  const branchSelectOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: "All" },
      ...branches.map((b) => ({
        value: String(b.branchId),
        label: `${b.branchName} (${b.branchCode})`,
      })),
    ],
    [branches],
  );

  const centerSelectOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: "All" },
      ...centers.map((c) => ({
        value: String(c.centerId),
        label: c.centerName,
      })),
    ],
    [centers],
  );

  const typeSelectOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: "All" },
      ...groupTypeOptions.map((opt) => ({
        value: String(opt.optCode),
        label: opt.optDescription,
      })),
    ],
    [groupTypeOptions],
  );

  const foSelectOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: "All" },
      ...staff.filter((s) => s.designationName?.trim().toLowerCase() === "field officer").map((s) => ({
        value: String(s.staffId),
        label: `${s.fullName} (${s.employeeCode})`,
      })),
    ],
    [staff],
  );

  const statusOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: "All" },
      { value: "1", label: "Active" },
      { value: "2", label: "Inactive" },
      { value: "3", label: "Suspended" },
      { value: "4", label: "Closed" },
    ],
    [],
  );

  return (
    <FilterPanel onReset={onReset}>
      {/* Search Input */}
      <label className="relative block min-w-[14rem] flex-1 sm:max-w-md">
        <span className="mb-1.5 block text-xs font-semibold text-slate-600">
          Search
        </span>
        <span className="relative block">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
          <Input
            value={values.keyword}
            onChange={(e) => onChange({ ...values, keyword: e.target.value })}
            placeholder="Search by name, code, reg. no, or village..."
            className="pl-9"
          />
        </span>
      </label>

      {/* Status */}
      <div className="min-w-[8.5rem] sm:max-w-[11rem]">
        <SelectField
          label="Status"
          value={values.statusCd}
          searchable={false}
          placeholder="All"
          onChange={(statusCd) => onChange({ ...values, statusCd })}
          options={statusOptions}
        />
      </div>

      {/* Branch */}
      <div className="min-w-[11rem] sm:max-w-[14rem]">
        <SelectField
          label="Branch"
          value={values.branchId}
          placeholder="All"
          disabled={isBranchBound}
          onChange={(branchId) =>
            onChange({
              ...values,
              branchId,
              centerId: "",
              foId: "",
            })
          }
          options={branchSelectOptions}
        />
      </div>

      {/* Center */}
      <div className="min-w-[10rem] sm:max-w-[13rem]">
        <SelectField
          label="Center"
          value={values.centerId}
          placeholder="All"
          disabled={!values.branchId}
          onChange={(centerId) => onChange({ ...values, centerId })}
          options={centerSelectOptions}
        />
      </div>

      {/* Group Type */}
      <div className="min-w-[8.5rem] sm:max-w-[11rem]">
        <SelectField
          label="Group Type"
          value={values.groupTypeCd}
          searchable={false}
          placeholder="All"
          onChange={(groupTypeCd) => onChange({ ...values, groupTypeCd })}
          options={typeSelectOptions}
        />
      </div>

      {/* Field Officer */}
      <div className="min-w-[10rem] sm:max-w-[13rem]">
        <SelectField
          label="Field Officer"
          value={values.foId}
          placeholder="All"
          disabled={!values.branchId}
          onChange={(foId) => onChange({ ...values, foId })}
          options={foSelectOptions}
        />
      </div>
    </FilterPanel>
  );
}
