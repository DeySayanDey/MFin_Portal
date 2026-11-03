"use client";

import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { Button } from "@/components/ui/Button";
import { DateField, SelectField, TextField } from "@/components/ui/Form";
import { Modal } from "@/components/ui/Modal";
import { PAYMENT_MODE_CASH } from "../share-subscription.constants";
import { cents, moneyAmount, wholeNumber } from "../share-subscription.utils";
import {
  editShareSubscription,
  fetchShareHolding,
  isShareSubscriptionClientError,
} from "../services/share-subscription-client";
import type { ShareHolding, ShareSubscription } from "../types/share-subscription.types";

type Option = { value: string; label: string };

type ShareSubscriptionEditModalProps = {
  row: ShareSubscription | null;
  today: string;
  paymentModeOptions: Option[];
  onClose: () => void;
  onSaved: (message: string) => void;
};

export function ShareSubscriptionEditModal({
  row,
  today,
  paymentModeOptions,
  onClose,
  onSaved,
}: ShareSubscriptionEditModalProps) {
  const t = useTranslations("onboarding.shareSubscription");
  const format = useFormatter();
  const formId = useId();

  const [holding, setHolding] = useState<ShareHolding | null>(null);
  const [subscriptionDate, setSubscriptionDate] = useState("");
  const [shares, setShares] = useState("");
  const [paid, setPaid] = useState("");
  const [paymentModeCd, setPaymentModeCd] = useState(String(PAYMENT_MODE_CASH));
  const [refNo, setRefNo] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useToastText();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!row) return;
    setSubscriptionDate(row.subscriptionDate || today);
    setShares(String(row.noOfShares));
    setPaid(String(row.paidAmount));
    setPaymentModeCd(String(row.paymentModeCd ?? PAYMENT_MODE_CASH));
    setRefNo(row.transRefNo);
    setRemarks(row.remarks);
    setError(null);
    setHolding(null);

    let cancelled = false;
    fetchShareHolding({ custTypeCd: row.custTypeCd, customerId: row.customerId })
      .then((result) => {
        if (!cancelled) setHolding(result);
      })
      .catch(() => {
        if (!cancelled) setHolding(null);
      });
    return () => {
      cancelled = true;
    };
  }, [row, today]);

  const money = useCallback(
    (value: number | null) =>
      value == null ? "—" : format.number(value, { style: "currency", currency: "INR" }),
    [format],
  );

  const faceValue = holding?.faceValue ?? row?.faceValue ?? 0;
  const shareCount = wholeNumber(shares);
  const amount = shareCount != null && faceValue > 0 ? cents(shareCount * faceValue) / 100 : null;
  const paidValue = moneyAmount(paid);
  const balance =
    amount != null && paidValue != null ? Math.max(0, cents(amount - paidValue) / 100) : null;
  const isCash = Number(paymentModeCd) === PAYMENT_MODE_CASH;

  function sharesError(value: string): string | undefined {
    if (!value.trim()) return undefined;
    const count = wholeNumber(value);
    if (count == null) return t("form.errors.sharesInvalid");
    if (holding?.minShares != null && count < holding.minShares) {
      return t("form.errors.sharesBelowMin", { min: holding.minShares });
    }
    if (holding?.maxShares != null && row) {
      const available = Math.max(
        0,
        holding.maxShares - holding.totalShares - holding.pendingShares + row.noOfShares,
      );
      if (count > available) {
        return t("form.errors.sharesAboveMax", { max: holding.maxShares, available });
      }
    }
    return undefined;
  }

  function paidError(): string | undefined {
    if (!paid.trim()) return undefined;
    if (paidValue == null) return t("form.errors.paidInvalid");
    if (amount != null && cents(paidValue) > cents(amount)) {
      return t("form.errors.paidExceeds", { amount: money(amount) });
    }
    return undefined;
  }

  function validate(): string | null {
    if (!subscriptionDate) return t("form.errors.dateRequired");
    if (subscriptionDate > today) return t("form.errors.futureDate");
    if (shareCount == null) return t("form.errors.sharesInvalid");
    const shareMessage = sharesError(shares);
    if (shareMessage) return shareMessage;
    if (paidValue == null) return t("form.errors.paidInvalid");
    const paidMessage = paidError();
    if (paidMessage) return paidMessage;
    if (!isCash && !refNo.trim()) return t("form.errors.refRequired");
    return null;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!row) return;
    const message = validate();
    setError(message);
    if (message || shareCount == null || paidValue == null) return;
    setSaving(true);
    try {
      const result = await editShareSubscription({
        subscriptionId: row.subscriptionId,
        subscriptionDate,
        noOfShares: shareCount,
        paidAmount: paidValue,
        paymentModeCd: Number(paymentModeCd),
        transRefNo: refNo.trim() || null,
        remarks: remarks.trim() || null,
      });
      onSaved(result.message || t("edit.saved"));
    } catch (caught) {
      setError(isShareSubscriptionClientError(caught) ? caught.message : t("edit.failed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={row != null}
      size="md"
      title={t("edit.title")}
      subtitle={
        row
          ? t("edit.subtitle", {
              no: row.subscriptionNo || String(row.subscriptionId),
              name: row.customerName || row.customerCode,
            })
          : undefined
      }
      confirmOnSave={false}
      onClose={() => {
        if (!saving) onClose();
      }}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" disabled={saving} onClick={onClose}>
            {t("approval.cancel")}
          </Button>
          <Button type="submit" form={formId} icon={Save} loading={saving}>
            {saving ? t("form.saving") : t("edit.submit")}
          </Button>
        </div>
      }
    >
      <form
        id={formId}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0"
        onSubmit={(event) => void submit(event)}
      >
        <PageToast message={error} tone="error" />
        <DateField
          label={t("form.date")}
          value={subscriptionDate}
          required
          max={today}
          onChange={setSubscriptionDate}
        />
        <TextField
          label={t("form.faceValue")}
          value={faceValue > 0 ? money(faceValue) : ""}
          readOnly
        />
        <TextField
          label={t("form.shares")}
          value={shares}
          required
          restrict="digits"
          inputMode="numeric"
          validate={(value) => sharesError(value)}
          onChange={setShares}
        />
        <TextField
          label={t("form.amount")}
          value={amount == null ? "" : money(amount)}
          readOnly
        />
        <TextField
          label={t("form.paid")}
          value={paid}
          required
          restrict="decimal"
          inputMode="decimal"
          error={paidError()}
          onChange={setPaid}
        />
        <TextField
          label={t("form.outstanding")}
          value={balance == null ? "" : money(balance)}
          readOnly
        />
        <SelectField
          label={t("form.paymentMode")}
          value={paymentModeCd}
          required
          options={paymentModeOptions}
          onChange={setPaymentModeCd}
        />
        <TextField
          label={t("form.refNo")}
          value={refNo}
          required={!isCash}
          maxLength={25}
          onChange={(value) => setRefNo(value.slice(0, 25))}
        />
        <div className="sm:col-span-2">
          <TextField
            label={t("form.remarks")}
            value={remarks}
            maxLength={250}
            onChange={(value) => setRemarks(value.slice(0, 250))}
          />
        </div>
      </form>
    </Modal>
  );
}
