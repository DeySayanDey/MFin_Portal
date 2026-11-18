"use client";

import { useState } from "react";
import { CheckCircle2, ShieldAlert, XCircle } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/Form";
import {
  isDisbursementClientError,
  submitDisbursementApprove,
} from "../services/disbursement-client";
import type {
  LoanDisbursementAddResult,
  LoanDisbursementRow,
} from "../types/disbursement.types";

interface Props {
  disbursement: LoanDisbursementRow | null;
  open: boolean;
  onClose: () => void;
  onSuccess: (result: LoanDisbursementAddResult) => void;
}

export function LmsDisbursementApproveModal({
  disbursement,
  open,
  onClose,
  onSuccess,
}: Props) {
  const tCommon = useTranslations("common");
  const format = useFormatter();

  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useToastText();

  if (!disbursement) return null;

  const money = (val: number | null | undefined) => {
    if (val == null) return "—";
    return format.number(val, { style: "currency", currency: "INR" });
  };

  const handleDecision = async (approve: boolean) => {
    setError(null);

    if (!approve && !remarks.trim()) {
      setError("Remarks are mandatory when rejecting a pending disbursement.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitDisbursementApprove({
        disbursement_id: disbursement.disbursement_id,
        approve,
        remarks: remarks.trim() || undefined,
      });

      onSuccess(res);
      onClose();
    } catch (err: unknown) {
      setError(
        isDisbursementClientError(err)
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to process disbursement approval decision",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={`Checker Review: ${disbursement.disbursement_no}`}
      subtitle={`Verify loan payout authorization for Account ${disbursement.loan_account_no}`}
      size="lg"
      onClose={onClose}
      footer={
        <div className="flex justify-between items-center w-full">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {tCommon("cancel")}
          </Button>

          <div className="flex gap-2">
            <Button
              variant="danger"
              icon={XCircle}
              onClick={() => handleDecision(false)}
              disabled={submitting}
              loading={submitting}
            >
              Reject Payout
            </Button>
            <Button
              variant="primary"
              icon={CheckCircle2}
              onClick={() => handleDecision(true)}
              disabled={submitting}
              loading={submitting}
            >
              Approve & Post Voucher
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <PageToast message={error} tone="error" />

        {/* PENDING SUMMARY CARD */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
                Borrower / Member
              </span>
              <p className="text-base font-bold text-slate-900">{disbursement.member_name}</p>
              {disbursement.group_name && (
                <span className="text-xs text-slate-500">Group: {disbursement.group_name}</span>
              )}
            </div>

            <Badge tone="warning" caps>
              {disbursement.approval_status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2 border-t border-amber-200/60">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Gross Amount</span>
              <p className="text-sm font-bold text-slate-900">{money(disbursement.gross_amount)}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Deductions</span>
              <p className="text-sm font-bold text-rose-700">
                {money(disbursement.charge_deduction + disbursement.other_deduction)}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Net Payout</span>
              <p className="text-base font-black text-teal-800">{money(disbursement.net_amount)}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Payment Mode</span>
              <p className="text-sm font-bold text-slate-800">{disbursement.payment_mode}</p>
            </div>
          </div>
        </div>

        {/* RECORD DETAILS */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Loan Account:</span>
            <span className="font-mono font-bold text-slate-800">{disbursement.loan_account_no}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Application Reference:</span>
            <span className="font-mono text-slate-800">{disbursement.application_no}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Disbursement Date:</span>
            <span className="font-medium text-slate-800">{disbursement.disbursement_date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Branch:</span>
            <span className="font-medium text-slate-800">{disbursement.branch_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Created By Maker:</span>
            <span className="font-medium text-slate-800">
              {disbursement.created_by_name} ({disbursement.created_on})
            </span>
          </div>
          {disbursement.reference_no && (
            <div className="flex justify-between">
              <span className="text-slate-500">UTR / Ref:</span>
              <span className="font-mono font-semibold text-slate-800">{disbursement.reference_no}</span>
            </div>
          )}
          {disbursement.cheque_no && (
            <div className="flex justify-between">
              <span className="text-slate-500">Cheque No:</span>
              <span className="font-mono font-semibold text-slate-800">{disbursement.cheque_no}</span>
            </div>
          )}
        </div>

        {/* REMARKS INPUT */}
        <div className="space-y-1">
          <TextField
            label="Checker Decision Remarks"
            value={remarks}
            placeholder="Add notes (Mandatory if rejecting)..."
            onChange={setRemarks}
          />
        </div>
      </div>
    </Modal>
  );
}
