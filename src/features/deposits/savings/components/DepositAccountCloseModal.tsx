"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { DateField, FormField } from "@/components/ui/Form";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { STATUS_FREEZED } from "../deposit-account.constants";
import { todayYmd } from "../deposit-account.rules";
import type { DepositAccount } from "../types/deposit-account.types";

type DepositAccountCloseModalProps = {
  account: DepositAccount | null;
  saving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onConfirm: (input: { closingReason: string; closingDate: string }) => void;
};

export function DepositAccountCloseModal({
  account,
  saving,
  errorMessage,
  onClose,
  onConfirm,
}: DepositAccountCloseModalProps) {
  const t = useTranslations("deposits.savings");
  const format = useFormatter();
  const [reason, setReason] = useState("");
  const [closingDate, setClosingDate] = useState(todayYmd());
  const [reasonError, setReasonError] = useState("");

  useEffect(() => {
    if (!account) return;
    setReason("");
    setReasonError("");
    setClosingDate(todayYmd());
  }, [account]);

  if (!account) {
    return (
      <Modal open={false} onClose={onClose} title={t("closeDialog.title")}>
        {null}
      </Modal>
    );
  }

  const balance = account.currentBalance ?? 0;
  const blockedByBalance = account.currentBalance != null && account.currentBalance !== 0;
  const blockedByFreeze = account.statusCd === STATUS_FREEZED;
  const blocked = blockedByBalance || blockedByFreeze;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setReasonError(t("form.errors.closingReason"));
      return;
    }
    if (trimmed.length > 250) {
      setReasonError(t("form.errors.closingReason"));
      return;
    }
    onConfirm({ closingReason: trimmed, closingDate });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={t("closeDialog.title")}
      subtitle={account.fullAccountNo || account.applNo}
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            {t("form.cancel")}
          </Button>
          <Button
            type="submit"
            form="close-deposit-account"
            variant="danger"
            icon={Lock}
            loading={saving}
            disabled={blocked}
          >
            {saving ? t("closeDialog.saving") : t("closeDialog.confirm")}
          </Button>
        </>
      }
    >
      <form id="close-deposit-account" className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {errorMessage ? <Alert tone="error">{errorMessage}</Alert> : null}
        {blockedByBalance ? <Alert tone="warning">{t("closeDialog.zeroBalance")}</Alert> : null}
        {blockedByFreeze ? <Alert tone="warning">{t("closeDialog.unfreeze")}</Alert> : null}
        <p className="text-sm text-slate-700">
          {t("closeDialog.balance", {
            amount: format.number(balance, {
              style: "currency",
              currency: "INR",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
          })}
        </p>
        <DateField
          label={t("closeDialog.date")}
          value={closingDate}
          min={account.applDate || undefined}
          max={todayYmd()}
          onChange={setClosingDate}
          disabled={blocked}
        />
        <FormField
          label={t("closeDialog.reason")}
          required
          error={reasonError}
          meta={`${reason.length}/250`}
        >
          <Textarea
            value={reason}
            maxLength={250}
            rows={4}
            disabled={blocked}
            aria-label={t("closeDialog.reason")}
            placeholder={t("closeDialog.reasonPlaceholder")}
            onChange={(event) => {
              setReason(event.target.value);
              setReasonError("");
            }}
          />
        </FormField>
      </form>
    </Modal>
  );
}
