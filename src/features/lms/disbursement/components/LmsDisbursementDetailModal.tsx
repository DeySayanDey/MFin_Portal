"use client";

import { ShieldAlert } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { LoanDisbursementRow } from "../types/disbursement.types";

function approvalTone(status: string): BadgeTone {
  const s = status.toLowerCase();
  if (s === "approved") return "success";
  if (s === "pending") return "warning";
  if (s === "rejected") return "danger";
  return "neutral";
}

type LmsDisbursementDetailModalProps = {
  disbursement: LoanDisbursementRow | null;
  open: boolean;
  onClose: () => void;
  onAuthorize?: (row: LoanDisbursementRow) => void;
};

export function LmsDisbursementDetailModal({
  disbursement,
  open,
  onClose,
  onAuthorize,
}: LmsDisbursementDetailModalProps) {
  const t = useTranslations("loanModule.screens.disbursement");
  const tCommon = useTranslations("common");
  const format = useFormatter();

  if (!disbursement) return null;

  const money = (val: number | null | undefined) => {
    if (val == null) return "—";
    return format.number(val, { style: "currency", currency: "INR" });
  };

  const deductions =
    (disbursement.charge_deduction || 0) + (disbursement.other_deduction || 0);
  const isPending = disbursement.approval_status?.toLowerCase() === "pending";

  return (
    <Modal
      open={open}
      title={t("detail.title", { number: disbursement.disbursement_no })}
      subtitle={t("detail.subtitle", {
        account: disbursement.loan_account_no,
        borrower: disbursement.member_name,
      })}
      size="lg"
      onClose={onClose}
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <Button variant="secondary" onClick={onClose}>
            {tCommon("close")}
          </Button>
          {isPending && onAuthorize ? (
            <Button
              icon={ShieldAlert}
              onClick={() => {
                onAuthorize(disbursement);
                onClose();
              }}
            >
              {t("actions.authorize")}
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={approvalTone(disbursement.approval_status)} caps>
            {disbursement.approval_status}
          </Badge>
          <Badge tone={disbursement.is_final ? "success" : "neutral"} caps>
            {disbursement.is_final ? t("tranche.final") : t("tranche.draft")}
          </Badge>
          <Badge tone="info">{disbursement.payment_mode}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              {t("detail.gross")}
            </span>
            <p className="mt-1 text-base font-bold text-slate-900">
              {money(disbursement.gross_amount)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              {t("detail.deductions")}
            </span>
            <p className="mt-1 text-base font-bold text-rose-700">
              {money(deductions)}
            </p>
          </div>
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-teal-800">
              {t("detail.net")}
            </span>
            <p className="mt-1 text-lg font-black text-teal-800">
              {money(disbursement.net_amount)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              {t("detail.date")}
            </span>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {disbursement.disbursement_date}
            </p>
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3.5 text-xs">
          <DetailRow
            label={t("detail.borrower")}
            value={
              disbursement.group_name
                ? `${disbursement.member_name} · ${disbursement.group_name}`
                : disbursement.member_name
            }
          />
          <DetailRow
            label={t("detail.loanAccount")}
            value={disbursement.loan_account_no}
            mono
          />
          <DetailRow
            label={t("detail.application")}
            value={disbursement.application_no}
            mono
          />
          <DetailRow label={t("detail.branch")} value={disbursement.branch_name} />
          <DetailRow
            label={t("detail.voucher")}
            value={disbursement.voucher_no || t("detail.dash")}
            mono
          />
          <DetailRow
            label={t("detail.cheque")}
            value={disbursement.cheque_no || t("detail.dash")}
            mono
          />
          <DetailRow
            label={t("detail.reference")}
            value={disbursement.reference_no || t("detail.dash")}
            mono
          />
          <DetailRow
            label={t("detail.sbAccount")}
            value={disbursement.sb_account_no || t("detail.dash")}
            mono
          />
          <DetailRow
            label={t("detail.createdBy")}
            value={`${disbursement.created_by_name} · ${disbursement.created_on}`}
          />
          <DetailRow
            label={t("detail.approvedBy")}
            value={
              disbursement.approved_by_name
                ? disbursement.approved_by_name
                : t("detail.dash")
            }
          />
          {disbursement.remarks ? (
            <DetailRow label={t("detail.remarks")} value={disbursement.remarks} />
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span
        className={`max-w-[65%] text-end font-medium text-slate-800 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
