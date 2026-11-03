"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import { PageToast } from "@/components/ui/PageToast";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { fetchApplOptions, type ApplOption } from "@/features/master/appl-options";
import { OPT_STATUS } from "../deposit-account.constants";
import type { DepositAccount } from "../types/deposit-account.types";

const HELP_KEYS = {
  1: "helpActive",
  2: "helpInoperative",
  3: "helpDormant",
  4: "helpFreezed",
  5: "helpStopWithdrawal",
  6: "helpStopInterest",
  7: "helpKyc",
} as const;

type DepositAccountStatusModalProps = {
  account: DepositAccount | null;
  saving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onConfirm: (statusCd: number) => void;
};

export function DepositAccountStatusModal({
  account,
  saving,
  errorMessage,
  onClose,
  onConfirm,
}: DepositAccountStatusModalProps) {
  const t = useTranslations("deposits.savings");
  const [options, setOptions] = useState<ApplOption[]>([]);
  const [statusCd, setStatusCd] = useState("");

  useEffect(() => {
    if (!account) return;
    setStatusCd(String(account.statusCd));
    let cancelled = false;
    fetchApplOptions(OPT_STATUS)
      .then((rows) => {
        if (!cancelled) setOptions(rows);
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [account]);

  return (
    <Modal
      open={account != null}
      onClose={onClose}
      title={t("statusDialog.title")}
      subtitle={account ? account.fullAccountNo || account.applNo : undefined}
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            {t("form.cancel")}
          </Button>
          <Button
            type="button"
            icon={RefreshCw}
            loading={saving}
            disabled={!statusCd}
            onClick={() => onConfirm(Number(statusCd))}
          >
            {saving ? t("statusDialog.saving") : t("statusDialog.confirm")}
          </Button>
        </>
      }
    >
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">{t("statusDialog.title")}</legend>
        <PageToast message={errorMessage ?? null} tone="error" />
        {options.map((option) => {
          const helpKey = HELP_KEYS[option.optCode as keyof typeof HELP_KEYS];
          return (
            <label
              key={option.optCode}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-border px-3 py-2.5 text-sm"
            >
              <input
                type="radio"
                name="deposit-account-status"
                className="mt-1"
                checked={statusCd === String(option.optCode)}
                onChange={() => setStatusCd(String(option.optCode))}
              />
              <span>
                <span className="font-medium text-slate-800">
                  {option.optDescription}
                </span>
                {helpKey ? (
                  <span className="mt-0.5 block text-xs text-muted">
                    {t(`statusDialog.${helpKey}`)}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </fieldset>
    </Modal>
  );
}
