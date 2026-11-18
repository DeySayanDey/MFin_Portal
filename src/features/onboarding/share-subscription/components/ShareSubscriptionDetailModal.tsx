"use client";

import type { ReactNode } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { STATUS_ENTERED, STATUS_REJECTED } from "../share-subscription.constants";
import { cents, parseDateTime, statusTone } from "../share-subscription.utils";
import type { ShareSubscription } from "../types/share-subscription.types";

type ShareSubscriptionDetailModalProps = {
  row: ShareSubscription | null;
  statusLabel: (row: ShareSubscription) => string;
  modeLabel: (row: ShareSubscription) => string;
  typeLabel: (row: ShareSubscription) => string;
  onClose: () => void;
};

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-slate-900">{children}</dd>
    </div>
  );
}

export function ShareSubscriptionDetailModal({
  row,
  statusLabel,
  modeLabel,
  typeLabel,
  onClose,
}: ShareSubscriptionDetailModalProps) {
  const t = useTranslations("onboarding.shareSubscription");
  const format = useFormatter();

  const money = (value: number) =>
    format.number(value, { style: "currency", currency: "INR" });
  const dateTime = (raw: string | null) => {
    const date = parseDateTime(raw);
    return date ? format.dateTime(date, { dateStyle: "medium", timeStyle: "short" }) : "—";
  };
  const person = (name: string, at: string | null) =>
    name ? t("detail.byAt", { name, at: dateTime(at) }) : "—";

  return (
    <Modal
      open={row != null}
      size="md"
      title={t("detail.title")}
      subtitle={row ? row.subscriptionNo || String(row.subscriptionId) : undefined}
      confirmOnClose={false}
      onClose={onClose}
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          {t("detail.close")}
        </Button>
      }
    >
      {row ? (
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Item label={t("table.status")}>
            <Badge tone={statusTone(row.statusCd)} caps={false}>
              {statusLabel(row)}
            </Badge>
          </Item>
          <Item label={t("table.subscriber")}>
            {[row.customerName, row.customerCode, typeLabel(row)].filter(Boolean).join(" · ") ||
              "—"}
          </Item>
          <Item label={t("form.branch")}>{row.branchName || "—"}</Item>
          <Item label={t("form.date")}>{row.subscriptionDate || "—"}</Item>
          <Item label={t("form.shares")}>
            {t("detail.sharesAt", {
              shares: format.number(row.noOfShares),
              value: money(row.faceValue),
            })}
          </Item>
          <Item label={t("form.amount")}>{money(row.subscriptionAmount)}</Item>
          <Item label={t("form.paid")}>{money(row.paidAmount)}</Item>
          <Item label={t("form.outstanding")}>
            {money(Math.max(0, cents(row.subscriptionAmount - row.paidAmount) / 100))}
          </Item>
          <Item label={t("form.paymentMode")}>{modeLabel(row)}</Item>
          <Item label={t("form.refNo")}>{row.transRefNo || "—"}</Item>
          <Item label={t("detail.voucherNo")}>{row.voucherNo || "—"}</Item>
          <Item label={t("form.remarks")}>{row.remarks || "—"}</Item>
          <Item label={t("detail.enteredBy")}>{person(row.createdByName, row.createdAt)}</Item>
          {row.statusCd !== STATUS_ENTERED ? (
            <Item
              label={
                row.statusCd === STATUS_REJECTED ? t("detail.rejectedBy") : t("detail.verifiedBy")
              }
            >
              {person(row.approvedByName, row.approvedAt)}
            </Item>
          ) : null}
          {row.approvalRemarks ? (
            <div className="sm:col-span-2">
              <Item label={t("detail.decisionRemarks")}>{row.approvalRemarks}</Item>
            </div>
          ) : null}
        </dl>
      ) : null}
    </Modal>
  );
}
