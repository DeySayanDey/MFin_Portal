"use client";

import { RotateCcw, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Form";
import { AUDIT_ACTIONS } from "@/features/security/audit-log/types/audit-log.types";

export type AuditLogFilterValues = {
  search: string;
  action: string;
  menuName: string;
  dateFrom: string;
  dateTo: string;
};

type AuditLogFiltersProps = {
  values: AuditLogFilterValues;
  onChange: (values: AuditLogFilterValues) => void;
  onReset: () => void;
};

export function AuditLogFilters({
  values,
  onChange,
  onReset,
}: AuditLogFiltersProps) {
  const t = useTranslations("security.auditLog");
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
              value={values.search}
              onChange={(event) =>
                onChange({ ...values, search: event.target.value })
              }
              placeholder={t("filters.searchPlaceholder")}
              className="pl-9"
            />
          </span>
        </label>

        <div className="min-w-[9rem] sm:max-w-[12rem]">
          <SelectField
            label={t("filters.action")}
            value={values.action}
            searchable={false}
            placeholder={t("filters.actionAll")}
            searchPlaceholder={tUi("selectSearch")}
            emptyMessage={tUi("selectEmpty")}
            onChange={(action) => onChange({ ...values, action })}
            options={[
              { value: "", label: t("filters.actionAll") },
              {
                value: String(AUDIT_ACTIONS.create),
                label: t("actions.create"),
              },
              {
                value: String(AUDIT_ACTIONS.update),
                label: t("actions.update"),
              },
              {
                value: String(AUDIT_ACTIONS.login),
                label: t("actions.login"),
              },
              {
                value: String(AUDIT_ACTIONS.logout),
                label: t("actions.logout"),
              },
            ]}
          />
        </div>

        <div className="min-w-[10rem] sm:max-w-[12rem]">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              {t("filters.menuName")}
            </span>
            <Input
              value={values.menuName}
              onChange={(event) =>
                onChange({ ...values, menuName: event.target.value })
              }
              placeholder={t("filters.menuNamePlaceholder")}
            />
          </label>
        </div>

        <div className="min-w-[9rem] sm:max-w-[11rem]">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              {t("filters.dateFrom")}
            </span>
            <Input
              type="date"
              value={values.dateFrom}
              onChange={(event) =>
                onChange({ ...values, dateFrom: event.target.value })
              }
            />
          </label>
        </div>

        <div className="min-w-[9rem] sm:max-w-[11rem]">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              {t("filters.dateTo")}
            </span>
            <Input
              type="date"
              value={values.dateTo}
              onChange={(event) =>
                onChange({ ...values, dateTo: event.target.value })
              }
            />
          </label>
        </div>

        <Button type="button" variant="secondary" icon={RotateCcw} onClick={onReset}>
          {tCommon("reset")}
        </Button>
      </div>
    </div>
  );
}
