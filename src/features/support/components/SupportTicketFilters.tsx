"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { Button } from "@/components/ui/Button";
import { DateField, SelectField } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "@/features/support/types/support-ticket.types";

export type SupportTicketFilterValues = {
  search: string;
  priority: string;
  status: string;
  fromDate: string;
  toDate: string;
};

type SupportTicketFiltersProps = {
  values: SupportTicketFilterValues;
  onChange: (values: SupportTicketFilterValues) => void;
  onSearch: () => void;
  onReset: () => void;
};

export function SupportTicketFilters({
  values,
  onChange,
  onSearch,
  onReset,
}: SupportTicketFiltersProps) {
  const t = useTranslations("support.raiseTicket");
  const tCommon = useTranslations("common");
  const tUi = useTranslations("ui");

  return (
    <FilterPanel onReset={onReset}>
      <label className="relative block min-w-[14rem] flex-1 sm:max-w-md">
        <span className="mb-1.5 block text-xs font-semibold text-foreground">
          {t("filters.search")}
        </span>
        <span className="relative block">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-soft" />
          <Input
            value={values.search}
            onChange={(event) => onChange({ ...values, search: event.target.value })}
            placeholder={t("filters.searchPlaceholder")}
            className="ps-9"
            onKeyDown={(event) => {
              if (event.key === "Enter") onSearch();
            }}
          />
        </span>
      </label>

      <div className="min-w-[10rem]">
        <SelectField
          label={t("columns.priority")}
          value={values.priority}
          placeholder={t("filters.all")}
          searchable={false}
          searchPlaceholder={tUi("selectSearch")}
          emptyMessage={tUi("selectEmpty")}
          onChange={(priority) => onChange({ ...values, priority })}
          options={[
            { value: "", label: t("filters.all") },
            ...TICKET_PRIORITIES.map((priority) => ({
              value: priority,
              label: t(`priority.${priority}`),
            })),
          ]}
        />
      </div>

      <div className="min-w-[10rem]">
        <SelectField
          label={t("columns.status")}
          value={values.status}
          placeholder={t("filters.all")}
          searchable={false}
          searchPlaceholder={tUi("selectSearch")}
          emptyMessage={tUi("selectEmpty")}
          onChange={(status) => onChange({ ...values, status })}
          options={[
            { value: "", label: t("filters.all") },
            ...TICKET_STATUSES.map((status) => ({
              value: status,
              label: t(`status.${status}`),
            })),
          ]}
        />
      </div>

      <DateField
        label={t("filters.fromDate")}
        value={values.fromDate}
        onChange={(fromDate) => onChange({ ...values, fromDate })}
      />
      <DateField
        label={t("filters.toDate")}
        value={values.toDate}
        onChange={(toDate) => onChange({ ...values, toDate })}
      />

      <Button type="button" icon={Search} onClick={onSearch}>
        {tCommon("search")}
      </Button>
    </FilterPanel>
  );
}
