"use client";

import { ArrowLeft, Calculator, ClipboardList, FileText, ReceiptText } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert } from "@/components/ui/Alert";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type {
  AccountStatus,
  RequestStatus,
  SettlementAccount,
  SettlementRequest,
} from "../types/fd-settlement.types";
import {
  CustomerPanel,
  DepositPanel,
  Fact,
  MisPanel,
  Panel,
  QuoteBreakdown,
  useSettlementFormat,
} from "./SettlementPanels";

type SettlementDetailViewProps = {
  account: SettlementAccount;
  request: SettlementRequest | null;
  onBack: () => void;
  onReceipt: (request: SettlementRequest) => void;
};

const ACCOUNT_TONE: Record<AccountStatus, BadgeTone> = {
  active: "success",
  matured: "info",
  closed: "neutral",
  settled: "success",
};

const REQUEST_TONE: Record<RequestStatus, BadgeTone> = {
  draft: "neutral",
  pending: "warning",
  approved: "info",
  rejected: "danger",
  settled: "success",
};

export function SettlementDetailView({ account, request, onBack, onReceipt }: SettlementDetailViewProps) {
  const t = useTranslations("deposits.fdSettlement");
  const { money, dateLabel } = useSettlementFormat();
  const restriction = account.restriction ?? "settled";
  const dash = t("dash");

  const requestFacts = request
    ? [
        { key: "reference", label: t("receipt.reference"), value: request.receiptRef || dash },
        { key: "type", label: t("review.type"), value: t(`workspace.types.${request.settlementType}`) },
        { key: "date", label: t("review.date"), value: dateLabel(request.settlementDate) },
        { key: "reason", label: t("workspace.reason"), value: t(`workspace.reasons.${request.reason}`) },
        { key: "remarks", label: t("workspace.remarks"), value: request.remarks || dash },
      ]
    : [];

  const payoutFacts = request
    ? [
        {
          key: "mode",
          label: t("review.mode"),
          value: request.paymentMode ? t(`workspace.modes.${request.paymentMode}`) : dash,
        },
        { key: "account", label: t("workspace.beneficiaryAccount"), value: request.beneficiaryAccount || dash },
        { key: "name", label: t("workspace.beneficiaryName"), value: request.beneficiaryName || dash },
        ...(request.paymentMode === "neft" ? [{ key: "ifsc", label: t("workspace.ifsc"), value: request.ifsc || dash }] : []),
        ...(request.paymentMode === "cheque"
          ? [{ key: "cheque", label: t("workspace.chequeRef"), value: request.chequeRef || dash }]
          : []),
        { key: "amount", label: t("workspace.amount"), value: money(request.netPayable) },
      ]
    : [];

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tone={ACCOUNT_TONE[account.status]} caps={false}>
          {t(`statuses.${account.status}`)}
        </Badge>
        {request ? (
          <Badge tone={REQUEST_TONE[request.status]} caps={false}>
            {t(`requestStatuses.${request.status}`)}
          </Badge>
        ) : null}
      </div>

      <Alert tone={restriction === "settled" ? "info" : "error"}>{t(`restrictions.${restriction}`)}</Alert>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <CustomerPanel account={account} />
          <DepositPanel account={account} />
          <MisPanel account={account} />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {request ? (
            <>
              <Panel title={t("detail.title")} icon={ClipboardList}>
                {requestFacts.map((fact) => (
                  <Fact key={fact.key} label={fact.label} value={fact.value} />
                ))}
                {request.rejectionReason ? <Alert tone="error">{request.rejectionReason}</Alert> : null}
              </Panel>

              <Panel title={t("workspace.calculation")} icon={Calculator}>
                {request.quote ? (
                  <QuoteBreakdown quote={request.quote} />
                ) : (
                  <Fact label={t("workspace.lines.net")} value={money(request.netPayable)} />
                )}
              </Panel>

              <Panel title={t("workspace.payout")} icon={ReceiptText}>
                {payoutFacts.map((fact) => (
                  <Fact key={fact.key} label={fact.label} value={fact.value} />
                ))}
              </Panel>

              <Panel title={t("workspace.documents")} icon={FileText}>
                <Fact label={t("workspace.upload")} value={request.documentName || dash} />
              </Panel>
            </>
          ) : (
            <Panel title={t("detail.title")} icon={ClipboardList}>
              <p className="text-sm text-muted">{t("detail.empty")}</p>
            </Panel>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondary" icon={ArrowLeft} onClick={onBack}>
          {t("actions.back")}
        </Button>
        {request?.status === "settled" ? (
          <Button type="button" icon={ReceiptText} onClick={() => onReceipt(request)}>
            {t("actions.receipt")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
