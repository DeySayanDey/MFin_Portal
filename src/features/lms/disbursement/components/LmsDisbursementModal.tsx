"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  DollarSign,
  Wallet,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Alert } from "@/components/ui/Alert";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { DateField, SelectField, TextField } from "@/components/ui/Form";
import { SAVINGS_DEPOSIT_TYPE } from "@/features/deposits/savings/deposit-account.constants";
import { fetchDepositAccounts } from "@/features/deposits/savings/services/deposit-account-client";
import { fetchApplOptions } from "@/features/master/appl-options";
import { OPT_PAYMENT_MODE } from "@/features/los/los-disbursement.constants";
import { fetchLoanAccounts } from "@/features/lms/loan-accounts/services/loan-account-client";
import {
  fetchDisbursementPreview,
  isDisbursementClientError,
  submitDisbursementAdd,
} from "../services/disbursement-client";
import type {
  LoanDisbursementAddResult,
  LoanDisbursementPreviewResult,
} from "../types/disbursement.types";
import type { LoanAccount } from "@/features/lms/loan-accounts/types/loan-account.types";

const PAY_MODE_CASH = 1;
const PAY_MODE_CHEQUE = 2;
const PAY_MODE_TRANSFER = 3;
const PAY_MODE_SB = 4;

type LmsDisbursementModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (result: LoanDisbursementAddResult) => void;
};

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

export function LmsDisbursementModal({
  open,
  onClose,
  onSuccess,
}: LmsDisbursementModalProps) {
  const t = useTranslations("loanModule.screens.disbursement");
  const tCommon = useTranslations("common");
  const format = useFormatter();

  const [accounts, setAccounts] = useState<LoanAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [disbursementDate, setDisbursementDate] = useState(todayYmd);
  const [grossAmount, setGrossAmount] = useState("");
  const [otherDeduction, setOtherDeduction] = useState("0");
  const [paymentModeCd, setPaymentModeCd] = useState(String(PAY_MODE_CASH));
  const [paymentModes, setPaymentModes] = useState<
    { value: string; label: string }[]
  >([]);
  const [chequeNo, setChequeNo] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [sbAccountId, setSbAccountId] = useState("");
  const [sbAccounts, setSbAccounts] = useState<{ value: string; label: string }[]>(
    [],
  );
  const [loadingSbAccounts, setLoadingSbAccounts] = useState(false);
  const [isFinal, setIsFinal] = useState(false);
  const [remarks, setRemarks] = useState("");

  const [preview, setPreview] = useState<LoanDisbursementPreviewResult | null>(
    null,
  );
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useToastText();

  const money = (val: number | null | undefined) => {
    if (val == null) return "—";
    return format.number(val, { style: "currency", currency: "INR" });
  };

  const selectedAccount = useMemo(
    () =>
      accounts.find((acc) => String(acc.loanAccountId) === selectedAccountId) ??
      null,
    [accounts, selectedAccountId],
  );

  const resetForm = useCallback(() => {
    setSelectedAccountId("");
    setDisbursementDate(todayYmd());
    setGrossAmount("");
    setOtherDeduction("0");
    setPaymentModeCd(String(PAY_MODE_CASH));
    setChequeNo("");
    setReferenceNo("");
    setSbAccountId("");
    setSbAccounts([]);
    setIsFinal(false);
    setRemarks("");
    setPreview(null);
    setPreviewError(null);
    setSubmitError(null);
  }, [setSubmitError]);

  useEffect(() => {
    if (!open) return;
    resetForm();
    setLoadingAccounts(true);
    void Promise.all([
      fetchLoanAccounts({ page: 1, perPage: 100, statusCd: 1 }),
      fetchApplOptions(OPT_PAYMENT_MODE),
    ])
      .then(([accountResult, modes]) => {
        const eligible = accountResult.items.filter(
          (acc) => (acc.undisbursedAmount ?? 0) > 0,
        );
        setAccounts(eligible.length > 0 ? eligible : accountResult.items);
        setPaymentModes(
          modes.map((option) => ({
            value: String(option.optCode),
            label: option.optDescription,
          })),
        );
      })
      .catch(() => {
        setAccounts([]);
        setPaymentModes([]);
      })
      .finally(() => setLoadingAccounts(false));
  }, [open, resetForm]);

  useEffect(() => {
    if (!open || Number(paymentModeCd) !== PAY_MODE_SB || !selectedAccount) {
      setSbAccounts([]);
      return;
    }
    let cancelled = false;
    setLoadingSbAccounts(true);
    void fetchDepositAccounts({
      memberId: selectedAccount.custIdPrimary,
      depositTypeCd: SAVINGS_DEPOSIT_TYPE,
      isClosed: false,
      page: 1,
      perPage: 50,
    })
      .then((res) => {
        if (cancelled) return;
        const options = res.items
          .filter((account) => !account.isClosed && account.isActive)
          .map((account) => {
            const accountNo =
              account.refAcNo ||
              account.cbsAcNo ||
              account.applNo ||
              String(account.accountId);
            const balance = account.availableBalance ?? account.currentBalance;
            return {
              value: String(account.accountId),
              label: [
                accountNo,
                account.schemeName,
                balance != null
                  ? format.number(balance, {
                      style: "currency",
                      currency: "INR",
                    })
                  : null,
              ]
                .filter(Boolean)
                .join(" · "),
            };
          });
        setSbAccounts(options);
        if (options.length === 1) setSbAccountId(options[0].value);
      })
      .catch(() => {
        if (!cancelled) setSbAccounts([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSbAccounts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [format, open, paymentModeCd, selectedAccount]);

  const runPreview = useCallback(async () => {
    const accId = Number(selectedAccountId);
    if (!accId) {
      setPreview(null);
      return;
    }
    setLoadingPreview(true);
    setPreviewError(null);
    try {
      const res = await fetchDisbursementPreview({
        loan_account_id: accId,
        gross_amount: grossAmount ? Number(grossAmount) : undefined,
        other_deduction: otherDeduction ? Number(otherDeduction) : undefined,
      });
      setPreview(res);
      if (!grossAmount && res.undisbursed_amount) {
        setGrossAmount(String(res.undisbursed_amount));
      }
      if (res.will_be_final) {
        setIsFinal(true);
      }
    } catch (err: unknown) {
      setPreviewError(
        isDisbursementClientError(err)
          ? err.message
          : err instanceof Error
            ? err.message
            : t("modal.previewError"),
      );
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  }, [grossAmount, otherDeduction, selectedAccountId, t]);

  useEffect(() => {
    if (!open || !selectedAccountId) return;
    const timer = setTimeout(() => {
      void runPreview();
    }, 300);
    return () => clearTimeout(timer);
  }, [open, selectedAccountId, runPreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const accountId = Number(selectedAccountId);
    if (!accountId) {
      setSubmitError(t("modal.errors.accountRequired"));
      return;
    }

    const gross = Number(grossAmount);
    if (!gross || gross <= 0) {
      setSubmitError(t("modal.errors.grossRequired"));
      return;
    }

    if (preview && preview.pending_disbursements > 0) {
      setSubmitError(t("modal.errors.pendingExists"));
      return;
    }

    if (preview && preview.net_amount <= 0) {
      setSubmitError(t("modal.errors.netInvalid"));
      return;
    }

    const mode = Number(paymentModeCd);
    if (mode === PAY_MODE_CHEQUE && !chequeNo.trim()) {
      setSubmitError(t("modal.errors.chequeRequired"));
      return;
    }
    if (mode === PAY_MODE_TRANSFER && !referenceNo.trim()) {
      setSubmitError(t("modal.errors.referenceRequired"));
      return;
    }
    if (mode === PAY_MODE_SB && !sbAccountId.trim()) {
      setSubmitError(t("modal.errors.sbRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitDisbursementAdd({
        loan_account_id: accountId,
        disbursement_date: disbursementDate || undefined,
        gross_amount: gross,
        other_deduction: otherDeduction ? Number(otherDeduction) : undefined,
        payment_mode_cd: mode,
        cheque_no: mode === PAY_MODE_CHEQUE ? chequeNo.trim() : undefined,
        reference_no:
          mode === PAY_MODE_TRANSFER ? referenceNo.trim() : undefined,
        sb_account_id:
          mode === PAY_MODE_SB ? Number(sbAccountId) : undefined,
        is_final: isFinal,
        remarks: remarks.trim() || undefined,
      });

      onSuccess(res);
      onClose();
    } catch (err: unknown) {
      setSubmitError(
        isDisbursementClientError(err)
          ? err.message
          : err instanceof Error
            ? err.message
            : t("modal.errors.submitFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const accountOptions = accounts.map((acc) => ({
    value: String(acc.loanAccountId),
    label: t("modal.accountOption", {
      account: acc.refAccountNo,
      borrower: acc.primaryName,
      remaining: money(acc.undisbursedAmount),
    }),
  }));

  const hasPendingDisbursement = (preview?.pending_disbursements ?? 0) > 0;
  const mode = Number(paymentModeCd);

  return (
    <Modal
      open={open}
      title={t("modal.title")}
      subtitle={t("modal.subtitle")}
      size="xl"
      confirmOnSave={false}
      onClose={onClose}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {preview ? (
              <span>
                {t("modal.netLabel")}{" "}
                <strong className="text-sm font-black text-teal-700">
                  {money(preview.net_amount)}
                </strong>
              </span>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              icon={CheckCircle2}
              loading={submitting}
              disabled={
                submitting || hasPendingDisbursement || !selectedAccountId
              }
            >
              {t("modal.confirm")}
            </Button>
          </div>
        </div>
      }
    >
      <form autoComplete="off" onSubmit={handleSubmit} className="space-y-4">
        <PageToast message={submitError} tone="error" />

        {hasPendingDisbursement ? (
          <Alert tone="warning">{t("modal.pendingWarning")}</Alert>
        ) : null}

        <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
            <DollarSign className="h-4 w-4 text-teal-600" />
            {t("modal.stepAccount")}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectField
              label={t("modal.loanAccount")}
              value={selectedAccountId}
              required
              options={[
                {
                  value: "",
                  label: loadingAccounts
                    ? t("modal.loadingAccounts")
                    : t("modal.loanAccountPlaceholder"),
                },
                ...accountOptions,
              ]}
              onChange={(val) => {
                setSelectedAccountId(val);
                setGrossAmount("");
                setSbAccountId("");
                setPreview(null);
              }}
            />
            <DateField
              label={t("modal.disbursementDate")}
              value={disbursementDate}
              onChange={setDisbursementDate}
            />
          </div>
          {selectedAccount ? (
            <p className="text-xs text-slate-600">
              {t("modal.accountHint", {
                scheme: selectedAccount.schemeName,
                sanctioned: money(selectedAccount.loanAmount),
                disbursed: money(selectedAccount.disbursedAmount),
              })}
            </p>
          ) : null}
          {!loadingAccounts && accounts.length === 0 ? (
            <Alert tone="warning">{t("modal.noAccounts")}</Alert>
          ) : null}
        </section>

        {selectedAccountId ? (
          <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                <Calculator className="h-4 w-4 text-indigo-600" />
                {t("modal.stepAmount")}
              </span>
              {loadingPreview ? (
                <span className="text-xs font-semibold text-indigo-600">
                  {t("modal.calculating")}
                </span>
              ) : null}
            </div>

            {previewError ? <Alert tone="error">{previewError}</Alert> : null}

            {preview ? (
              <div className="mb-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric
                  label={t("modal.sanctioned")}
                  value={money(preview.loan_amount)}
                />
                <Metric
                  label={t("modal.alreadyDisbursed")}
                  value={money(preview.disbursed_amount)}
                />
                <Metric
                  label={t("modal.undisbursed")}
                  value={money(preview.undisbursed_amount)}
                  tone="indigo"
                />
                <Metric
                  label={t("modal.netPayout")}
                  value={money(preview.net_amount)}
                  tone="teal"
                  emphasize
                />
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <TextField
                label={t("modal.grossAmount")}
                value={grossAmount}
                required
                restrict="decimal"
                placeholder="0.00"
                onChange={setGrossAmount}
              />
              <TextField
                label={t("modal.otherDeduction")}
                value={otherDeduction}
                restrict="decimal"
                placeholder="0.00"
                onChange={setOtherDeduction}
              />
              <div className="flex items-center pt-6">
                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-800">
                  <input autoComplete="off"
                    type="checkbox"
                    checked={isFinal}
                    onChange={(e) => setIsFinal(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  {t("modal.finalTranche")}
                </label>
              </div>
            </div>

            {preview?.will_be_final ? (
              <div className="flex items-start gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-900">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {t("modal.finalHint")}
              </div>
            ) : null}

            {preview?.charges && preview.charges.length > 0 ? (
              <div className="mt-1 overflow-hidden rounded-lg border border-slate-200">
                <div className="flex justify-between bg-slate-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  <span>{t("modal.chargesTitle")}</span>
                  <span className="font-black text-slate-900">
                    {t("modal.chargesTotal", {
                      amount: money(preview.charge_deduction),
                    })}
                  </span>
                </div>
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600">
                    <tr>
                      <th className="px-3 py-1.5 text-start">
                        {t("modal.chargeName")}
                      </th>
                      <th className="px-3 py-1.5 text-start">
                        {t("modal.chargeStage")}
                      </th>
                      <th className="px-3 py-1.5 text-end">
                        {t("modal.chargeFee")}
                      </th>
                      <th className="px-3 py-1.5 text-end">
                        {t("modal.chargeTax")}
                      </th>
                      <th className="px-3 py-1.5 text-end">
                        {t("modal.chargeNet")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {preview.charges.map((ch, idx) => (
                      <tr key={`${ch.charge_id}-${idx}`}>
                        <td className="px-3 py-1.5 font-medium text-slate-800">
                          {ch.charge_name}
                        </td>
                        <td className="px-3 py-1.5 text-[11px] text-slate-500">
                          {ch.deduct_during}
                        </td>
                        <td className="px-3 py-1.5 text-end text-slate-700">
                          {money(ch.charge_amount)}
                        </td>
                        <td className="px-3 py-1.5 text-end text-slate-700">
                          {money(ch.tax_amount)}
                        </td>
                        <td className="px-3 py-1.5 text-end font-bold text-slate-900">
                          {money(ch.net_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
            <Wallet className="h-4 w-4 text-emerald-600" />
            {t("modal.stepPayment")}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectField
              label={t("modal.paymentMode")}
              value={paymentModeCd}
              required
              options={
                paymentModes.length > 0
                  ? paymentModes
                  : [
                      { value: "1", label: t("modal.modes.cash") },
                      { value: "2", label: t("modal.modes.cheque") },
                      { value: "3", label: t("modal.modes.transfer") },
                      { value: "4", label: t("modal.modes.sb") },
                    ]
              }
              onChange={(val) => {
                setPaymentModeCd(val);
                setChequeNo("");
                setReferenceNo("");
                setSbAccountId("");
              }}
            />

            {mode === PAY_MODE_CHEQUE ? (
              <TextField
                label={t("modal.chequeNo")}
                value={chequeNo}
                required
                placeholder={t("modal.chequeNoPlaceholder")}
                onChange={setChequeNo}
              />
            ) : null}

            {mode === PAY_MODE_TRANSFER ? (
              <TextField
                label={t("modal.referenceNo")}
                value={referenceNo}
                required
                placeholder={t("modal.referenceNoPlaceholder")}
                onChange={setReferenceNo}
              />
            ) : null}

            {mode === PAY_MODE_SB ? (
              <SelectField
                label={t("modal.sbAccount")}
                value={sbAccountId}
                required
                placeholder={
                  loadingSbAccounts
                    ? t("modal.loadingSb")
                    : t("modal.sbAccountPlaceholder")
                }
                options={[
                  {
                    value: "",
                    label: loadingSbAccounts
                      ? t("modal.loadingSb")
                      : t("modal.sbAccountPlaceholder"),
                  },
                  ...sbAccounts,
                ]}
                disabled={loadingSbAccounts || sbAccounts.length === 0}
                onChange={setSbAccountId}
              />
            ) : null}
          </div>

          {mode === PAY_MODE_SB &&
          !loadingSbAccounts &&
          selectedAccount &&
          sbAccounts.length === 0 ? (
            <Alert tone="warning">{t("modal.noSbAccounts")}</Alert>
          ) : null}

          {mode === PAY_MODE_CASH ? (
            <p className="text-xs text-slate-600">{t("modal.cashHint")}</p>
          ) : null}

          <TextField
            label={t("modal.remarks")}
            value={remarks}
            placeholder={t("modal.remarksPlaceholder")}
            onChange={setRemarks}
          />
        </section>
      </form>
    </Modal>
  );
}

function Metric({
  label,
  value,
  tone,
  emphasize,
}: {
  label: string;
  value: string;
  tone?: "indigo" | "teal";
  emphasize?: boolean;
}) {
  const wrap =
    tone === "teal"
      ? "border-teal-200 bg-teal-50"
      : tone === "indigo"
        ? "border-indigo-100 bg-indigo-50/60"
        : "border-slate-200 bg-slate-50";
  const valueClass =
    tone === "teal"
      ? "text-teal-800"
      : tone === "indigo"
        ? "text-indigo-700"
        : "text-slate-900";
  return (
    <div className={`rounded-lg border p-2.5 ${wrap}`}>
      <span className="text-[10px] font-semibold uppercase text-slate-500">
        {label}
      </span>
      <p
        className={`${emphasize ? "text-base font-black" : "text-sm font-bold"} ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}
