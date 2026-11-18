"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Printer, Search, Send, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/PageHeader";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { PageToast, useToastNotice, useToastText } from "@/components/ui/PageToast";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DateField, SelectField, TextField } from "@/components/ui/Form";
import { fetchApplOptions } from "@/features/master/appl-options";
import { fetchStaffList } from "@/features/master/staff/services/staff-client";
import { OPT_DEPOSIT_TYPE } from "@/features/deposits/savings/deposit-account.constants";
import { parseYmd, todayYmd } from "@/features/deposits/savings/deposit-account.rules";
import { fetchDepositAccounts } from "@/features/deposits/savings/services/deposit-account-client";
import type { DepositAccount } from "@/features/deposits/savings/types/deposit-account.types";
import {
  DEPOSIT_BLOCKED,
  OPT_TRANS_TYPE,
  STATUS_PENDING,
  STATUS_POSTED,
  STATUS_REJECTED,
  TRANS_DEPOSIT,
  TRANS_MODES,
  TRANS_WITHDRAWAL,
  WITHDRAWAL_BLOCKED,
  type TransMode,
} from "../savings-transaction.constants";
import { AccountPickerModal } from "./AccountPickerModal";
import { SavingsTransactionPrintReport } from "./SavingsTransactionPrintReport";
import { useSavingsTransactionLabels } from "./useSavingsTransactionLabels";
import { useSavingsTransactionPrint } from "./useSavingsTransactionPrint";
import {
  addSavingsTransaction,
  fetchSavingsAccountBalance,
  fetchSavingsTransactions,
  isSavingsTransactionClientError,
  postMissingVouchers,
} from "../services/savings-transaction-client";
import type {
  SavingsAccountBalance,
  SavingsCustomerAccount,
  SavingsTransaction,
  SavingsTransactionReportContext,
} from "../types/savings-transaction.types";

type Filters = {
  search: string;
  transTypeCd: string;
  transMode: string;
  statusCd: string;
  depositTypeCd: string;
  fromDate: string;
  toDate: string;
};

const emptyFilters: Filters = {
  search: "",
  transTypeCd: "",
  transMode: "",
  statusCd: "",
  depositTypeCd: "",
  fromDate: "",
  toDate: "",
};

const SEARCH_DEBOUNCE_MS = 350;

function filtersEqual(left: Filters, right: Filters): boolean {
  return (Object.keys(left) as (keyof Filters)[]).every(
    (key) => left[key].trim() === right[key].trim(),
  );
}

function statusTone(statusCd: number): BadgeTone {
  if (statusCd === STATUS_POSTED) return "success";
  if (statusCd === STATUS_PENDING) return "warning";
  if (statusCd === STATUS_REJECTED) return "danger";
  return "neutral";
}

function moneyAmount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return value > 0 ? value : null;
}

function cents(value: number): number {
  return Math.round(value * 100);
}

type SavingsTransactionViewProps = {
  /** Preselects this account in the form and scopes the list to it. */
  initialAccountId?: number | null;
  reportContext: SavingsTransactionReportContext;
};

export function SavingsTransactionView({
  initialAccountId = null,
  reportContext,
}: SavingsTransactionViewProps) {
  const t = useTranslations("deposits.savingsTransaction");
  const format = useFormatter();
  const labels = useSavingsTransactionLabels();
  const { money } = labels;
  const today = todayYmd();
  const [scopeAccount, setScopeAccount] = useState<DepositAccount | null>(null);
  const [scopeAccountId, setScopeAccountId] = useState<number | null>(initialAccountId);

  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [rows, setRows] = useState<SavingsTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useToastNotice();
  const showPrintError = useCallback(
    (text: string) => setNotice({ tone: "error", text }),
    [],
  );
  const print = useSavingsTransactionPrint(showPrintError);

  const [typeOptions, setTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [depositTypeOptions, setDepositTypeOptions] = useState<
    { value: string; label: string }[]
  >([]);

  const [accounts, setAccounts] = useState<SavingsCustomerAccount[]>([]);
  const [balance, setBalance] = useState<SavingsAccountBalance | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [postingVouchers, setPostingVouchers] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [transTypeCd, setTransTypeCd] = useState(String(TRANS_DEPOSIT));
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<TransMode>("CA");
  const [transDate, setTransDate] = useState(today);
  const [effectDate, setEffectDate] = useState(today);
  const [foId, setFoId] = useState("");
  const [officers, setOfficers] = useState<{ value: string; label: string }[]>([]);
  const [narration, setNarration] = useState("");
  const [remarks, setRemarks] = useState("");
  const [formError, setFormError] = useToastText();
  const [saving, setSaving] = useState(false);

  const selected = accounts.find((account) => String(account.accountId) === accountId) ?? null;
  const currentBalance = balance?.currentBalance ?? selected?.currentBalance ?? null;
  const startDate = balance?.startDate ?? null;
  const withdrawalBlocked = balance
    ? !balance.canWithdraw
    : selected != null && WITHDRAWAL_BLOCKED.has(selected.statusCd);
  const depositBlocked = balance
    ? !balance.canDeposit
    : selected != null && DEPOSIT_BLOCKED.has(selected.statusCd);

  const listQuery = useMemo(
    () => ({
      accountId: scopeAccountId ?? undefined,
      search: applied.search.trim() || undefined,
      transTypeCd: applied.transTypeCd ? Number(applied.transTypeCd) : undefined,
      transMode: applied.transMode || undefined,
      statusCd: applied.statusCd ? Number(applied.statusCd) : undefined,
      depositTypeCd: applied.depositTypeCd ? Number(applied.depositTypeCd) : undefined,
      fromDate: applied.fromDate || undefined,
      toDate: applied.toDate || undefined,
    }),
    [applied, scopeAccountId],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await fetchSavingsTransactions({ ...listQuery, page, perPage: pageSize });
      setRows(result.items ?? []);
      setTotal(result.meta?.total ?? result.items?.length ?? 0);
    } catch (error) {
      setLoadError(
        isSavingsTransactionClientError(error) ? error.message : t("table.empty"),
      );
    } finally {
      setLoading(false);
    }
  }, [listQuery, page, pageSize, t]);

  function startPrint() {
    if (print.busy) return;
    setNotice(null);
    void print.start(listQuery);
  }

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (filtersEqual(filters, applied)) return;
    const timer = window.setTimeout(() => {
      setApplied(filters);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [applied, filters]);

  useEffect(() => {
    if (initialAccountId == null) return;
    let cancelled = false;
    fetchDepositAccounts({ accountId: initialAccountId, allTypes: true, perPage: 1 })
      .then((result) => {
        const account = result.items[0];
        if (cancelled || !account) return;
        setScopeAccount(account);
        setAccounts([
          {
            accountId: account.accountId,
            fullAccountNo: account.fullAccountNo ?? "",
            applNo: account.applNo,
            holderName: account.holderName || account.primaryName,
            depositTypeCd: account.depositTypeCd,
            depositTypeDesc: account.depositTypeDesc,
            schemeCode: account.schemeCode,
            schemeName: account.schemeName,
            branchId: account.branchId,
            branchName: account.branchName,
            statusCd: account.statusCd,
            statusDesc: account.statusDesc,
            currentBalance: account.currentBalance,
            availableBalance: account.availableBalance,
          },
        ]);
        setAccountId(String(account.accountId));
      })
      .catch(() => {
        if (!cancelled) setScopeAccount(null);
      });
    return () => {
      cancelled = true;
    };
  }, [initialAccountId]);

  useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      const [types, depositTypes] = await Promise.all([
        fetchApplOptions(OPT_TRANS_TYPE).catch(() => []),
        fetchApplOptions(OPT_DEPOSIT_TYPE).catch(() => []),
      ]);
      if (cancelled) return;
      const mappedTypes = types
        .filter(
          (option) =>
            option.optCode === TRANS_DEPOSIT || option.optCode === TRANS_WITHDRAWAL,
        )
        .slice()
        .sort((a, b) => a.srlNo - b.srlNo)
        .map((option) => ({
          value: String(option.optCode),
          label: option.optDescription,
        }));
      setTypeOptions(
        mappedTypes.length > 0
          ? mappedTypes
          : [
              { value: "1", label: t("types.1") },
              { value: "2", label: t("types.2") },
            ],
      );
      setDepositTypeOptions(
        depositTypes
          .slice()
          .sort((a, b) => a.srlNo - b.srlNo)
          .map((option) => ({
            value: String(option.optCode),
            label: option.optDescription,
          })),
      );
    }
    void loadOptions();
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    if (!selected?.branchId) {
      setOfficers([]);
      return;
    }
    let cancelled = false;
    fetchStaffList({ branchId: selected.branchId, perPage: 200, status: 1 })
      .then((result) => {
        if (cancelled) return;
        setOfficers(
          result.items.map((staff) => ({
            value: String(staff.staffId),
            label: staff.employeeCode
              ? `${staff.employeeCode} · ${staff.fullName}`
              : staff.fullName,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setOfficers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selected?.accountId, selected?.branchId]);

  useEffect(() => {
    if (!accountId) {
      setBalance(null);
      return;
    }
    let cancelled = false;
    fetchSavingsAccountBalance(Number(accountId))
      .then((next) => {
        if (!cancelled) setBalance(next);
      })
      .catch((error) => {
        if (cancelled) return;
        setBalance(null);
        setFormError(
          isSavingsTransactionClientError(error) ? error.message : t("form.accountRequired"),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [accountId, t]);

  useEffect(() => {
    if (transTypeCd === String(TRANS_WITHDRAWAL) && withdrawalBlocked) {
      setTransTypeCd(depositBlocked ? "" : String(TRANS_DEPOSIT));
    }
    if (transTypeCd === String(TRANS_DEPOSIT) && depositBlocked) {
      setTransTypeCd(withdrawalBlocked ? "" : String(TRANS_WITHDRAWAL));
    }
  }, [depositBlocked, transTypeCd, withdrawalBlocked]);

  function pickAccount(account: SavingsCustomerAccount) {
    setAccounts([account]);
    setAccountId(String(account.accountId));
    setBalance(null);
    setFormError(null);
    setPickerOpen(false);
  }

  async function postVouchers() {
    if (!selected || postingVouchers) return;
    setPostingVouchers(true);
    setNotice(null);
    try {
      const message = await postMissingVouchers(selected.accountId);
      setNotice({ tone: "success", text: message });
      const next = await fetchSavingsAccountBalance(selected.accountId);
      setBalance(next);
    } catch (error) {
      setNotice({
        tone: "error",
        text: isSavingsTransactionClientError(error) ? error.message : t("form.accountRequired"),
      });
    } finally {
      setPostingVouchers(false);
    }
  }

  function validateForm(): string | null {
    if (!selected) return t("form.accountRequired");
    if (transTypeCd === String(TRANS_WITHDRAWAL) && withdrawalBlocked) {
      return t("form.withdrawalBlocked");
    }
    if (transTypeCd === String(TRANS_DEPOSIT) && depositBlocked) {
      return t("form.depositBlocked");
    }
    if (moneyAmount(amount) == null) return t("form.amountInvalid");
    if (transDate && transDate > today) return t("form.futureDate");
    if (effectDate && effectDate > today) return t("form.futureDate");
    const effectiveTrans = transDate || today;
    if (effectDate && effectDate > effectiveTrans) return t("form.effectRange");
    if (startDate && effectDate && effectDate < startDate) {
      return t("form.effectRange");
    }
    const limit =
      transTypeCd === String(TRANS_WITHDRAWAL)
        ? (balance?.withdrawableAmount ?? currentBalance)
        : balance?.depositRemaining;
    if (
      limit != null &&
      cents(moneyAmount(amount) ?? 0) > cents(limit) &&
      (transTypeCd === String(TRANS_WITHDRAWAL) || balance?.depositRemaining != null)
    ) {
      return t("form.exceedsBalance", {
        balance: format.number(limit, { style: "currency", currency: "INR" }),
      });
    }
    return null;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const error = validateForm();
    setFormError(error);
    if (error || !selected) return;
    const parsed = moneyAmount(amount);
    if (parsed == null) return;
    setSaving(true);
    setNotice(null);
    try {
      const result = await addSavingsTransaction({
        accountId: selected.accountId,
        transTypeCd: Number(transTypeCd),
        transAmount: parsed,
        transMode: mode,
        transDate: transDate || null,
        effectDate: effectDate || null,
        foId: foId ? Number(foId) : null,
        ledgerNarration: narration.trim() || null,
        remarks: remarks.trim() || null,
      });
      const pending = result.item.statusCd === STATUS_PENDING;
      setNotice({
        tone: "success",
        text: pending ? t("form.sentForApproval") : result.message,
      });
      setAmount("");
      setNarration("");
      setRemarks("");
      setTransDate(today);
      setEffectDate(today);
      setPage(1);
      const next = await fetchSavingsAccountBalance(selected.accountId).catch(() => null);
      if (next) setBalance(next);
      await load();
    } catch (caught) {
      setNotice({
        tone: "error",
        text: isSavingsTransactionClientError(caught)
          ? caught.message
          : t("form.amountInvalid"),
      });
    } finally {
      setSaving(false);
    }
  }

  const enteredAmount = moneyAmount(amount);
  const balanceAfter =
    currentBalance == null
      ? null
      : enteredAmount == null
        ? currentBalance
        : Math.round(
            (transTypeCd === String(TRANS_WITHDRAWAL)
              ? currentBalance - enteredAmount
              : currentBalance + enteredAmount) * 100,
          ) / 100;

  const columns = useMemo<DataTableColumn<SavingsTransaction>[]>(
    () => [
      {
        id: "transNo",
        header: t("table.transNo"),
        cell: (row) => row.transNo || String(row.transId),
      },
      {
        id: "member",
        header: t("table.member"),
        cell: (row) => (
          <span className="block min-w-0">
            <span className="block truncate font-medium text-slate-900">
              {row.memberName || "—"}
            </span>
            {row.memberRefCode ? (
              <span className="block truncate text-xs text-muted">{row.memberRefCode}</span>
            ) : null}
          </span>
        ),
      },
      {
        id: "account",
        header: t("table.account"),
        cell: (row) => (
          <span className="block truncate font-medium tabular-nums text-slate-900">
            {labels.account(row)}
          </span>
        ),
      },
      {
        id: "type",
        header: t("table.type"),
        cell: labels.type,
      },
      {
        id: "mode",
        header: t("table.mode"),
        cell: labels.mode,
      },
      {
        id: "amount",
        header: t("table.amount"),
        align: "end",
        cell: (row) => money(row.transAmount),
      },
      {
        id: "balance",
        header: t("table.balance"),
        align: "end",
        cell: labels.balance,
      },
      {
        id: "status",
        header: t("table.status"),
        cell: (row) => (
          <Badge tone={statusTone(row.statusCd)} caps={false}>
            {labels.status(row)}
          </Badge>
        ),
      },
      {
        id: "date",
        header: t("table.date"),
        cell: labels.date,
      },
    ],
    [labels, money, t],
  );

  const modeOptions = TRANS_MODES.map((code) => ({
    value: code,
    label: t(`modes.${code}`),
  }));
  const statusOptions = (["1", "2", "3"] as const).map((code) => ({
    value: code,
    label: t(`statuses.${code}`),
  }));

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("title")} description={t("description")} />
      <PageToast message={notice?.text ?? null} tone={notice?.tone} />
      <PageToast message={formError} tone="error" />

      <form autoComplete="off"
        className="rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]"
        onSubmit={(event) => void submit(event)}
      >
        <h2 className="mb-4 text-base font-semibold text-slate-900">{t("form.title")}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
          <div className="sm:col-span-2">
            <div className="grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <TextField
                label={t("form.accountSearch")}
                value={
                  selected
                    ? [selected.fullAccountNo || selected.applNo, selected.holderName]
                        .filter(Boolean)
                        .join(" · ")
                    : ""
                }
                required
                readOnly
                placeholder={t("form.accountEmpty")}
                inputClassName="cursor-pointer"
                onClick={() => setPickerOpen(true)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  setPickerOpen(true);
                }}
              />
              <Button
                type="button"
                variant="secondary"
                icon={Search}
                className="w-full sm:w-auto"
                onClick={() => setPickerOpen(true)}
              >
                {t("form.search")}
              </Button>
            </div>
          </div>
          {selected ? (
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-background p-3 text-sm sm:col-span-2 sm:grid-cols-4">
              <p>
                <span className="block text-muted">{t("form.applNo")}</span>
                {selected.applNo || "—"}
              </p>
              <p>
                <span className="block text-muted">{t("form.accountNo")}</span>
                {selected.fullAccountNo || "—"}
              </p>
              <p>
                <span className="block text-muted">{t("form.holder")}</span>
                {selected.holderName || "—"}
              </p>
              <p>
                <span className="block text-muted">{t("form.scheme")}</span>
                {[selected.schemeCode, selected.schemeName].filter(Boolean).join(" · ") || "—"}
              </p>
              <p>
                <span className="block text-muted">{t("form.depositType")}</span>
                {selected.depositTypeDesc || "—"}
              </p>
              <p>
                <span className="block text-muted">{t("form.accountStatus")}</span>
                {balance?.statusDesc || selected.statusDesc || "—"}
              </p>
              <p>
                <span className="block text-muted">{t("form.balance")}</span>
                {money(currentBalance)}
              </p>
              <p>
                <span className="block text-muted">{t("form.available")}</span>
                {money(balance?.availableBalance ?? selected.availableBalance)}
              </p>
              <p>
                <span className="block text-muted">{t("form.pending")}</span>
                {balance?.pendingCount ?? "—"}
              </p>
              {balance?.depositRemaining != null ? (
                <p>
                  <span className="block text-muted">{t("form.depositRemaining")}</span>
                  {money(balance.depositRemaining)}
                </p>
              ) : null}
              <p>
                <span className="block text-muted">{t("form.branch")}</span>
                {selected.branchName || "—"}
              </p>
              <p>
                <span className="block text-muted">{t("form.startDate")}</span>
                {startDate || "—"}
              </p>
              {balance && balance.vouchersMissing > 0 ? (
                <div className="col-span-2 flex flex-wrap items-center justify-between gap-2 sm:col-span-4">
                  <p className="text-sm text-muted">
                    {t("form.vouchersMissing", { count: balance.vouchersMissing })}
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={postingVouchers}
                    onClick={() => void postVouchers()}
                  >
                    {postingVouchers ? t("form.postingVouchers") : t("form.postVouchers")}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
          <SelectField
            label={t("form.type")}
            value={transTypeCd}
            required
            options={typeOptions.map((option) => ({
              ...option,
              disabled:
                (option.value === String(TRANS_WITHDRAWAL) && withdrawalBlocked) ||
                (option.value === String(TRANS_DEPOSIT) && depositBlocked),
            }))}
            onChange={setTransTypeCd}
          />
          <TextField
            key={transTypeCd}
            label={t("form.amount")}
            value={amount}
            required
            restrict="decimal"
            error={
              transTypeCd === String(TRANS_WITHDRAWAL) &&
              currentBalance != null &&
              moneyAmount(amount) != null &&
              cents(moneyAmount(amount) ?? 0) >
                cents(balance?.withdrawableAmount ?? currentBalance)
                ? t("form.exceedsBalance", {
                    balance: money(balance?.withdrawableAmount ?? currentBalance),
                  })
                : undefined
            }
            validate={(value) => {
              if (transTypeCd !== String(TRANS_WITHDRAWAL)) return undefined;
              const limit = balance?.withdrawableAmount ?? currentBalance;
              if (limit == null) return undefined;
              const entered = moneyAmount(value);
              if (entered == null) return undefined;
              if (cents(entered) <= cents(limit)) return undefined;
              return t("form.exceedsBalance", { balance: money(limit) });
            }}
            onChange={setAmount}
          />
          <TextField
            label={t("form.balanceAfter")}
            value={selected ? money(balanceAfter) : ""}
            readOnly
          />
          <SelectField
            label={t("form.mode")}
            value={mode}
            options={modeOptions}
            onChange={(value) => setMode(value as TransMode)}
          />
          <SelectField
            label={t("form.officer")}
            value={foId}
            placeholder={t("form.officerPlaceholder")}
            options={officers}
            onChange={setFoId}
          />
          <DateField
            label={t("form.transDate")}
            value={transDate}
            max={today}
            min={startDate ?? undefined}
            onChange={setTransDate}
          />
          <DateField
            label={t("form.effectDate")}
            value={effectDate}
            max={transDate || today}
            min={startDate ?? undefined}
            onChange={setEffectDate}
          />
          <TextField
            label={t("form.narration")}
            value={narration}
            onChange={(value) => setNarration(value.slice(0, 75))}
          />
          <TextField
            label={t("form.remarks")}
            value={remarks}
            onChange={(value) => setRemarks(value.slice(0, 250))}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="submit" icon={Send} loading={saving} disabled={saving || !transTypeCd}>
            {saving ? t("form.saving") : t("form.submit")}
          </Button>
        </div>
      </form>

      <AccountPickerModal
        open={pickerOpen}
        selectedAccountId={accountId ? Number(accountId) : null}
        onClose={() => setPickerOpen(false)}
        onSelect={pickAccount}
      />

      {scopeAccountId != null ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm">
          <span className="min-w-0 text-slate-700">
            {t("accountScope", {
              account: scopeAccount
                ? scopeAccount.fullAccountNo || scopeAccount.applNo
                : String(scopeAccountId),
            })}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={X}
            onClick={() => {
              setScopeAccountId(null);
              setPage(1);
            }}
          >
            {t("clearScope")}
          </Button>
        </div>
      ) : null}

      <FilterPanel
        onReset={() => {
          setFilters(emptyFilters);
          setApplied(emptyFilters);
          setPage(1);
        }}
      >
        <TextField
          label={t("filters.search")}
          value={filters.search}
          maxLength={150}
          onChange={(value) => setFilters((current) => ({ ...current, search: value }))}
          placeholder={t("filters.searchPlaceholder")}
        />
        <SelectField
          label={t("filters.type")}
          value={filters.transTypeCd}
          searchable={false}
          onChange={(value) =>
            setFilters((current) => ({ ...current, transTypeCd: value }))
          }
          options={[{ value: "", label: t("filters.all") }, ...typeOptions]}
          placeholder={t("filters.all")}
        />
        <SelectField
          label={t("filters.mode")}
          value={filters.transMode}
          searchable={false}
          onChange={(value) => setFilters((current) => ({ ...current, transMode: value }))}
          options={[{ value: "", label: t("filters.all") }, ...modeOptions]}
          placeholder={t("filters.all")}
        />
        <SelectField
          label={t("filters.status")}
          value={filters.statusCd}
          searchable={false}
          onChange={(value) => setFilters((current) => ({ ...current, statusCd: value }))}
          options={[{ value: "", label: t("filters.all") }, ...statusOptions]}
          placeholder={t("filters.all")}
        />
        <SelectField
          label={t("form.depositType")}
          value={filters.depositTypeCd}
          searchable={false}
          onChange={(value) =>
            setFilters((current) => ({ ...current, depositTypeCd: value }))
          }
          options={[{ value: "", label: t("filters.all") }, ...depositTypeOptions]}
          placeholder={t("filters.all")}
        />
        <DateField
          label={t("filters.from")}
          value={filters.fromDate}
          max={filters.toDate || today}
          onChange={(value) => setFilters((current) => ({ ...current, fromDate: value }))}
        />
        <DateField
          label={t("filters.to")}
          value={filters.toDate}
          min={filters.fromDate || undefined}
          max={today}
          onChange={(value) => setFilters((current) => ({ ...current, toDate: value }))}
        />
      </FilterPanel>

      <DataTable
        data={rows}
        columns={columns}
        getRowKey={(row) => String(row.transId)}
        title={t("table.title")}
        description={t("table.description")}
        loading={loading}
        error={loadError != null}
        errorMessage={loadError ?? undefined}
        onRetry={() => void load()}
        emptyTitle={t("table.empty")}
        minWidth="1040px"
        actions={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={Printer}
            loading={print.busy}
            disabled={print.busy || loading || total === 0}
            onClick={startPrint}
          >
            {print.busy ? t("print.preparing") : t("print.button")}
          </Button>
        }
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
          },
        }}
      />

      {print.report ? (
        <SavingsTransactionPrintReport
          report={print.report}
          context={reportContext}
          onClose={print.close}
        />
      ) : null}
    </div>
  );
}

