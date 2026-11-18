"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { SelectField, TextField } from "@/components/ui/Form";
import { fetchDepositCustomers } from "../services/deposit-account-client";
import type { DepositCustomer } from "../types/deposit-account.types";

export function DepositAccountCustomerPicker({
  kind,
  label,
  customer,
  onChange,
  excludeIds = [],
  branchId,
  error,
  disabled,
  required,
}: {
  kind: "member" | "group";
  label: string;
  customer: DepositCustomer | null;
  onChange: (customer: DepositCustomer | null) => void;
  excludeIds?: number[];
  branchId?: number | null;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  const t = useTranslations("deposits.savings");
  const tUi = useTranslations("ui");
  const [keyword, setKeyword] = useState("");
  const [rows, setRows] = useState<DepositCustomer[]>([]);
  const excludeKey = excludeIds.join(",");

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      fetchDepositCustomers({
        kind,
        keyword: keyword.trim() || undefined,
        branchId: branchId ?? undefined,
        perPage: 50,
      })
        .then((items) => {
          if (cancelled) return;
          const excluded = new Set(excludeKey.split(",").filter(Boolean).map(Number));
          setRows(
            items.filter(
              (item) => !excluded.has(item.id) || item.id === customer?.id,
            ),
          );
        })
        .catch(() => {
          if (!cancelled) setRows([]);
        });
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [branchId, customer?.id, excludeKey, keyword, kind]);

  const options = rows.map((row) => ({
    value: String(row.id),
    label: [row.name, row.refCode, row.mobile].filter(Boolean).join(" · "),
  }));
  if (customer && !options.some((option) => option.value === String(customer.id))) {
    options.unshift({
      value: String(customer.id),
      label: [customer.name, customer.refCode, customer.mobile]
        .filter(Boolean)
        .join(" · "),
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <TextField
        label={t("form.customerSearch")}
        value={keyword}
        disabled={disabled}
        placeholder={t("form.customerSearchPlaceholder")}
        onChange={setKeyword}
      />
      <SelectField
        label={label}
        required={required}
        disabled={disabled}
        value={customer ? String(customer.id) : ""}
        error={error}
        placeholder={t("form.customerPlaceholder")}
        searchPlaceholder={tUi("selectSearch")}
        emptyMessage={tUi("selectEmpty")}
        onChange={(value) => {
          if (!value) {
            onChange(null);
            return;
          }
          onChange(
            rows.find((row) => String(row.id) === value) ??
              (customer && String(customer.id) === value ? customer : null),
          );
        }}
        options={options}
      />
    </div>
  );
}
