"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Link, useRouter } from "@/i18n/navigation";
import { mapApiMessageToField } from "../deposit-account.rules";
import {
  addDepositNominees,
  addDepositSignatories,
  createDepositAccount,
  isDepositAccountClientError,
} from "../services/deposit-account-client";
import type {
  DepositAccount,
  DepositAccountCreateInput,
  DepositAccountEditInput,
  DepositNomineeSave,
  DepositSignatorySave,
} from "../types/deposit-account.types";
import { DepositAccountForm } from "./DepositAccountForm";

export function DepositAccountOpenPage() {
  const t = useTranslations("deposits.savings");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedAccount, setSavedAccount] = useState<DepositAccount | null>(null);

  useEffect(() => {
    const scroller = document.querySelector("main");
    if (scroller) {
      scroller.scrollTop = 0;
    }
  }, []);

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
    if ("accountId" in input) return;
    setSaving(true);
    setFormError(null);
    try {
      let saved = savedAccount;
      if (!saved) {
        saved = await createDepositAccount(input);
        setSavedAccount(saved);
      }
      if (nominees.add.length > 0) {
        await addDepositNominees({
          accountId: saved.accountId,
          nominees: nominees.add,
        });
      }
      if (signatories.add.length > 0) {
        await addDepositSignatories({
          accountId: saved.accountId,
          signatories: signatories.add,
        });
      }
      const created = encodeURIComponent(saved.applNo);
      router.push(`/deposits/savings?created=${created}`);
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
          title={t("form.createTitle")}
          description={t("form.stepHint")}
          breadcrumbs={
            <Link href="/deposits/savings" className="hover:text-slate-800">
              {/* {t("title")} */}
            </Link>
          }
        />
      </div>
      <DepositAccountForm
        open
        layout="page"
        mode="create"
        account={null}
        saving={saving}
        errorMessage={formError}
        onClose={leave}
        onSubmit={handleSave}
      />
    </div>
  );
}
