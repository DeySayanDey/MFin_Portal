"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/toast";
import { SAVINGS_DEPOSIT_TYPE } from "@/features/deposits/savings/deposit-account.constants";
import { AccountPickerModal } from "@/features/deposits/savings-transaction/components/AccountPickerModal";
import type { SavingsCustomerAccount } from "@/features/deposits/savings-transaction/types/savings-transaction.types";
import {
  initialChargeAmounts,
  isDefaultSelected,
  shortAccounts,
  type ChargeAmountMap,
} from "../charge-posting.rules";
import { fetchChargeCalculation, isChargeClientError } from "../services/charge-posting-client";
import type { ChargeRow } from "../types/charge-posting.types";
import { ChargePostConfirm } from "./ChargePostConfirm";
import { ChargePostSummary, ChargeRowsTable } from "./ChargeRowsEditor";
import { useChargeFormat } from "./useChargeFormat";
import { useChargePost } from "./useChargePost";

type SingleChargePanelProps = {
  chargeDate: string;
};

export function SingleChargePanel({ chargeDate }: SingleChargePanelProps) {
  const { t, money, date } = useChargeFormat();
  const [account, setAccount] = useState<SavingsCustomerAccount | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [rows, setRows] = useState<ChargeRow[]>([]);
  const [amounts, setAmounts] = useState<ChargeAmountMap>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const flow = useChargePost("single", chargeDate, () => setReloadKey((key) => key + 1));

  useEffect(() => {
    if (!account || !chargeDate) {
      setRows([]);
      setAmounts({});
      setSelected([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchChargeCalculation({ mode: "single", accountId: account.accountId, chargeDate }, reloadKey)
      .then((result) => {
        if (cancelled) return;
        setRows(result.items);
        setAmounts(initialChargeAmounts(result.items));
        setSelected(result.items.filter(isDefaultSelected).map((row) => row.rowKey));
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setRows([]);
        setSelected([]);
        setError(isChargeClientError(reason) ? reason.message : t("loadFailed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [account, chargeDate, reloadKey, t]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const selectedRows = useMemo(() => rows.filter((row) => selectedSet.has(row.rowKey)), [rows, selectedSet]);
  const short = useMemo(() => shortAccounts(selectedRows, amounts), [amounts, selectedRows]);
  const available = rows[0]?.availableBalance ?? account?.currentBalance ?? null;

  function choose(picked: SavingsCustomerAccount) {
    if (picked.depositTypeCd !== SAVINGS_DEPOSIT_TYPE) {
      showToast(t("single.savingsOnly"), "error");
      return;
    }
    setPickerOpen(false);
    setAccount(picked);
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
                  ["available", money(available)],
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
          <ChargeRowsTable
            rows={rows}
            amounts={amounts}
            onAmountChange={(key, value) => setAmounts((current) => ({ ...current, [key]: value }))}
            selectedKeys={selected}
            onSelectionChange={setSelected}
            shortAccountIds={short}
            showAccount={false}
            title={t("single.tableTitle")}
            description={t("single.tableDescription", {
              scheme: account.schemeName || t("dash"),
              date: date(chargeDate),
            })}
            loading={loading}
            error={error}
            onRetry={() => setReloadKey((key) => key + 1)}
            emptyTitle={t("single.noChargesTitle")}
            emptyMessage={t("single.noChargesMessage")}
          />
          {rows.length > 0 ? (
            <ChargePostSummary
              rows={selectedRows}
              amounts={amounts}
              shortCount={short.size}
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
      <ChargePostConfirm
        open={flow.confirmOpen}
        rows={selectedRows}
        amounts={amounts}
        chargeDate={chargeDate}
        onClose={() => flow.setConfirmOpen(false)}
        onConfirm={() => flow.post(selectedRows, amounts)}
      />
    </div>
  );
}
