"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/shared/PageHeader";
import { Link, useRouter } from "@/i18n/navigation";
import { SAVINGS_DEPOSIT_TYPE } from "../deposit-account.constants";
import { mapApiMessageToField } from "../deposit-account.rules";
import {
  addDepositNominees,
  addDepositSignatories,
  changeDepositNomineeStatus,
  changeDepositSignatoryStatus,
  editDepositNominee,
  editDepositSignatory,
  fetchDepositAccounts,
  isDepositAccountClientError,
  updateDepositAccount,
} from "../services/deposit-account-client";
import type {
  DepositAccount,
  DepositAccountCreateInput,
  DepositAccountEditInput,
  DepositNomineeSave,
  DepositSignatorySave,
} from "../types/deposit-account.types";
import { DepositAccountForm } from "./DepositAccountForm";

type DepositAccountEditPageProps = {
  accountId: number;
};

export function DepositAccountEditPage({
  accountId,
}: DepositAccountEditPageProps) {
  const t = useTranslations("deposits.savings");
  const tUi = useTranslations("ui");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const [account, setAccount] = useState<DepositAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedAccount, setSavedAccount] = useState<DepositAccount | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDepositAccounts({
      accountId,
      perPage: 1,
      depositTypeCd: SAVINGS_DEPOSIT_TYPE,
    })
      .then((result) => {
        if (!cancelled) setAccount(result.items[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  function leave() {
    if (saving) return;
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/deposits/savings");
  }

  async function handleSave(
    input: DepositAccountCreateInput | DepositAccountEditInput,
    nominees: DepositNomineeSave,
    signatories: DepositSignatorySave,
  ) {
    if (!("accountId" in input)) return;
    const nomineePending =
      nominees.add.length > 0 ||
      nominees.edit.length > 0 ||
      nominees.deactivate.length > 0;
    const signatoryPending =
      signatories.add.length > 0 ||
      signatories.edit.length > 0 ||
      signatories.deactivate.length > 0;
    if (
      Object.keys(input).length === 1 &&
      !nomineePending &&
      !signatoryPending
    ) {
      router.push("/deposits/savings");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      let saved = savedAccount;
      if (!saved) {
        saved =
          Object.keys(input).length === 1
            ? account
            : await updateDepositAccount(input);
        if (!saved) return;
        setSavedAccount(saved);
      }
      for (const item of nominees.deactivate) {
        await changeDepositNomineeStatus(item);
      }
      for (const item of nominees.edit) {
        await editDepositNominee(item);
      }
      if (nominees.add.length > 0) {
        await addDepositNominees({
          accountId: saved.accountId,
          nominees: nominees.add,
        });
      }
      for (const item of signatories.deactivate) {
        await changeDepositSignatoryStatus(item);
      }
      for (const item of signatories.edit) {
        await editDepositSignatory(item);
      }
      if (signatories.add.length > 0) {
        await addDepositSignatories({
          accountId: saved.accountId,
          signatories: signatories.add,
        });
      }
      const updated = encodeURIComponent(saved.applNo);
      router.push(`/deposits/savings?updated=${updated}`);
    } catch (err) {
      const message = isDepositAccountClientError(err)
        ? err.message
        : tErrors("generic");
      if (mapApiMessageToField(message) === "toast") {
        router.push(
          `/deposits/savings?created=${encodeURIComponent(message)}&createdTone=error`,
        );
        return;
      }
      setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="flex min-w-0 items-start gap-2">
        <Button
          variant="ghost"
          icon={ArrowLeft}
          tooltip={t("form.back")}
          aria-label={t("form.back")}
          disabled={saving}
          onClick={leave}
        />
        <PageHeader
          className="min-w-0 flex-1"
          title={t("form.editTitle")}
          description={account?.applNo || t("form.stepHint")}
          breadcrumbs={
            <Link href="/deposits/savings" className="hover:text-slate-800">
              {/* {t("title")} */}
            </Link>
          }
        />
      </div>
      {loading ? <p className="text-sm text-muted">{tUi("loading")}</p> : null}
      {loadError || (!loading && !account) ? (
        <Alert tone="error">{t("loadErrorTitle")}</Alert>
      ) : null}
      {account?.isClosed ? (
        <div className="flex flex-col items-start gap-3">
          <Alert tone="warning">{t("form.closedEdit")}</Alert>
          <Button type="button" variant="secondary" onClick={leave}>
            {t("form.cancel")}
          </Button>
        </div>
      ) : null}
      {account && !account.isClosed ? (
        <DepositAccountForm
          open
          layout="page"
          mode="edit"
          account={account}
          saving={saving}
          errorMessage={formError}
          onClose={leave}
          onSubmit={handleSave}
        />
      ) : null}
    </div>
  );
}
