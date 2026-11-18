"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { PageHeader } from "@/components/shared/PageHeader";
import { Link, useRouter } from "@/i18n/navigation";
import { accountDetailHref, mapApiMessageToField } from "../deposit-account.rules";
import {
  addDepositNominees,
  addDepositSignatories,
  changeDepositNomineeStatus,
  changeDepositSignatoryStatus,
  editDepositNominee,
  editDepositSignatory,
  fetchDepositAccountView,
  isDepositAccountClientError,
  updateDepositAccount,
} from "../services/deposit-account-client";
import type {
  DepositAccountCreateInput,
  DepositAccountDetail,
  DepositAccountEditInput,
  DepositAccountSaveResult,
  DepositNomineeSave,
  DepositSignatorySave,
} from "../types/deposit-account.types";
import { DepositAccountForm } from "./DepositAccountForm";

type DepositAccountEditPageProps = {
  accountId: number;
  detailHref: string;
};

export function DepositAccountEditPage({
  accountId,
  detailHref,
}: DepositAccountEditPageProps) {
  const t = useTranslations("deposits.savings");
  const tUi = useTranslations("ui");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const [account, setAccount] = useState<DepositAccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedResult, setSavedResult] = useState<DepositAccountSaveResult | null>(null);
  const [actionError, setActionError] = useToastText();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    fetchDepositAccountView(accountId, 1)
      .then((result) => {
        if (!cancelled) setAccount(result);
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
  }, [accountId, reloadKey]);

  function leave() {
    if (saving) return;
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(detailHref);
  }

  async function handleSave(
    input: DepositAccountCreateInput | DepositAccountEditInput,
    nominees: DepositNomineeSave,
    signatories: DepositSignatorySave,
  ) {
    if (!("accountId" in input) || !account) return;
    const nomineePending =
      nominees.add.length > 0 ||
      nominees.edit.length > 0 ||
      nominees.deactivate.length > 0;
    const signatoryPending =
      signatories.add.length > 0 ||
      signatories.edit.length > 0 ||
      signatories.deactivate.length > 0;
    if (Object.keys(input).length === 1 && !nomineePending && !signatoryPending) {
      router.push(detailHref);
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      let saved = savedResult;
      if (!saved) {
        saved =
          Object.keys(input).length === 1
            ? { account, openingTransaction: null }
            : await updateDepositAccount(input);
        setSavedResult(saved);
      }
      for (const item of nominees.deactivate) {
        await changeDepositNomineeStatus(item);
      }
      for (const item of nominees.edit) {
        await editDepositNominee(item);
      }
      if (nominees.add.length > 0) {
        await addDepositNominees({
          accountId: saved.account.accountId,
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
          accountId: saved.account.accountId,
          signatories: signatories.add,
        });
      }
      router.push(accountDetailHref(saved, "updated"));
    } catch (err) {
      const message = isDepositAccountClientError(err)
        ? err.message
        : tErrors("generic");
      if (mapApiMessageToField(message) === "toast") {
        setActionError(message);
        setSavedResult(null);
        setReloadKey((key) => key + 1);
        return;
      }
      setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <PageToast message={actionError} tone="error" />
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
          description={account?.fullAccountNo || account?.applNo || t("form.stepHint")}
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
      {account && !account.isClosed && !loading ? (
        <DepositAccountForm
          key={reloadKey}
          open
          layout="page"
          mode="edit"
          account={account}
          transactionCount={account.transactionCount}
          saving={saving}
          errorMessage={formError}
          onClose={leave}
          onSubmit={handleSave}
        />
      ) : null}
    </div>
  );
}
