"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { STATUS_ACTIVE, STATUS_INOPERATIVE } from "../deposit-account.constants";
import { mapApiMessageToField } from "../deposit-account.rules";
import {
  changeDepositAccountStatus,
  closeDepositAccount,
  isDepositAccountClientError,
} from "../services/deposit-account-client";
import type { DepositAccount } from "../types/deposit-account.types";
import { DepositAccountCloseModal } from "./DepositAccountCloseModal";
import { DepositAccountStatusModal } from "./DepositAccountStatusModal";

type Options = {
  onChanged: (message: string) => void;
  onActionError: (message: string) => void;
};

export function useDepositAccountActions({ onChanged, onActionError }: Options) {
  const t = useTranslations("deposits.savings");
  const tErrors = useTranslations("errors");
  const [statusTarget, setStatusTarget] = useState<DepositAccount | null>(null);
  const [closeTarget, setCloseTarget] = useState<DepositAccount | null>(null);
  const [toggleTarget, setToggleTarget] = useState<DepositAccount | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);

  function errorText(err: unknown): string {
    return isDepositAccountClientError(err) ? err.message : tErrors("generic");
  }

  async function handleStatus(statusCd: number) {
    if (!statusTarget) return;
    setSaving(true);
    setStatusError(null);
    try {
      const updated = await changeDepositAccountStatus({
        accountId: statusTarget.accountId,
        statusCd,
      });
      setStatusTarget(null);
      onChanged(t("toast.statusChanged", { status: updated.statusDesc || t("dash") }));
    } catch (err) {
      const message = errorText(err);
      if (mapApiMessageToField(message) === "toast") {
        setStatusTarget(null);
        onActionError(message);
      } else {
        setStatusError(message);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle() {
    if (!toggleTarget) return;
    const statusCd =
      toggleTarget.statusCd === STATUS_ACTIVE ? STATUS_INOPERATIVE : STATUS_ACTIVE;
    try {
      const updated = await changeDepositAccountStatus({
        accountId: toggleTarget.accountId,
        statusCd,
      });
      onChanged(t("toast.statusChanged", { status: updated.statusDesc || t("dash") }));
    } catch (err) {
      onActionError(errorText(err));
    } finally {
      setToggleTarget(null);
    }
  }

  async function handleClose(input: { closingReason: string; closingDate: string }) {
    if (!closeTarget) return;
    setSaving(true);
    setCloseError(null);
    try {
      const updated = await closeDepositAccount({
        accountId: closeTarget.accountId,
        closingReason: input.closingReason,
        closingDate: input.closingDate,
      });
      setCloseTarget(null);
      onChanged(
        t("toast.closed", { accountNo: updated.fullAccountNo || updated.applNo }),
      );
    } catch (err) {
      setCloseError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  const activating = toggleTarget?.statusCd !== STATUS_ACTIVE;

  const dialogs = (
    <>
      <ConfirmDialog
        open={toggleTarget != null}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggle}
        actionType={activating ? "activate" : "deactivate"}
        title={activating ? t("toggleDialog.activateTitle") : t("toggleDialog.deactivateTitle")}
        description={
          activating ? t("toggleDialog.activateHelp") : t("toggleDialog.deactivateHelp")
        }
        itemType={t("toggleDialog.itemType")}
        itemName={
          toggleTarget
            ? t("toggleDialog.itemName", {
                holder: toggleTarget.holderName || toggleTarget.primaryName || t("dash"),
                accountNo: toggleTarget.fullAccountNo || toggleTarget.applNo,
              })
            : undefined
        }
      />

      <DepositAccountStatusModal
        account={statusTarget}
        saving={saving}
        errorMessage={statusError}
        onClose={() => {
          if (saving) return;
          setStatusTarget(null);
          setStatusError(null);
        }}
        onConfirm={handleStatus}
      />

      <DepositAccountCloseModal
        account={closeTarget}
        saving={saving}
        errorMessage={closeError}
        onClose={() => {
          if (saving) return;
          setCloseTarget(null);
          setCloseError(null);
        }}
        onConfirm={handleClose}
      />
    </>
  );

  return {
    openStatus: (account: DepositAccount) => {
      setStatusError(null);
      setStatusTarget(account);
    },
    openClose: (account: DepositAccount) => {
      setCloseError(null);
      setCloseTarget(account);
    },
    openToggle: (account: DepositAccount) => setToggleTarget(account),
    dialogs,
  };
}
