"use client";

import { useLocale, useTranslations } from "next-intl";
import { Alert } from "@/components/ui/Alert";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SupportTicketThread } from "@/features/support/components/SupportTicketThread";
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "@/features/support/types/support-ticket.types";
import type {
  SupportTicketDetail,
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

type SupportTicketDetailProps = {
  open: boolean;
  ticket: SupportTicketDetail | null;
  loading: boolean;
  errorMessage?: string | null;
  messageReloadKey?: number;
  onClose: () => void;
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

export function SupportTicketDetail({
  open,
  ticket,
  loading,
  errorMessage,
  messageReloadKey = 0,
  onClose,
}: SupportTicketDetailProps) {
  const t = useTranslations("support.raiseTicket");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  return (
    <Modal
      open={open}
      title={ticket ? t("viewTicket", { number: ticket.number }) : t("view")}
      size="lg"
      onClose={onClose}
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          {tCommon("close")}
        </Button>
      }
    >
      {errorMessage ? <Alert tone="error">{errorMessage}</Alert> : null}
      {loading ? <p className="text-sm text-muted">{t("loadingTicket")}</p> : null}
      {ticket && !loading ? (
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-muted">{t("columns.number")}</dt>
            <dd className="mt-1 font-mono text-sm text-foreground">{ticket.number}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-muted">{t("columns.createdAt")}</dt>
            <dd className="mt-1 text-sm text-foreground">
              {formatUpdated(ticket.createdAt, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-muted">{t("columns.updatedAt")}</dt>
            <dd className="mt-1 text-sm text-foreground">
              {formatUpdated(ticket.updatedAt, locale)}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold text-muted">{t("columns.subject")}</dt>
            <dd className="mt-1 text-sm text-foreground">{ticket.subject}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold text-muted">{t("fields.description")}</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-foreground">
              {ticket.description || t("noRemark")}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-muted">{t("columns.priority")}</dt>
            <dd className="mt-1">
              <Badge
                tone={
                  isTicketPriority(ticket.priority) ? PRIORITY_TONE[ticket.priority] : "neutral"
                }
              >
                {isTicketPriority(ticket.priority)
                  ? t(`priority.${ticket.priority}`)
                  : ticket.priority}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-muted">{t("columns.status")}</dt>
            <dd className="mt-1">
              <Badge
                caps={false}
                tone={isTicketStatus(ticket.status) ? STATUS_TONE[ticket.status] : "neutral"}
              >
                {isTicketStatus(ticket.status) ? t(`status.${ticket.status}`) : ticket.status}
              </Badge>
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold text-muted">{t("columns.remark")}</dt>
            <dd className="mt-1 text-sm text-foreground">{ticket.remark ?? t("noRemark")}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold text-muted">{t("fields.screenshots")}</dt>
            <dd className="mt-2">
              {ticket.screenshots.length > 0 ? (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {ticket.screenshots.map((shot) => (
                    <li
                      key={shot.url}
                      className="overflow-hidden rounded-xl border border-border bg-surface-muted"
                    >
                      <a href={shot.url} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element -- support desk file URL */}
                        <img
                          src={shot.url}
                          alt={shot.name}
                          className="h-28 w-full object-cover"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm text-muted">{t("noScreenshots")}</span>
              )}
            </dd>
          </div>
        </dl>
      ) : null}
      {ticket && !loading ? (
        <SupportTicketThread
          ticketNumber={ticket.number}
          closed={ticket.status === "CLOSED"}
          reloadKey={messageReloadKey}
        />
      ) : null}
    </Modal>
  );
}
