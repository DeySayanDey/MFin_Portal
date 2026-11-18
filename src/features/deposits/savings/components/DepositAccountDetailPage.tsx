"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeftRight,
  Ban,
  Pencil,
  Power,
  PowerOff,
  SlidersHorizontal,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { Link, useRouter } from "@/i18n/navigation";
import { STATUS_ACTIVE } from "../deposit-account.constants";
import {
  depositAccountHref,
  depositStatusTone,
  savingsTransactionHref,
} from "../deposit-account.rules";
import {
  fetchDepositAccountView,
  isDepositAccountClientError,
  syncDepositAccountMembers,
} from "../services/deposit-account-client";
import type { DepositAccountDetail } from "../types/deposit-account.types";
import { DepositAccountDetailTabs } from "./DepositAccountDetailTabs";
import { useDepositAccountActions } from "./useDepositAccountActions";

const TXN_LIMIT = 10;

export type DepositAccountNotice = {
  created: string;
  updated: string;
  openingPending: boolean;
  voucherNote: string;
};

type DepositAccountDetailPageProps = {
  accountId: number;
  notice: DepositAccountNotice;
};

export function DepositAccountDetailPage({ accountId, notice }: DepositAccountDetailPageProps) {
  const t = useTranslations("deposits.savings");
  const tUi = useTranslations("ui");
  const tErrors = useTranslations("errors");
  const format = useFormatter();
  const router = useRouter();
  const [account, setAccount] = useState<DepositAccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [openingPending] = useState(notice.openingPending);
  const [voucherNote] = useState(notice.voucherNote);
  const [successMessage, setSuccessMessage] = useToastText();
  const [actionError, setActionError] = useToastText();

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  const actions = useDepositAccountActions({
    onChanged: (message) => {
      setSuccessMessage(message);
      reload();
    },
    onActionError: (message) => {
      setActionError(message);
      reload();
    },
  });

  useEffect(() => {
    if (notice.created) setSuccessMessage(t("toast.created", { accountNo: notice.created }));
    else if (notice.updated) setSuccessMessage(t("toast.updated", { accountNo: notice.updated }));
    const url = new URL(window.location.href);
    for (const key of ["created", "updated", "opening", "voucherNote"]) {
      url.searchParams.delete(key);
    }
    window.history.replaceState(null, "", url.toString());
  }, [notice.created, notice.updated, setSuccessMessage, t]);

  useEffect(() => {
    if (accountId <= 0) {
      setLoading(false);
      setLoadError(t("view.notFound"));
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchDepositAccountView(accountId, TXN_LIMIT)
      .then((data) => {
        if (!cancelled) setAccount(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          isDepositAccountClientError(err) && err.status === 404
            ? t("view.notFound")
            : isDepositAccountClientError(err)
              ? err.message
              : tErrors("generic"),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accountId, reloadKey, t, tErrors]);

  async function handleSync() {
    if (!account) return;
    setSyncing(true);
    try {
      const result = await syncDepositAccountMembers(account.accountId);
      setAccount((current) => (current ? { ...current, members: result.members } : current));
      setSuccessMessage(result.message || t("toast.membersSynced"));
    } catch (err) {
      setActionError(isDepositAccountClientError(err) ? err.message : tErrors("generic"));
    } finally {
      setSyncing(false);
    }
  }

  const money = (value: number | null) =>
    value == null
      ? t("dash")
      : format.number(value, {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  const active = account?.statusCd === STATUS_ACTIVE;

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <PageToast message={successMessage} />
      <PageToast message={actionError} tone="error" />

      <PageHeader
        title={account ? account.holderName || account.primaryName || t("view.title") : t("view.title")}
        description={account ? account.fullAccountNo || t("columns.notOpened") : undefined}
        breadcrumbs={
          <Link href="/deposits/savings" className="hover:text-slate-800">
            {t("title")}
          </Link>
        }
        actions={
          account && !account.isClosed ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                icon={ArrowLeftRight}
                onClick={() =>
                  router.push(savingsTransactionHref(account))
                }
              >
                {t("actions.depositWithdraw")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                icon={Pencil}
                onClick={() => router.push(depositAccountHref(account, "edit"))}
              >
                {t("actions.edit")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                icon={active ? PowerOff : Power}
                onClick={() => actions.openToggle(account)}
              >
                {active ? t("actions.deactivate") : t("actions.activate")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                icon={SlidersHorizontal}
                onClick={() => actions.openStatus(account)}
              >
                {t("actions.changeStatus")}
              </Button>
              <Button
                type="button"
                variant="danger"
                icon={Ban}
                onClick={() => actions.openClose(account)}
              >
                {t("actions.close")}
              </Button>
            </div>
          ) : undefined
        }
      />

      {openingPending ? <Alert tone="info">{t("view.openingPending")}</Alert> : null}
      {voucherNote ? (
        <Alert tone="warning">{t("view.voucherNote", { note: voucherNote })}</Alert>
      ) : null}

      {loading && !account ? <p className="text-sm text-muted">{tUi("loading")}</p> : null}

      {loadError ? (
        <div className="flex flex-col items-start gap-3">
          <Alert tone="error">{loadError}</Alert>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={reload}>
              {t("view.retry")}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push("/deposits/savings")}>
              {t("view.backToList")}
            </Button>
          </div>
        </div>
      ) : null}

      {account ? (
        <>
          <section
            aria-label={t("view.summary")}
            className="grid gap-4 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-600">{t("view.fullAccount")}</p>
              <p className="mt-0.5 break-words font-semibold text-slate-900">
                {account.fullAccountNo || t("columns.notOpened")}
              </p>
              <p className="text-xs text-muted">{account.applNo || t("dash")}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-600">{t("view.status")}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge tone={depositStatusTone(account.statusCd)} caps={false}>
                  {account.statusDesc || t("dash")}
                </Badge>
                {account.isClosed ? (
                  <Badge tone="neutral" caps={false}>
                    {t("closed")}
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="min-w-0 sm:text-end">
              <p className="text-xs font-semibold text-slate-600">{t("view.balance")}</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">
                {money(account.currentBalance)}
              </p>
            </div>
            <div className="min-w-0 sm:text-end">
              <p className="text-xs font-semibold text-slate-600">{t("view.available")}</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">
                {money(account.availableBalance)}
              </p>
            </div>
          </section>

          {account.nomRegd && account.nominees.length === 0 ? (
            <Alert tone="warning">{t("view.nomineeWarning")}</Alert>
          ) : null}

          <DepositAccountDetailTabs
            account={account}
            syncing={syncing}
            onSyncMembers={handleSync}
          />
        </>
      ) : null}

      {actions.dialogs}
    </div>
  );
}
