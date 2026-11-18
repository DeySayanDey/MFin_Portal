"use client";

import { useRef, useState } from "react";
import { ArrowLeft, CircleX, Printer } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { PrintFrame, type PrintFrameHandle } from "@/components/shared/PrintFrame";
import { Button } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Form";
import { Modal } from "@/components/ui/Modal";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import type { SettlementRequest } from "../types/fd-settlement.types";
import { useSettlementFormat } from "./SettlementPanels";

type RejectSettlementModalProps = {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

export function RejectSettlementModal({ open, busy, onClose, onConfirm }: RejectSettlementModalProps) {
  const t = useTranslations("deposits.fdSettlement");
  const [reason, setReason] = useState("");
  const [error, setError] = useToastText();

  function close() {
    setReason("");
    setError(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={t("reject.title")}
      size="sm"
      confirmOnClose={false}
      confirmOnSave={false}
      footer={
        <>
          <Button type="button" variant="secondary" icon={ArrowLeft} onClick={close} disabled={busy}>
            {t("actions.back")}
          </Button>
          <Button
            type="button"
            variant="danger"
            icon={CircleX}
            loading={busy}
            onClick={() => {
              const trimmed = reason.trim();
              if (!trimmed) {
                setError(t("validation.rejectReason"));
                return;
              }
              onConfirm(trimmed);
            }}
          >
            {t("actions.reject")}
          </Button>
        </>
      }
    >
      <PageToast message={error} tone="error" />
      <TextAreaField label={t("reject.reason")} value={reason} required maxLength={250} onChange={setReason} />
    </Modal>
  );
}

type SettlementReceiptModalProps = {
  request: SettlementRequest | null;
  onClose: () => void;
};

export function SettlementReceiptModal({ request, onClose }: SettlementReceiptModalProps) {
  return request ? <SettlementReceiptDialog key={request.id} request={request} onClose={onClose} /> : null;
}

function SettlementReceiptDialog({ request, onClose }: { request: SettlementRequest; onClose: () => void }) {
  const t = useTranslations("deposits.fdSettlement");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const { money, dateLabel } = useSettlementFormat();
  const frameRef = useRef<PrintFrameHandle>(null);
  const [ready, setReady] = useState(false);
  const [printedAt] = useState(() => new Date());

  const showBeneficiary = request.paymentMode !== "" && request.paymentMode !== "cash";
  const details = [
    { label: t("receipt.reference"), value: request.receiptRef || t("dash") },
    { label: t("review.account"), value: request.accountNumber || t("dash") },
    { label: t("review.customer"), value: request.customerName || t("dash") },
    { label: t("review.type"), value: t(`workspace.types.${request.settlementType}`) },
    { label: t("review.date"), value: dateLabel(request.settlementDate) },
    {
      label: t("review.mode"),
      value: request.paymentMode ? t(`workspace.modes.${request.paymentMode}`) : t("dash"),
    },
    ...(showBeneficiary
      ? [
          {
            label: t("review.beneficiary"),
            value:
              [request.beneficiaryName, request.beneficiaryAccount || request.chequeRef]
                .filter(Boolean)
                .join(" · ") || t("dash"),
          },
        ]
      : []),
  ];

  const quote = request.quote;
  const lines = quote
    ? [
        { key: "principal", amount: quote.principal, signed: false },
        { key: "interest", amount: quote.interest, signed: true },
        { key: "overdue", amount: quote.overdueInterest, signed: true },
        { key: "recovery", amount: -quote.interestRecovery, signed: true },
        { key: "penalty", amount: -quote.penalty, signed: true },
        { key: "tds", amount: -quote.tds, signed: true },
        { key: "other", amount: -quote.otherDeductions, signed: true },
      ].filter((line) => line.key === "principal" || line.amount !== 0)
    : [];

  return (
    <Modal
      open
      onClose={onClose}
      title={t("receipt.title")}
      subtitle={t("receipt.printed")}
      size="lg"
      confirmOnClose={false}
      confirmOnSave={false}
      footer={
        <>
          <Button type="button" variant="secondary" icon={ArrowLeft} onClick={onClose}>
            {t("actions.back")}
          </Button>
          <Button
            type="button"
            icon={Printer}
            loading={!ready}
            disabled={!ready}
            onClick={() => frameRef.current?.print()}
          >
            {t("receipt.print")}
          </Button>
        </>
      }
    >
      <PrintFrame
        ref={frameRef}
        title={t("receipt.title")}
        orientation="portrait"
        className="block h-[65dvh] w-full rounded-[var(--radius-control)] border border-border bg-surface"
        onReady={() => setReady(true)}
      >
        <main className="mx-auto max-w-2xl bg-surface p-8 text-sm leading-relaxed text-foreground print:max-w-none print:p-0">
          <header className="flex items-start justify-between gap-6 border-b-2 border-brand pb-4">
            <div className="min-w-0 space-y-1">
              <p className="text-base font-semibold">{tCommon("appName")}</p>
              {request.branchName ? (
                <p className="text-xs text-muted">{t("receipt.branch", { branch: request.branchName })}</p>
              ) : null}
            </div>
            <div className="min-w-0 space-y-1 text-end">
              <h1 className="text-lg font-semibold text-brand-ink">{t("receipt.title")}</h1>
              <p className="text-xs text-muted">
                {t("receipt.printedOn", {
                  date: format.dateTime(printedAt, { dateStyle: "medium", timeStyle: "short" }),
                })}
              </p>
            </div>
          </header>

          <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 print:grid-cols-2">
            {details.map((row) => (
              <div key={row.label} className="min-w-0">
                <dt className="text-xs text-muted">{row.label}</dt>
                <dd className="break-words font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>

          <section className="mt-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              {t("receipt.breakdown")}
            </h2>
            <table className="w-full border-collapse">
              <tbody>
                {lines.map((line) => (
                  <tr key={line.key} className="border-b border-border">
                    <th scope="row" className="py-2 text-start font-normal text-muted">
                      {t(`workspace.lines.${line.key}`)}
                    </th>
                    <td className="py-2 text-end tabular-nums">{money(line.amount, line.signed)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-foreground">
                  <th scope="row" className="py-2.5 text-start font-semibold">
                    {t("workspace.lines.net")}
                  </th>
                  <td className="py-2.5 text-end text-base font-semibold tabular-nums">
                    {money(request.netPayable ?? quote?.netPayable ?? null)}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <footer className="mt-16 grid grid-cols-2 gap-10 text-xs text-muted">
            {(["customer", "officer"] as const).map((key) => (
              <div key={key} className="border-t border-border-strong pt-2 text-center">
                {t(`receipt.signatures.${key}`)}
              </div>
            ))}
          </footer>
        </main>
      </PrintFrame>
    </Modal>
  );
}
