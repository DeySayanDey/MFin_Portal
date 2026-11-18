"use client";

import { useEffect, useState } from "react";
import { SelectField } from "@/components/ui/Form";
import { formatDateDMY } from "@/lib/date-format";
import { fetchFinYearList, type FinYear } from "@/features/master/fin-year";

export function findFinYearForDate(years: FinYear[], date: string): FinYear | undefined {
  if (!date) return undefined;
  return years.find((y) => date >= y.startDate && date <= y.endDate);
}

export type FinancialYearFieldProps = {
  value: string;
  onChange: (yearId: string, year?: FinYear) => void;
  onYearsLoaded?: (years: FinYear[]) => void;
  label?: string;
  hideLabel?: boolean;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  autoSelectActive?: boolean;
};

export function FinancialYearField({
  value,
  onChange,
  onYearsLoaded,
  label = "Financial year",
  hideLabel = false,
  placeholder,
  hint,
  required = true,
  disabled = false,
  autoSelectActive = true,
}: FinancialYearFieldProps) {
  const [years, setYears] = useState<FinYear[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchFinYearList({ perPage: 200 })
      .then((res) => {
        if (cancelled) return;
        const sorted = [...res.items].sort(
          (a, b) =>
            (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0) ||
            b.startDate.localeCompare(a.startDate),
        );
        setYears(sorted);
        setStatus("ready");
        onYearsLoaded?.(sorted);
        if (autoSelectActive && !value) {
          const activeYear = sorted.find((y) => y.isActive) ?? sorted[0];
          if (activeYear) {
            onChange(String(activeYear.yearId), activeYear);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const selectedYear = years.find((y) => String(y.yearId) === value);
  const defaultHint = selectedYear
    ? `${formatDateDMY(selectedYear.startDate)} – ${formatDateDMY(selectedYear.endDate)}`
    : undefined;

  return (
    <div>
      <SelectField
        label={label}
        hideLabel={hideLabel}
        value={value}
        onChange={(next) =>
          onChange(next, years.find((y) => String(y.yearId) === next))
        }
        options={years.map((y) => ({
          value: String(y.yearId),
          label: y.isActive ? `${y.yearName} (Active)` : y.yearName,
        }))}
        placeholder={
          status === "loading"
            ? "Loading financial years..."
            : (placeholder ?? "Select financial year")
        }
        emptyMessage="No financial years available"
        disabled={disabled || status !== "ready"}
        hint={hint ?? defaultHint}
        searchable
        required={required}
      />
      {status === "error" && (
        <p role="alert" className="mt-1 text-xs text-rose-600">
          Could not load financial years.{" "}
          <button
            type="button"
            className="underline"
            onClick={() => {
              setStatus("loading");
              setReload((r) => r + 1);
            }}
          >
            Try again
          </button>
        </p>
      )}
    </div>
  );
}
