"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Check, ChevronLeft, ChevronRight, Search, Users } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/Form";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  fetchSavingsCustomers,
  isSavingsTransactionClientError,
} from "../services/savings-transaction-client";
import type {
  SavingsCustomer,
  SavingsCustomerAccount,
} from "../types/savings-transaction.types";

type AccountPickerModalProps = {
  open: boolean;
  selectedAccountId: number | null;
  onClose: () => void;
  onSelect: (account: SavingsCustomerAccount) => void;
};

const PAGE_SIZE = 20;

export function AccountPickerModal({
  open,
  selectedAccountId,
  onClose,
  onSelect,
}: AccountPickerModalProps) {
  const t = useTranslations("deposits.savingsTransaction");
  const format = useFormatter();

  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState({ keyword: "", page: 1 });
  const [customers, setCustomers] = useState<SavingsCustomer[]>([]);
  const [holder, setHolder] = useState<SavingsCustomer | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seenOpen, setSeenOpen] = useState(open);

  if (open !== seenOpen) {
    setSeenOpen(open);
    if (open) {
      setDraft("");
      setHolder(null);
      setQuery((current) =>
        current.keyword === "" && current.page === 1 ? current : { keyword: "", page: 1 },
      );
    }
  }

  const load = useCallback(
    async (keyword: string, page: number, signal: { cancelled: boolean }) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchSavingsCustomers({
          keyword: keyword || undefined,
          page,
          perPage: PAGE_SIZE,
        });
        if (signal.cancelled) return;
        setCustomers(result.items);
        setTotal(result.meta?.total ?? result.items.length);
      } catch (err) {
        if (signal.cancelled) return;
        setCustomers([]);
        setTotal(0);
        setError(isSavingsTransactionClientError(err) ? err.message : t("picker.loadError"));
      } finally {
        if (!signal.cancelled) setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    if (!open || holder) return;
    const signal = { cancelled: false };
    const timer = window.setTimeout(() => {
      void load(query.keyword, query.page, signal);
    }, 0);
    return () => {
      signal.cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, holder, query, load]);

  function submitSearch(event?: FormEvent) {
    event?.preventDefault();
    setHolder(null);
    setQuery({ keyword: draft.trim(), page: 1 });
  }

  function chooseCustomer(customer: SavingsCustomer) {
    if (customer.accounts.length === 1) {
      onSelect(customer.accounts[0]);
      return;
    }
    setHolder(customer);
  }

  const money = (value: number | null) =>
    value == null ? "—" : format.number(value, { style: "currency", currency: "INR" });

  const from = total === 0 ? 0 : (query.page - 1) * PAGE_SIZE + 1;
  const to = Math.min(total, (query.page - 1) * PAGE_SIZE + customers.length);
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Modal
      open={open}
      onClose={onClose}
      confirmOnClose={false}
      confirmOnSave={false}
      title={holder ? t("picker.accountsTitle") : t("picker.title")}
      subtitle={holder ? holder.name : t("picker.subtitle")}
      size="lg"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          {holder ? (
            <Button type="button" variant="secondary" onClick={() => setHolder(null)}>
              {t("picker.back")}
            </Button>
          ) : null}
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("picker.close")}
          </Button>
        </div>
      }
    >
      <div className="flex min-w-0 flex-col gap-4">
        {holder ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="bg-surface-muted text-start text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 text-start">{t("picker.columns.account")}</th>
                  <th scope="col" className="px-3 py-2 text-start">{t("picker.columns.scheme")}</th>
                  <th scope="col" className="px-3 py-2 text-end">{t("picker.columns.balance")}</th>
                  <th scope="col" className="px-3 py-2 text-end">{t("picker.columns.action")}</th>
                </tr>
              </thead>
              <tbody>
                {holder.accounts.map((account) => {
                  const isSelected = account.accountId === selectedAccountId;
                  return (
                    <tr key={account.accountId} className="border-t border-border hover:bg-surface-muted/60">
                      <td className="px-3 py-2">
                        <span className="block font-medium text-slate-900">
                          {account.fullAccountNo || account.applNo}
                        </span>
                        <span className="block text-xs text-muted">{account.depositTypeDesc || "—"}</span>
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {[account.schemeCode, account.schemeName].filter(Boolean).join(" · ") || "—"}
                      </td>
                      <td className="px-3 py-2 text-end text-slate-700">{money(account.currentBalance)}</td>
                      <td className="px-3 py-2 text-end">
                        <Button
                          type="button"
                          size="sm"
                          variant={isSelected ? "success" : "primary"}
                          icon={Check}
                          onClick={() => onSelect(account)}
                        >
                          {isSelected ? t("picker.selected") : t("picker.select")}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <form className="flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={submitSearch}>
              <div className="min-w-0 flex-1">
                <TextField
                  label={t("picker.filter")}
                  value={draft}
                  onChange={setDraft}
                  placeholder={t("form.accountPlaceholder")}
                  autoFocus
                />
              </div>
              <Button type="submit" icon={Search} loading={loading} className="w-full sm:w-auto">
                {t("form.search")}
              </Button>
            </form>

            {error ? <Alert tone="error">{error}</Alert> : null}

            {loading && customers.length === 0 ? (
              <div className="space-y-2" aria-label={t("picker.loading")}>
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : !error && customers.length === 0 ? (
              <EmptyState
                className="rounded-xl border border-dashed border-border"
                icon={<Users className="h-5 w-5" aria-hidden="true" />}
                title={t("picker.empty")}
                message={t("picker.emptyHint")}
              />
            ) : customers.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[36rem] text-sm">
                  <thead className="bg-surface-muted text-start text-xs font-semibold uppercase tracking-wide text-muted">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-start">{t("picker.columns.code")}</th>
                      <th scope="col" className="px-3 py-2 text-start">{t("picker.columns.name")}</th>
                      <th scope="col" className="px-3 py-2 text-start">{t("picker.columns.type")}</th>
                      <th scope="col" className="px-3 py-2 text-start">{t("picker.columns.mobile")}</th>
                      <th scope="col" className="px-3 py-2 text-end">{t("picker.columns.action")}</th>
                    </tr>
                  </thead>
                  <tbody className={loading ? "opacity-60" : undefined}>
                    {customers.map((customer) => (
                      <tr
                        key={`${customer.custTypeCd}-${customer.custId}`}
                        className="border-t border-border hover:bg-surface-muted/60"
                      >
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-700">
                          {customer.refCode || String(customer.custId)}
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-900">{customer.name || "—"}</td>
                        <td className="px-3 py-2 text-slate-700">{customer.custTypeDesc || "—"}</td>
                        <td className="px-3 py-2 text-slate-700">{customer.mobileNo || "—"}</td>
                        <td className="px-3 py-2 text-end">
                          <Button
                            type="button"
                            size="sm"
                            variant="primary"
                            icon={Check}
                            disabled={customer.accounts.length === 0}
                            onClick={() => chooseCustomer(customer)}
                          >
                            {t("picker.select")}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {total > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                <span>{t("picker.showing", { from, to, total })}</span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    icon={ChevronLeft}
                    disabled={loading || query.page <= 1}
                    onClick={() => setQuery((current) => ({ ...current, page: current.page - 1 }))}
                  >
                    {t("picker.previous")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    icon={ChevronRight}
                    disabled={loading || query.page >= lastPage}
                    onClick={() => setQuery((current) => ({ ...current, page: current.page + 1 }))}
                  >
                    {t("picker.next")}
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </Modal>
  );
}
