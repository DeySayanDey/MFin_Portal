"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SelectField, TextField } from "@/components/ui/Form";
import {
  APPL_STATUS_REJECTED,
  APPL_STATUS_RESUBMISSION,
  APPL_STATUS_SUBMITTED,
  applStatusKey,
} from "../los-application.constants";
import { isLosClientError, updateLoanApplicationStatus } from "../services/los-client";
import type { LoanApplicationRow } from "../types/los.types";

type LosApplicationStatusModalProps = {
  application: LoanApplicationRow | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function LosApplicationStatusModal({
  application,
  open,
  onClose,
  onSuccess,
}: LosApplicationStatusModalProps) {
  const t = useTranslations("los.applications");
  const [statusCd, setStatusCd] = useState(String(APPL_STATUS_REJECTED));
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useToastText();

  const currentStatusLabel = useMemo(() => {
    if (!application) return "";
    const key = applStatusKey(application.appl_status_cd);
    return (
      application.appl_status?.trim() ||
      (key ? t(`applStatus.${key}`) : t("dash"))
    );
  }, [application, t]);

  const options = useMemo(() => {
    const base = [
      {
        value: String(APPL_STATUS_REJECTED),
        label: t("status.options.reject"),
      },
      {
        value: String(APPL_STATUS_RESUBMISSION),
        label: t("status.options.resubmission"),
      },
    ];
    if (application?.appl_status_cd === APPL_STATUS_RESUBMISSION) {
      base.push({
        value: String(APPL_STATUS_SUBMITTED),
        label: t("status.options.resubmit"),
      });
    }
    return base;
  }, [application?.appl_status_cd, t]);

  if (!open || !application) return null;

  const handleSubmit = async () => {
    setError(null);
    const cd = Number(statusCd);
    if (
      (cd === APPL_STATUS_REJECTED || cd === APPL_STATUS_RESUBMISSION) &&
      !remarks.trim()
    ) {
      setError(t("status.remarksRequired"));
      return;
    }

    setSubmitting(true);
    try {
      await updateLoanApplicationStatus({
        application_id: application.application_id,
        appl_status_cd: cd,
        remarks: remarks.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(
        isLosClientError(err)
          ? err.message
          : err instanceof Error
            ? err.message
            : t("status.updateFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={t("status.title", { number: application.application_no })}
      size="md"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t("form.cancel")}
          </Button>
          <Button
            variant={statusCd === String(APPL_STATUS_REJECTED) ? "danger" : "primary"}
            icon={statusCd === String(APPL_STATUS_REJECTED) ? XCircle : CheckCircle2}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? t("status.updating") : t("status.confirm")}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <PageToast message={error} tone="error" />
        <p className="text-xs text-slate-600">
          {t("status.summary", {
            borrower: application.member_name,
            status: currentStatusLabel,
          })}
        </p>
        <SelectField
          label={t("status.newStatus")}
          value={statusCd}
          options={options}
          onChange={setStatusCd}
        />
        <TextField
          label={t("status.remarks")}
          value={remarks}
          required={
            statusCd === String(APPL_STATUS_REJECTED) ||
            statusCd === String(APPL_STATUS_RESUBMISSION)
          }
          placeholder={t("status.remarksPlaceholder")}
          onChange={setRemarks}
        />
      </div>
    </Modal>
  );
}
