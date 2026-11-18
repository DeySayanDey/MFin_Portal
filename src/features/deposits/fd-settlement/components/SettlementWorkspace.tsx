"use client";

import { useId, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  Calculator,
  CircleCheck,
  CircleX,
  ClipboardCheck,
  FileText,
  FileX,
  Info,
  LogOut,
  ReceiptText,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CheckboxField, DateField, SelectField, TextAreaField, TextField } from "@/components/ui/Form";
import { Modal } from "@/components/ui/Modal";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { showToast } from "@/components/ui/toast";
import { calculateSettlement, isFdSettlementClientError } from "../services/fd-settlement-client";
import {
  CustomerPanel,
  DepositPanel,
  Fact,
  MisPanel,
  Panel,
  QuoteBreakdown,
  useSettlementFormat,
} from "./SettlementPanels";
import type {
  PaymentMode,
  ReasonCode,
  SettlementAccount,
  SettlementDraft,
  SettlementQuote,
  SettlementRequest,
  SettlementType,
} from "../types/fd-settlement.types";

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const FILE_ACCEPT = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

export type SettlementSaveRequest = {
  draft: SettlementDraft;
  quote: SettlementQuote | null;
  document: File | null;
  submit: boolean;
};

type SettlementWorkspaceProps = {
  account: SettlementAccount;
  request: SettlementRequest | null;
  busy: boolean;
  onBack: () => void;
  onSave: (request: SettlementSaveRequest) => Promise<void>;
  onApprove: () => void;
  onReject: () => void;
  onPost: () => void;
  onReceipt: () => void;
};

function blankDraft(account: SettlementAccount, request: SettlementRequest | null): SettlementDraft {
  return {
    settlementType: request?.settlementType ?? "",
    settlementDate: request?.settlementDate ?? "",
    reason: request?.reason ?? "",
    remarks: request?.remarks ?? "",
    paymentMode: request?.paymentMode ?? "",
    beneficiaryAccount: request?.beneficiaryAccount || account.linkedAccount?.accountNo || "",
    beneficiaryName: request?.beneficiaryName || account.linkedAccount?.name || account.customerName,
    ifsc: request?.ifsc ?? "",
    chequeRef: request?.chequeRef ?? "",
    verified: request != null && request.status !== "draft" && request.status !== "rejected",
    documentName: request?.documentName ?? "",
  };
}

export function SettlementWorkspace({
  account,
  request,
  busy,
  onBack,
  onSave,
  onApprove,
  onReject,
  onPost,
  onReceipt,
}: SettlementWorkspaceProps) {
  const t = useTranslations("deposits.fdSettlement");
  const { money, dateLabel } = useSettlementFormat();
  const locked = request != null && request.status !== "draft" && request.status !== "rejected";
  const [draft, setDraft] = useState<SettlementDraft>(() => blankDraft(account, request));
  const [quote, setQuote] = useState<SettlementQuote | null>(request?.quote ?? null);
  const [quoteReady, setQuoteReady] = useState(locked && request?.quote != null);
  const [quotedOnce, setQuotedOnce] = useState(request?.quote != null);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState<"draft" | "submit" | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [apiError, setApiError] = useToastText();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();

  function patch(partial: Partial<SettlementDraft>, affectsQuote = false) {
    setDraft((current) => ({ ...current, ...partial }));
    if (affectsQuote && !locked) setQuoteReady(false);
  }

  function showErrors(messages: string[]) {
    for (const message of messages) showToast(message, "error");
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

  async function calculate() {
    const next: string[] = [];
    if (!draft.settlementType) next.push(t("validation.type"));
    if (!draft.settlementDate) next.push(t("validation.date"));
    if (!draft.reason) next.push(t("validation.reason"));
    showErrors(next);
    if (next.length > 0 || !draft.settlementType) return;
    setCalculating(true);
    try {
      const result = await calculateSettlement({
        accountId: account.id,
        settlementType: draft.settlementType,
        settlementDate: draft.settlementDate,
      });
      setQuote(result);
      setQuoteReady(true);
      setQuotedOnce(true);
    } catch (error) {
      setApiError(isFdSettlementClientError(error) ? error.message : t("notices.calculateFailed"));
    } finally {
      setCalculating(false);
    }
  }

  async function save(submit: boolean) {
    setSaving(submit ? "submit" : "draft");
    try {
      await onSave({ draft, quote: quoteReady ? quote : null, document: attachment, submit });
      setAttachment(null);
    } catch (error) {
      setApiError(isFdSettlementClientError(error) ? error.message : t("notices.saveFailed"));
    } finally {
      setSaving(null);
    }
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
    showErrors(next);
    if (next.length > 0) return;
    setConfirmed(false);
    setReviewOpen(true);
  }

  function submitReview() {
    if (!confirmed) {
      showErrors([t("validation.confirm")]);
      return;
    }
    setReviewOpen(false);
    void save(true);
  }

  function onFile(file: File | undefined) {
    if (!file || locked) return;
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setFileError(t("validation.fileType"));
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError(t("validation.fileSize"));
      return;
    }
    setFileError(null);
    setFileSize(file.size);
    setAttachment(file);
    patch({ documentName: file.name });
  }

  function removeFile() {
    setFileError(null);
    setFileSize(null);
    setAttachment(null);
    patch({ documentName: "" });
    if (fileRef.current) fileRef.current.value = "";
  }

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
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="flex items-center gap-2">
          {request ? (
            <Badge tone={request.status === "rejected" ? "danger" : request.status === "settled" ? "success" : "warning"} caps={false}>
              {t(`requestStatuses.${request.status}`)}
            </Badge>
          ) : null}
          <Button type="button" variant="secondary" size="sm" icon={ArrowLeftRight} onClick={requestLeave}>
            {t("actions.change")}
          </Button>
        </div>
      </div>

      <PageToast message={apiError} tone="error" />
      <PageToast message={request?.rejectionReason || null} tone="error" />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <CustomerPanel account={account} />
          <DepositPanel account={account} />
          <MisPanel account={account} />

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
              <Button type="button" icon={Calculator} onClick={calculate} loading={calculating}>
                {calculating ? t("actions.calculating") : t("actions.calculate")}
              </Button>
            )}
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Panel title={t("workspace.calculation")}>
            {quoteReady && quote ? (
              <QuoteBreakdown quote={quote} />
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
                      beneficiaryAccount: mode === "savings" ? account.linkedAccount?.accountNo ?? "" : draft.beneficiaryAccount,
                      beneficiaryName: mode === "savings" ? account.linkedAccount?.name ?? account.customerName : draft.beneficiaryName,
                    });
                  }}
                />
                {draft.paymentMode === "savings" && account.linkedAccount ? (
                  <SelectField
                    label={t("workspace.beneficiaryAccount")}
                    value={draft.beneficiaryAccount}
                    disabled={locked}
                    options={[{ value: account.linkedAccount.accountNo, label: account.linkedAccount.accountNo }]}
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
                    <Fact label={t("workspace.amount")} value={quoteReady && quote ? money(quote.netPayable) : t("dash")} />
                  </>
                ) : null}
              </>
            )}
          </Panel>

          <Panel title={t("workspace.documents")} icon={FileText}>
            {draft.settlementType ? (
              <p className="flex items-start gap-2 rounded-xl bg-surface-muted px-3 py-2.5 text-xs text-muted">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
                <span>{t(`workspace.checklist.${draft.settlementType}`)}</span>
              </p>
            ) : null}
            {locked ? (
              draft.documentName ? (
                <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border p-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                    <FileText className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs text-muted">{t("workspace.attachedDocument")}</span>
                    <span className="block truncate text-sm font-medium text-foreground">{draft.documentName}</span>
                  </span>
                </div>
              ) : (
                <div className="flex min-w-0 items-center gap-3 rounded-xl border border-dashed border-border-strong p-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted">
                    <FileX className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">{t("workspace.noDocument")}</span>
                    <span className="block text-xs text-muted">{t("workspace.noDocumentHint")}</span>
                  </span>
                </div>
              )
            ) : (
              <div className="flex flex-col gap-1.5">
                <label htmlFor={fileInputId} className="text-xs font-semibold text-foreground">
                  {t("workspace.upload")}
                </label>
                <input autoComplete="off"
                  ref={fileRef}
                  id={fileInputId}
                  type="file"
                  accept={FILE_ACCEPT}
                  className="sr-only"
                  aria-describedby={`${fileInputId}-hint`}
                  onChange={(event) => onFile(event.target.files?.[0])}
                />
                {draft.documentName ? (
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-muted p-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                      <FileText className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {draft.documentName}
                      </span>
                      {fileSize != null ? (
                        <span className="block text-xs text-muted">
                          {t("workspace.fileSize", { size: Math.max(1, Math.round(fileSize / 1024)) })}
                        </span>
                      ) : null}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon={RefreshCw}
                        onClick={() => fileRef.current?.click()}
                      >
                        {t("workspace.replaceFile")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        tooltip={t("workspace.removeFile")}
                        aria-label={t("workspace.removeFileNamed", { name: draft.documentName })}
                        onClick={removeFile}
                      />
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragging(false);
                      onFile(event.dataTransfer.files?.[0]);
                    }}
                    className={`flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                      dragging
                        ? "border-brand bg-brand-soft"
                        : fileError
                          ? "border-danger bg-surface"
                          : "border-border-strong bg-surface hover:border-brand hover:bg-surface-muted"
                    }`}
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand">
                      <Upload className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {t.rich("workspace.uploadPrompt", {
                        browse: (chunks) => <span className="text-brand underline">{chunks}</span>,
                      })}
                    </span>
                  </button>
                )}
                <p id={`${fileInputId}-hint`} className="text-xs text-muted">
                  {t("workspace.uploadHint")}
                </p>
                {fileError ? (
                  <p className="text-xs text-danger" role="alert">
                    {fileError}
                  </p>
                ) : null}
              </div>
            )}
            {locked ? (
              <p className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{t("workspace.declarationConfirmed")}</span>
              </p>
            ) : (
              <div className="border-t border-border pt-3">
                <CheckboxField
                  label={t("workspace.declaration")}
                  checked={draft.verified}
                  onChange={(checked) => patch({ verified: checked })}
                />
              </div>
            )}
          </Panel>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        {locked && request?.status === "pending" ? (
          <>
            <Button type="button" variant="secondary" icon={ArrowLeft} onClick={onBack} disabled={busy}>{t("actions.back")}</Button>
            <Button type="button" variant="danger" icon={CircleX} onClick={onReject} disabled={busy}>{t("actions.reject")}</Button>
            <Button type="button" icon={CircleCheck} onClick={onApprove} loading={busy}>{t("actions.approve")}</Button>
          </>
        ) : null}
        {locked && request?.status === "approved" ? (
          <>
            <Button type="button" variant="secondary" icon={ArrowLeft} onClick={onBack} disabled={busy}>{t("actions.back")}</Button>
            <Button type="button" icon={Send} onClick={onPost} loading={busy}>{t("actions.post")}</Button>
          </>
        ) : null}
        {locked && request?.status === "settled" ? (
          <>
            <Button type="button" variant="secondary" icon={ArrowLeft} onClick={onBack}>{t("actions.back")}</Button>
            <Button type="button" icon={ReceiptText} onClick={onReceipt}>{t("actions.receipt")}</Button>
          </>
        ) : null}
        {!locked ? (
          <>
            <Button type="button" variant="secondary" icon={X} onClick={requestLeave} disabled={saving != null}>{t("actions.cancel")}</Button>
            <Button
              type="button"
              variant="secondary"
              icon={Save}
              loading={saving === "draft"}
              disabled={saving != null}
              onClick={() => {
                const next: string[] = [];
                if (!draft.settlementType) next.push(t("validation.type"));
                if (!draft.settlementDate) next.push(t("validation.date"));
                if (!draft.reason) next.push(t("validation.reason"));
                showErrors(next);
                if (next.length === 0) void save(false);
              }}
            >
              {t("actions.saveDraft")}
            </Button>
            <Button
              type="button"
              icon={ClipboardCheck}
              onClick={openReview}
              loading={saving === "submit"}
              disabled={modeOptions.length === 0 || saving != null}
            >
              {t("actions.review")}
            </Button>
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
            <Button type="button" variant="secondary" icon={ArrowLeft} onClick={() => setReviewOpen(false)}>{t("actions.back")}</Button>
            <Button type="button" icon={Send} onClick={submitReview}>{t("actions.submit")}</Button>
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
            <Fact label={t("workspace.lines.net")} value={quote ? money(quote.netPayable) : t("dash")} />
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
            <Button type="button" variant="secondary" icon={ArrowLeft} onClick={() => setLeaveOpen(false)}>{t("actions.back")}</Button>
            <Button type="button" variant="danger" icon={LogOut} onClick={onBack}>{t("actions.leave")}</Button>
          </>
        }
      >
        {null}
      </Modal>
    </div>
  );
}
