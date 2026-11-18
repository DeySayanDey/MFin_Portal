"use client";

import { useEffect, useMemo, useState } from "react";
import { Info, Search, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/toast";
import { SAVINGS_DEPOSIT_TYPE } from "@/features/deposits/savings/deposit-account.constants";
import { AccountPickerModal } from "@/features/deposits/savings-transaction/components/AccountPickerModal";
import type { SavingsCustomerAccount } from "@/features/deposits/savings-transaction/types/savings-transaction.types";
import { initialAmounts, isPostable, parseAmount, type AmountMap } from "../interest-posting.rules";
import { fetchInterestCalculation, isInterestClientError } from "../services/interest-posting-client";
import type { InterestRow } from "../types/interest-posting.types";
import { InterestPostConfirm } from "./InterestPostConfirm";
import { InterestPostSummary, InterestRowsTable } from "./InterestRowsEditor";
import { useInterestFormat } from "./useInterestFormat";
import { useInterestPost } from "./useInterestPost";

type SingleInterestPanelProps = {
  asOnDate: string;
  postingDate: string;
};

export function SingleInterestPanel({ asOnDate, postingDate }: SingleInterestPanelProps) {
  const { t, money, date } = useInterestFormat();
  const [account, setAccount] = useState<SavingsCustomerAccount | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [rows, setRows] = useState<InterestRow[]>([]);
  const [amounts, setAmounts] = useState<AmountMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const flow = useInterestPost("single", asOnDate, postingDate, () => setReloadKey((key) => key + 1));

  useEffect(() => {
    if (!account || !asOnDate) {
      setRows([]);
      setAmounts({});
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchInterestCalculation({ mode: "single", accountId: account.accountId, asOnDate }, reloadKey)
      .then((result) => {
        if (cancelled) return;
        setRows(result.items);
        setAmounts(initialAmounts(result.items));
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setRows([]);
        setError(isInterestClientError(reason) ? reason.message : t("loadFailed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [account, asOnDate, reloadKey, t]);

  const postable = useMemo(() => rows.filter(isPostable), [rows]);
  const upToDate = rows.length > 0 && postable.length === 0 ? rows[0] : null;
  const total = postable.reduce((sum, row) => sum + (parseAmount(amounts[row.accountId]) ?? 0), 0);

  function choose(selected: SavingsCustomerAccount) {
    if (selected.depositTypeCd !== SAVINGS_DEPOSIT_TYPE) {
      showToast(t("single.savingsOnly"), "error");
      return;
    }
    setPickerOpen(false);
    setAccount(selected);
    flow.setRemarks("");
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <Wallet className="h-5 w-5" aria-hidden />
          </span>
          {account ? (
            <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-6 gap-y-2 text-sm lg:grid-cols-4">
              {(
                [
                  ["account", account.fullAccountNo || account.applNo],
                  ["holder", account.holderName],
                  ["scheme", account.schemeName],
                  ["balance", money(account.currentBalance)],
                ] as const
              ).map(([key, value]) => (
                <div key={key} className="min-w-0">
                  <dt className="text-xs text-muted">{t(`single.${key}`)}</dt>
                  <dd className="truncate font-semibold text-foreground">{value || t("dash")}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{t("single.emptyTitle")}</p>
              <p className="text-sm text-muted">{t("single.emptyMessage")}</p>
            </div>
          )}
          <div className="flex shrink-0 gap-2">
            <Button type="button" icon={Search} onClick={() => setPickerOpen(true)}>
              {account ? t("single.change") : t("single.choose")}
            </Button>
            {account ? (
              <Button
                type="button"
                variant="secondary"
                icon={X}
                onClick={() => {
                  setAccount(null);
                  setError(null);
                  flow.setRemarks("");
                }}
              >
                {t("single.clear")}
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {account ? (
        <>
          {upToDate ? (
            <p className="flex items-start gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {upToDate.lastPostedDate
                ? t("single.upToDate", { date: date(upToDate.lastPostedDate), asOn: date(asOnDate) })
                : t("single.notDue", { asOn: date(asOnDate) })}
            </p>
          ) : null}
          <InterestRowsTable
            rows={rows}
            amounts={amounts}
            onAmountChange={(id, value) => setAmounts((current) => ({ ...current, [id]: value }))}
            title={t("single.tableTitle")}
            description={t("single.tableDescription", { asOn: date(asOnDate) })}
            loading={loading}
            error={error}
            onRetry={() => setReloadKey((key) => key + 1)}
            emptyTitle={t("single.noInterestTitle")}
            emptyMessage={t("single.noInterestMessage")}
          />
          {postable.length > 0 ? (
            <InterestPostSummary
              rows={postable}
              amounts={amounts}
              remarks={flow.remarks}
              onRemarksChange={flow.setRemarks}
              posting={flow.posting}
              onPost={() => flow.setConfirmOpen(true)}
            />
          ) : null}
        </>
      ) : null}

      <AccountPickerModal
        open={pickerOpen}
        selectedAccountId={account?.accountId ?? null}
        onClose={() => setPickerOpen(false)}
        onSelect={choose}
      />
      <InterestPostConfirm
        open={flow.confirmOpen}
        count={postable.length}
        total={total}
        asOnDate={asOnDate}
        postingDate={postingDate}
        onClose={() => flow.setConfirmOpen(false)}
        onConfirm={() => flow.post(postable, amounts)}
      />
    </div>
  );
}
