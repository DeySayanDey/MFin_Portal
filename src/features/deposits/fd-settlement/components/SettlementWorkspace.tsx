"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CheckboxField, DateField, SelectField, TextAreaField, TextField } from "@/components/ui/Form";
import { Modal } from "@/components/ui/Modal";
import { parseYmd } from "@/features/deposits/savings/deposit-account.rules";
import type {
  PaymentMode,
  ReasonCode,
  SampleDeposit,
  SampleRequest,
  SettlementDraft,
  SettlementType,
} from "../types/fd-settlement.types";

const MAX_FILE_BYTES = 2 * 1024 * 1024;

type SettlementWorkspaceProps = {
  account: SampleDeposit;
  request: SampleRequest | null;
  onBack: () => void;
  onSaveDraft: (draft: SettlementDraft) => void;
  onSubmit: (draft: SettlementDraft) => void;
  onApprove: () => void;
  onReject: () => void;
  onPost: () => void;
  onReceipt: () => void;
};

function blankDraft(account: SampleDeposit, request: SampleRequest | null): SettlementDraft {
  return {
    settlementType: request?.settlementType ?? "",
    settlementDate: request?.settlementDate ?? "",
    reason: request?.reason ?? "",
    remarks: request?.remarks ?? "",
    paymentMode: request?.paymentMode ?? "",
    beneficiaryAccount: request?.beneficiaryAccount ?? account.linkedAccount?.masked ?? "",
    beneficiaryName: request?.beneficiaryName ?? account.linkedAccount?.name ?? account.customerName,
    ifsc: request?.ifsc ?? "",
    chequeRef: request?.chequeRef ?? "",
    verified: request != null && request.status !== "draft" && request.status !== "rejected",
    documentName: request?.documentName ?? "",
  };
}

export function SettlementWorkspace({
  account,
  request,
  onBack,
  onSaveDraft,
  onSubmit,
  onApprove,
  onReject,
  onPost,
  onReceipt,
}: SettlementWorkspaceProps) {
  const t = useTranslations("deposits.fdSettlement");
  const format = useFormatter();
  const locked = request != null && request.status !== "draft" && request.status !== "rejected";
  const [draft, setDraft] = useState<SettlementDraft>(() => blankDraft(account, request));
  const [quoteReady, setQuoteReady] = useState(request?.netPayable != null);
  const [quotedOnce, setQuotedOnce] = useState(request?.netPayable != null);
  const [calculating, setCalculating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const money = (value: number, signed = false) =>
    format.number(value, {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: signed ? "exceptZero" : "auto",
    });

  const dateLabel = (value: string) => {
    const parsed = parseYmd(value);
    return parsed
      ? format.dateTime(parsed, { month: "short", day: "numeric", year: "numeric" })
      : t("dash");
  };

  function patch(partial: Partial<SettlementDraft>, affectsQuote = false) {
    setDraft((current) => ({ ...current, ...partial }));
    if (affectsQuote && !locked) setQuoteReady(false);
    setErrors([]);
  }

  function requestLeave() {
    const dirty =
      !locked &&
      (quoteReady ||
        draft.settlementType !== "" ||
        draft.settlementDate !== "" ||
        draft.reason !== "" ||
        draft.remarks !== "" ||
        draft.documentName !== "");
    if (dirty) {
      setLeaveOpen(true);
      return;
    }
    onBack();
  }

  function calculate() {
    const next: string[] = [];
    if (!draft.settlementType) next.push(t("validation.type"));
    if (!draft.settlementDate) next.push(t("validation.date"));
    if (!draft.reason) next.push(t("validation.reason"));
    setErrors(next);
    if (next.length > 0) return;
    setCalculating(true);
    timerRef.current = window.setTimeout(() => {
      setQuoteReady(true);
      setQuotedOnce(true);
      setCalculating(false);
    }, 400);
  }

  function validatePayout(): string[] {
    const next: string[] = [];
    if (!quoteReady) next.push(t("validation.quote"));
    if (!draft.paymentMode) next.push(t("validation.payment"));
    if (draft.paymentMode === "savings" || draft.paymentMode === "neft") {
      if (!draft.beneficiaryAccount.trim()) next.push(t("validation.beneficiary"));
    }
    if (draft.paymentMode === "neft" && !draft.ifsc.trim()) next.push(t("validation.ifsc"));
    if (draft.paymentMode === "cheque" && !draft.chequeRef.trim()) next.push(t("validation.cheque"));
    if (!draft.verified) next.push(t("validation.declaration"));
    return next;
  }

  function openReview() {
    const next = validatePayout();
    setErrors(next);
    if (next.length > 0) return;
    setConfirmed(false);
    setReviewOpen(true);
  }

  function submitReview() {
    if (!confirmed) {
      setErrors([t("validation.confirm")]);
      return;
    }
    setReviewOpen(false);
    onSubmit(draft);
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) {
      setErrors([t("validation.fileType")]);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setErrors([t("validation.fileSize")]);
      return;
    }
    patch({ documentName: file.name });
  }

  const quote = account.quote;
  const lines: { key: string; amount: number; signed: boolean }[] = [
    { key: "principal", amount: quote.principal, signed: false },
    { key: "interest", amount: quote.interest, signed: true },
    { key: "overdue", amount: quote.overdueInterest, signed: true },
    { key: "recovery", amount: -quote.interestRecovery, signed: true },
    { key: "penalty", amount: -quote.penalty, signed: true },
    { key: "tds", amount: -quote.tds, signed: true },
    { key: "other", amount: -quote.otherDeductions, signed: true },
  ].filter((line) => line.key === "principal" || line.amount !== 0);

  const typeOptions = account.permittedTypes.map((value) => ({
    value,
    label: t(`workspace.types.${value}`),
  }));
  const reasonOptions = (["customer", "financial", "other"] as const).map((value) => ({
    value,
    label: t(`workspace.reasons.${value}`),
  }));
  const modeOptions = account.paymentMethods.map((value) => ({
    value,
    label: t(`workspace.modes.${value}`),
  }));

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">
          {t("workspace.accountLine", { account: account.accountNumber })}
        </p>
        <div className="flex items-center gap-2">
          {request ? (
            <Badge tone={request.status === "rejected" ? "danger" : request.status === "settled" ? "success" : "warning"} caps={false}>
              {t(`requestStatuses.${request.status}`)}
            </Badge>
          ) : null}
          <Button type="button" variant="secondary" size="sm" onClick={requestLeave}>
            {t("actions.change")}
          </Button>
        </div>
      </div>

      {request?.rejectionReason ? <Alert tone="error">{request.rejectionReason}</Alert> : null}
      {errors.map((message) => (
        <Alert key={message} tone="error">
          {message}
        </Alert>
      ))}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title={t("workspace.customer")}>
            <Fact label={t("workspace.name")} value={account.customerName} />
            <Fact label={t("workspace.customerId")} value={account.customerId} />
            <Fact label={t("workspace.kyc")} value={t(`kyc.${account.kyc}`)} />
            <Fact label={t("workspace.holding")} value={t(`holding.${account.holding}`)} />
            <Fact label={t("workspace.branch")} value={account.branchName} />
          </Panel>

          <Panel title={t("workspace.deposit")}>
            <Fact label={t("workspace.scheme")} value={t(`schemes.${account.scheme}`)} />
            <Fact label={t("workspace.principal")} value={money(account.principal)} />
            <Fact label={t("workspace.rate")} value={t("workspace.rateValue", { rate: format.number(account.ratePercent, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) })} />
            <Fact label={t("workspace.open")} value={dateLabel(account.openDate)} />
            <Fact label={t("workspace.maturity")} value={dateLabel(account.maturityDate)} />
            <Fact label={t("workspace.tenure")} value={t("workspace.tenureValue", { count: account.tenureMonths })} />
            <Fact label={t("workspace.payoutFrequency")} value={t(`workspace.${account.payoutFrequency}`)} />
          </Panel>

          {account.mis ? (
            <Panel title={t("mis.title")}>
              <Fact label={t("mis.monthly")} value={money(account.mis.monthlyInterest)} />
              <Fact label={t("mis.lastPaid")} value={dateLabel(account.mis.lastPaidDate)} />
              <Fact label={t("mis.totalPaid")} value={money(account.mis.totalInterestPaid)} />
              <Fact label={t("mis.unpaid")} value={String(account.mis.unpaidInstallments)} />
              <Fact label={t("mis.pending")} value={money(account.mis.pendingInterest)} />
              <Fact label={t("mis.excess")} value={money(account.mis.recoverableExcess)} />
            </Panel>
          ) : null}

          <Panel title={t("workspace.request")}>
            <SelectField
              label={t("workspace.type")}
              value={draft.settlementType}
              required
              disabled={locked}
              options={typeOptions}
              placeholder={t("workspace.choose")}
              onChange={(value) => patch({ settlementType: value as SettlementType }, true)}
            />
            <DateField
              label={t("workspace.date")}
              value={draft.settlementDate}
              required
              disabled={locked}
              onChange={(value) => patch({ settlementDate: value }, true)}
            />
            <SelectField
              label={t("workspace.reason")}
              value={draft.reason}
              required
              disabled={locked}
              options={reasonOptions}
              placeholder={t("workspace.choose")}
              onChange={(value) => patch({ reason: value as ReasonCode }, true)}
            />
            <TextAreaField
              label={t("workspace.remarks")}
              value={draft.remarks}
              disabled={locked}
              onChange={(value) => patch({ remarks: value })}
            />
            {locked ? null : (
              <Button type="button" onClick={calculate} loading={calculating}>
                {calculating ? t("actions.calculating") : t("actions.calculate")}
              </Button>
            )}
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Panel title={t("workspace.calculation")}>
            {quoteReady ? (
              <>
                {lines.map((line) => (
                  <Fact key={line.key} label={t(`workspace.lines.${line.key}`)} value={money(line.amount, line.signed)} />
                ))}
                <div className="mt-1 border-t border-border pt-3">
                  <Fact label={t("workspace.lines.net")} value={money(quote.netPayable)} />
                </div>
                <p className="text-xs text-muted">
                  {t("workspace.quoteMeta", { id: quote.quoteId, date: dateLabel(quote.expiresOn) })}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">{quotedOnce ? t("workspace.quoteStale") : t("workspace.quoteEmpty")}</p>
            )}
          </Panel>

          <Panel title={t("workspace.payout")}>
            {modeOptions.length === 0 ? (
              <p className="text-sm text-muted">{t("workspace.noPaymentMethods")}</p>
            ) : (
              <>
                <SelectField
                  label={t("workspace.mode")}
                  value={draft.paymentMode}
                  required
                  disabled={locked}
                  options={modeOptions}
                  placeholder={t("workspace.choose")}
                  onChange={(value) => {
                    const mode = value as PaymentMode;
                    patch({
                      paymentMode: mode,
                      beneficiaryAccount: mode === "savings" ? account.linkedAccount?.masked ?? "" : draft.beneficiaryAccount,
                      beneficiaryName: mode === "savings" ? account.linkedAccount?.name ?? account.customerName : draft.beneficiaryName,
                    });
                  }}
                />
                {draft.paymentMode === "savings" && account.linkedAccount ? (
                  <SelectField
                    label={t("workspace.beneficiaryAccount")}
                    value={draft.beneficiaryAccount}
                    disabled={locked}
                    options={[{ value: account.linkedAccount.masked, label: account.linkedAccount.masked }]}
                    onChange={(value) => patch({ beneficiaryAccount: value, beneficiaryName: account.linkedAccount?.name ?? "" })}
                  />
                ) : null}
                {draft.paymentMode === "neft" ? (
                  <>
                    <TextField label={t("workspace.beneficiaryAccount")} value={draft.beneficiaryAccount} disabled={locked} onChange={(value) => patch({ beneficiaryAccount: value })} />
                    <TextField label={t("workspace.ifsc")} value={draft.ifsc} disabled={locked} onChange={(value) => patch({ ifsc: value })} />
                  </>
                ) : null}
                {draft.paymentMode === "cheque" ? (
                  <TextField label={t("workspace.chequeRef")} value={draft.chequeRef} disabled={locked} onChange={(value) => patch({ chequeRef: value })} />
                ) : null}
                {draft.paymentMode ? (
                  <>
                    <Fact label={t("workspace.beneficiaryName")} value={draft.beneficiaryName || t("dash")} />
                    <Fact label={t("workspace.amount")} value={quoteReady ? money(quote.netPayable) : t("dash")} />
                  </>
                ) : null}
              </>
            )}
          </Panel>

          <Panel title={t("workspace.documents")}>
            {draft.settlementType ? (
              <p className="text-sm text-muted">{t(`workspace.checklist.${draft.settlementType}`)}</p>
            ) : null}
            {locked ? (
              <Fact label={t("workspace.upload")} value={draft.documentName || t("dash")} />
            ) : (
              <label className="block text-sm font-medium text-slate-700">
                {t("workspace.upload")}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  className="mt-1.5 block w-full text-sm"
                  onChange={(event) => onFile(event.target.files?.[0])}
                />
              </label>
            )}
            {draft.documentName && !locked ? <p className="text-xs text-muted">{draft.documentName}</p> : null}
            <CheckboxField
              label={t("workspace.declaration")}
              checked={draft.verified}
              onChange={(checked) => {
                if (!locked) patch({ verified: checked });
              }}
            />
          </Panel>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        {locked && request?.status === "pending" ? (
          <>
            <Button type="button" variant="secondary" onClick={onBack}>{t("actions.back")}</Button>
            <Button type="button" variant="danger" onClick={onReject}>{t("actions.reject")}</Button>
            <Button type="button" onClick={onApprove}>{t("actions.approve")}</Button>
          </>
        ) : null}
        {locked && request?.status === "approved" ? (
          <>
            <Button type="button" variant="secondary" onClick={onBack}>{t("actions.back")}</Button>
            <Button type="button" onClick={onPost}>{t("actions.post")}</Button>
          </>
        ) : null}
        {locked && request?.status === "settled" ? (
          <>
            <Button type="button" variant="secondary" onClick={onBack}>{t("actions.back")}</Button>
            <Button type="button" onClick={onReceipt}>{t("actions.receipt")}</Button>
          </>
        ) : null}
        {!locked ? (
          <>
            <Button type="button" variant="secondary" onClick={requestLeave}>{t("actions.cancel")}</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!draft.settlementType) {
                  setErrors([t("validation.type")]);
                  return;
                }
                onSaveDraft(draft);
              }}
            >
              {t("actions.saveDraft")}
            </Button>
            <Button type="button" onClick={openReview} disabled={modeOptions.length === 0}>{t("actions.review")}</Button>
          </>
        ) : null}
      </div>

      <Modal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title={t("review.title")}
        subtitle={t("review.subtitle")}
        size="md"
        confirmOnClose={false}
        confirmOnSave={false}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setReviewOpen(false)}>{t("actions.back")}</Button>
            <Button type="button" onClick={submitReview}>{t("actions.submit")}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-2">
          <Fact label={t("review.account")} value={account.accountNumber} />
          <Fact label={t("review.customer")} value={account.customerName} />
          <Fact label={t("review.type")} value={draft.settlementType ? t(`workspace.types.${draft.settlementType}`) : t("dash")} />
          <Fact label={t("review.date")} value={dateLabel(draft.settlementDate)} />
          <Fact label={t("review.mode")} value={draft.paymentMode ? t(`workspace.modes.${draft.paymentMode}`) : t("dash")} />
          <Fact label={t("review.beneficiary")} value={draft.beneficiaryAccount || t("dash")} />
          <div className="mt-2 border-t border-border pt-3">
            <Fact label={t("workspace.lines.net")} value={money(quote.netPayable)} />
          </div>
          <CheckboxField label={t("workspace.confirm")} checked={confirmed} onChange={setConfirmed} />
        </div>
      </Modal>

      <Modal
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title={t("notices.unsavedTitle")}
        subtitle={t("notices.unsavedMessage")}
        size="sm"
        confirmOnClose={false}
        confirmOnSave={false}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setLeaveOpen(false)}>{t("actions.back")}</Button>
            <Button type="button" variant="danger" onClick={onBack}>{t("actions.leave")}</Button>
          </>
        }
      >
        {null}
      </Modal>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <div className="mt-3 flex flex-col gap-2.5">{children}</div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-end font-medium text-slate-900">{value}</span>
    </div>
  );
}
