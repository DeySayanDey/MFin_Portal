"use client";

import { useMemo, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Eye } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn, DataTablePaginationConfig } from "@/components/shared/DataTable";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "@/features/support/types/support-ticket.types";
import type {
  SupportTicket,
  TicketPriority,
  TicketStatus,
} from "@/features/support/types/support-ticket.types";

const PRIORITY_TONE: Record<TicketPriority, BadgeTone> = {
  LOW: "neutral",
  MEDIUM: "info",
  HIGH: "warning",
  URGENT: "danger",
};

const STATUS_TONE: Record<TicketStatus, BadgeTone> = {
  OPEN: "info",
  IN_PROGRESS: "warning",
  CLOSED: "success",
};

type SupportTicketTableProps = {
  items: SupportTicket[];
  loading: boolean;
  error: boolean;
  errorMessage?: string;
  freshNumbers?: ReadonlySet<string>;
  onRetry: () => void;
  onView: (row: SupportTicket) => void;
  headerActions?: ReactNode;
  emptyAction?: ReactNode;
  pagination?: DataTablePaginationConfig;
};

function formatUpdated(value: string | null, locale: string): string {
  if (!value) return "—";
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function isTicketPriority(value: string): value is TicketPriority {
  return (TICKET_PRIORITIES as readonly string[]).includes(value);
}

function isTicketStatus(value: string): value is TicketStatus {
  return (TICKET_STATUSES as readonly string[]).includes(value);
}

export function SupportTicketTable({
  items,
  loading,
  error,
  errorMessage,
  freshNumbers,
  onRetry,
  onView,
  headerActions,
  emptyAction,
  pagination,
}: SupportTicketTableProps) {
  const t = useTranslations("support.raiseTicket");
  const locale = useLocale();

  const columns = useMemo<DataTableColumn<SupportTicket>[]>(
    () => [
      {
        id: "number",
        header: t("columns.number"),
        cell: (row) => (
          <span className="inline-flex items-center gap-2">
            <span className="font-mono text-xs text-foreground">{row.number}</span>
            {freshNumbers?.has(row.number) ? (
              <Badge tone="info" caps={false}>
                {t("notice.new")}
              </Badge>
            ) : null}
          </span>
        ),
      },
      {
        id: "subject",
        header: t("columns.subject"),
        cell: (row) => <p className="font-medium text-foreground">{row.subject}</p>,
      },
      {
        id: "priority",
        header: t("columns.priority"),
        cell: (row) => (
          <Badge tone={isTicketPriority(row.priority) ? PRIORITY_TONE[row.priority] : "neutral"}>
            {isTicketPriority(row.priority) ? t(`priority.${row.priority}`) : row.priority}
          </Badge>
        ),
      },
      {
        id: "status",
        header: t("columns.status"),
        cell: (row) => (
          <Badge tone={isTicketStatus(row.status) ? STATUS_TONE[row.status] : "neutral"} caps={false}>
            {isTicketStatus(row.status) ? t(`status.${row.status}`) : row.status}
          </Badge>
        ),
      },
      {
        id: "remark",
        header: t("columns.remark"),
        cell: (row) => (
          <span className="line-clamp-2 text-foreground">{row.remark ?? t("noRemark")}</span>
        ),
      },
      {
        id: "createdAt",
        header: t("columns.createdAt"),
        cell: (row) => (
          <span className="text-foreground">{formatUpdated(row.createdAt, locale)}</span>
        ),
      },
      {
        id: "updatedAt",
        header: t("columns.updatedAt"),
        cell: (row) => (
          <span className="text-foreground">{formatUpdated(row.updatedAt, locale)}</span>
        ),
      },
    ],
    [freshNumbers, locale, t],
  );

  return (
    <DataTable
      data={items}
      columns={columns}
      getRowKey={(row) => row.number}
      loading={loading}
      error={error}
      errorTitle={t("loadErrorTitle")}
      errorMessage={errorMessage}
      onRetry={onRetry}
      emptyTitle={t("emptyTitle")}
      emptyMessage={t("emptyMessage")}
      emptyAction={emptyAction}
      title={t("listTitle")}
      description={t("listDescription")}
      actions={headerActions}
      caption={t("listTitle")}
      minWidth="60rem"
      getRowClassName={(row) => (freshNumbers?.has(row.number) ? "bg-brand-soft/70" : undefined)}
      pagination={pagination}
      rowActions={{
        header: t("columns.actions"),
        render: (row) => (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={Eye}
            tooltip={t("view")}
            aria-label={t("viewTicket", { number: row.number })}
            onClick={() => onView(row)}
          />
        ),
      }}
    />
  );
}
