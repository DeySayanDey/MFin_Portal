"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Calculator, CheckCircle2, DollarSign, Info } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Alert } from "@/components/ui/Alert";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SelectField, TextField } from "@/components/ui/Form";
import {
  fetchDisbursementPreview,
  isDisbursementClientError,
  submitDisbursementAdd,
} from "../services/disbursement-client";
import { fetchLoanAccounts } from "@/features/lms/loan-accounts/services/loan-account-client";
import type {
  LoanDisbursementAddResult,
  LoanDisbursementPreviewResult,
} from "../types/disbursement.types";
import type { LoanAccount } from "@/features/lms/loan-accounts/types/loan-account.types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (result: LoanDisbursementAddResult) => void;
}

export function LmsDisbursementModal({ open, onClose, onSuccess }: Props) {
  const t = useTranslations("loanModule.screens.disbursement");
  const tCommon = useTranslations("common");
  const format = useFormatter();

  const [accounts, setAccounts] = useState<LoanAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [disbursementDate, setDisbursementDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [grossAmount, setGrossAmount] = useState("");
  const [otherDeduction, setOtherDeduction] = useState("0");
  const [paymentModeCd, setPaymentModeCd] = useState("1"); // 1 Cash, 2 Cheque, 3 Bank Transfer, 4 S/B Account
  const [chequeNo, setChequeNo] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [sbAccountId, setSbAccountId] = useState("");
  const [isFinal, setIsFinal] = useState(false);
  const [remarks, setRemarks] = useState("");

  const [preview, setPreview] = useState<LoanDisbursementPreviewResult | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useToastText();

  // Load active accounts when modal opens
  useEffect(() => {
    if (!open) return;
    setLoadingAccounts(true);
    fetchLoanAccounts({ page: 1, perPage: 50, statusCd: 1 })
      .then((res) => {
        setAccounts(res.items);
      })
      .catch(() => {
        setAccounts([]);
      })
      .finally(() => setLoadingAccounts(false));
  }, [open]);

  const money = (val: number | null | undefined) => {
    if (val == null) return "—";
    return format.number(val, { style: "currency", currency: "INR" });
  };

  // Run live disbursement preview
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
            : "Failed to generate disbursement preview",
      );
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  }, [grossAmount, otherDeduction, selectedAccountId]);

  useEffect(() => {
    if (open && selectedAccountId) {
      const timer = setTimeout(() => {
        void runPreview();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open, selectedAccountId, runPreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const accountId = Number(selectedAccountId);
    if (!accountId) {
      setSubmitError("Please select a valid active loan account");
      return;
    }

    const gross = Number(grossAmount);
    if (!gross || gross <= 0) {
      setSubmitError("Gross disbursement amount must be greater than zero");
      return;
    }

    if (preview && preview.pending_disbursements > 0) {
      setSubmitError("A disbursement is already pending checker approval for this loan account.");
      return;
    }

    if (preview && preview.net_amount <= 0) {
      setSubmitError("Net disbursement amount must be greater than zero after charge deductions.");
      return;
    }

    const mode = Number(paymentModeCd);
    if (mode === 2 && !chequeNo.trim()) {
      setSubmitError("Cheque number is required for Cheque payment mode");
      return;
    }
    if (mode === 3 && !referenceNo.trim()) {
      setSubmitError("Reference / UTR number is required for Bank Transfer mode");
      return;
    }
    if (mode === 4 && !sbAccountId.trim()) {
      setSubmitError("Savings Account ID is required for S/B Account credit mode");
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
        cheque_no: mode === 2 ? chequeNo.trim() : undefined,
        reference_no: mode === 3 ? referenceNo.trim() : undefined,
        sb_account_id: mode === 4 ? Number(sbAccountId) : undefined,
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
            : "Failed to record loan disbursement",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const accountOptions = accounts.map((acc) => ({
    value: String(acc.loanAccountId),
    label: `${acc.refAccountNo} — ${acc.primaryName} (${money(acc.loanAmount)})`,
  }));

  const hasPendingDisbursement = (preview?.pending_disbursements ?? 0) > 0;

  return (
    <Modal
      open={open}
      title="Disburse Sanctioned Loan"
      subtitle="Issue full or tranche payout with real-time charge deductions and voucher posting"
      size="xl"
      onClose={onClose}
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="text-xs text-slate-500">
            {preview && (
              <span>
                Net Disbursal: <strong className="text-teal-700 text-sm font-black">{money(preview.net_amount)}</strong>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              icon={CheckCircle2}
              loading={submitting}
              disabled={submitting || hasPendingDisbursement || !selectedAccountId}
            >
              Confirm & Disburse
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <PageToast message={submitError} tone="error" />

        {hasPendingDisbursement && (
          <Alert tone="warning">
            A disbursement is already waiting for checker approval on this loan account. You cannot submit another tranche until it is decided.
          </Alert>
        )}

        {/* 1. LOAN ACCOUNT & DATE */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <DollarSign className="h-4 w-4 text-teal-600" />
            1. Select Loan Account & Tranche Date
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectField
              label="Sanctioned Loan Account *"
              value={selectedAccountId}
              options={[
                { value: "", label: loadingAccounts ? "Loading accounts..." : "Select Loan Account..." },
                ...accountOptions,
              ]}
              onChange={(val) => {
                setSelectedAccountId(val);
                setGrossAmount("");
                setPreview(null);
              }}
            />

            <TextField
              label="Disbursement Date"
              type="date"
              value={disbursementDate}
              onChange={setDisbursementDate}
            />
          </div>
        </div>

        {/* 2. TRANCHE AMOUNTS & PREVIEW */}
        {selectedAccountId && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <Calculator className="h-4 w-4 text-indigo-600" />
                2. Tranche Amount & Charge Deduction Preview
              </span>
              {loadingPreview && (
                <span className="text-xs text-indigo-600 font-semibold flex items-center gap-1">
                  Calculating KFS deductions...
                </span>
              )}
            </div>

            {previewError && <Alert tone="error">{previewError}</Alert>}

            {preview && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Sanctioned</span>
                  <p className="text-sm font-bold text-slate-900">{money(preview.loan_amount)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Already Disbursed</span>
                  <p className="text-sm font-bold text-slate-700">{money(preview.disbursed_amount)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Undisbursed Balance</span>
                  <p className="text-sm font-bold text-indigo-700">{money(preview.undisbursed_amount)}</p>
                </div>
                <div className="rounded-lg border border-teal-200 bg-teal-50 p-2.5">
                  <span className="text-[10px] text-teal-800 uppercase font-semibold">Net Payout</span>
                  <p className="text-base font-black text-teal-800">{money(preview.net_amount)}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <TextField
                label="Gross Tranche Amount *"
                type="number"
                value={grossAmount}
                placeholder="0.00"
                onChange={setGrossAmount}
              />
              <TextField
                label="Other Deductions (Insurance/etc)"
                type="number"
                value={otherDeduction}
                placeholder="0.00"
                onChange={setOtherDeduction}
              />
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFinal}
                    onChange={(e) => setIsFinal(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  Final Tranche (Close Loan Payout)
                </label>
              </div>
            </div>

            {/* DEDUCTED CHARGES BREAKDOWN TABLE */}
            {preview?.charges && preview.charges.length > 0 && (
              <div className="mt-3 border rounded-lg overflow-hidden border-slate-200">
                <div className="bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-700 uppercase tracking-wider flex justify-between">
                  <span>Upfront Charges Deducted From Tranche</span>
                  <span className="text-slate-900 font-black">Total: {money(preview.charge_deduction)}</span>
                </div>
                <table className="min-w-full text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600">
                    <tr>
                      <th className="px-3 py-1.5 text-left">Charge Name</th>
                      <th className="px-3 py-1.5 text-left">Stage</th>
                      <th className="px-3 py-1.5 text-right">Fee</th>
                      <th className="px-3 py-1.5 text-right">Tax</th>
                      <th className="px-3 py-1.5 text-right">Net Deducted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {preview.charges.map((ch, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-1.5 font-medium text-slate-800">{ch.charge_name}</td>
                        <td className="px-3 py-1.5 text-slate-500 text-[11px]">{ch.deduct_during}</td>
                        <td className="px-3 py-1.5 text-right text-slate-700">{money(ch.charge_amount)}</td>
                        <td className="px-3 py-1.5 text-right text-slate-700">{money(ch.tax_amount)}</td>
                        <td className="px-3 py-1.5 text-right font-bold text-slate-900">{money(ch.net_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. PAYMENT MODE & DETAILS */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            3. Payment Method & Settlement Details
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectField
              label="Payment Mode *"
              value={paymentModeCd}
              options={[
                { value: "1", label: "Cash Payout" },
                { value: "2", label: "Bank Cheque" },
                { value: "3", label: "Bank Transfer (NEFT / RTGS / IMPS)" },
                { value: "4", label: "Direct S/B Account Credit" },
              ]}
              onChange={setPaymentModeCd}
            />

            {paymentModeCd === "2" && (
              <TextField
                label="Cheque Number *"
                value={chequeNo}
                placeholder="e.g. CHQ-908123"
                onChange={setChequeNo}
              />
            )}

            {paymentModeCd === "3" && (
              <TextField
                label="Reference / UTR Number *"
                value={referenceNo}
                placeholder="e.g. UTR0001239845"
                onChange={setReferenceNo}
              />
            )}

            {paymentModeCd === "4" && (
              <TextField
                label="Borrower Savings Account ID *"
                value={sbAccountId}
                placeholder="e.g. 17"
                onChange={setSbAccountId}
              />
            )}
          </div>

          <TextField
            label="Disbursement Narration / Remarks"
            value={remarks}
            placeholder="Add internal remarks or reason for tranche payout..."
            onChange={setRemarks}
          />
        </div>
      </form>
    </Modal>
  );
}
