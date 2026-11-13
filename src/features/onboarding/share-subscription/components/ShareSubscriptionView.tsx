"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Eye, Pencil, Search, Send, ShieldCheck, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/PageHeader";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Alert } from "@/components/ui/Alert";
import { PageToast, useToastNotice, useToastText } from "@/components/ui/PageToast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DateField, SelectField, TextField } from "@/components/ui/Form";
import { Modal } from "@/components/ui/Modal";
import { fetchApplOptions } from "@/features/master/appl-options";
import { todayYmd } from "@/features/deposits/savings/deposit-account.rules";
import { SubscriberPickerModal, type Subscriber } from "./SubscriberPickerModal";
import { ShareSubscriptionEditModal } from "./ShareSubscriptionEditModal";
import { ShareSubscriptionDetailModal } from "./ShareSubscriptionDetailModal";
import { cents, moneyAmount, statusTone, wholeNumber } from "../share-subscription.utils";
import {
  CUST_TYPE_GROUP,
  CUST_TYPE_INDIVIDUAL,
  CUST_TYPES,
  OPT_CUST_TYPE,
  OPT_PAYMENT_MODE,
  PAYMENT_MODE_CASH,
  PAYMENT_MODES,
  STATUS_CODES,
  STATUS_ENTERED,
} from "../share-subscription.constants";
import {
  addShareSubscription,
  approveShareSubscription,
  fetchShareHolding,
  fetchShareSubscriptions,
  isShareSubscriptionClientError,
} from "../services/share-subscription-client";
import type { ShareHolding, ShareSubscription } from "../types/share-subscription.types";

type Filters = {
  search: string;
  custTypeCd: string;
  statusCd: string;
  fromDate: string;
  toDate: string;
};

const emptyFilters: Filters = {
  search: "",
  custTypeCd: "",
  statusCd: "",
  fromDate: "",
  toDate: "",
};

type Option = { value: string; label: string };

export function ShareSubscriptionView() {
  const t = useTranslations("onboarding.shareSubscription");
  const format = useFormatter();
  const today = todayYmd();

  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [rows, setRows] = useState<ShareSubscription[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useToastNotice();

  const [custTypeOptions, setCustTypeOptions] = useState<Option[]>([]);
  const [paymentModeOptions, setPaymentModeOptions] = useState<Option[]>([]);

  const [custTypeCd, setCustTypeCd] = useState(String(CUST_TYPE_INDIVIDUAL));
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [holding, setHolding] = useState<ShareHolding | null>(null);
  const [holdingLoading, setHoldingLoading] = useState(false);
  const [holdingError, setHoldingError] = useState<string | null>(null);
  const [subscriptionDate, setSubscriptionDate] = useState(today);
  const [shares, setShares] = useState("");
  const [paid, setPaid] = useState("");
  const [paidTouched, setPaidTouched] = useState(false);
  const [paymentModeCd, setPaymentModeCd] = useState(String(PAYMENT_MODE_CASH));
  const [refNo, setRefNo] = useState("");
  const [remarks, setRemarks] = useState("");
  const [formError, setFormError] = useToastText();
  const [saving, setSaving] = useState(false);

  const [decision, setDecision] = useState<{
    row: ShareSubscription;
    approve: boolean;
  } | null>(null);
  const [decisionRemarks, setDecisionRemarks] = useState("");
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [deciding, setDeciding] = useState(false);
  const [editing, setEditing] = useState<ShareSubscription | null>(null);
  const [viewing, setViewing] = useState<ShareSubscription | null>(null);

  const selected = subscribers.find((item) => String(item.id) === customerId) ?? null;
  const shareCount = wholeNumber(shares);
  const subscriptionAmount =
    holding && shareCount != null ? cents(shareCount * holding.faceValue) / 100 : null;
  const paidValue = paidTouched ? moneyAmount(paid) : subscriptionAmount;
  const outstanding =
    subscriptionAmount != null && paidValue != null
      ? cents(subscriptionAmount - paidValue) / 100
      : null;

  const money = useCallback(
    (value: number | null) =>
      value == null ? "—" : format.number(value, { style: "currency", currency: "INR" }),
    [format],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await fetchShareSubscriptions({
        page,
        perPage: pageSize,
        search: applied.search || undefined,
        custTypeCd: applied.custTypeCd ? Number(applied.custTypeCd) : undefined,
        statusCd: applied.statusCd ? Number(applied.statusCd) : undefined,
        fromDate: applied.fromDate || undefined,
        toDate: applied.toDate || undefined,
      });
      setRows(result.items ?? []);
      setTotal(result.meta?.total ?? result.items?.length ?? 0);
    } catch (error) {
      setLoadError(
        isShareSubscriptionClientError(error) ? error.message : t("table.loadError"),
      );
    } finally {
      setLoading(false);
    }
  }, [applied, page, pageSize, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      const [custTypes, paymentModes] = await Promise.all([
        fetchApplOptions(OPT_CUST_TYPE).catch(() => []),
        fetchApplOptions(OPT_PAYMENT_MODE).catch(() => []),
      ]);
      if (cancelled) return;
      const custTypeCodes = new Set<number>(CUST_TYPES);
      const mappedCustTypes = custTypes
        .filter((option) => custTypeCodes.has(option.optCode))
        .sort((a, b) => a.srlNo - b.srlNo)
        .map((option) => ({ value: String(option.optCode), label: option.optDescription }));
      setCustTypeOptions(
        mappedCustTypes.length > 0
          ? mappedCustTypes
          : CUST_TYPES.map((code) => ({ value: String(code), label: t(`custTypes.${code}`) })),
      );
      const modeCodes = new Set<number>(PAYMENT_MODES);
      const mappedModes = paymentModes
        .filter((option) => modeCodes.has(option.optCode))
        .sort((a, b) => a.srlNo - b.srlNo)
        .map((option) => ({ value: String(option.optCode), label: option.optDescription }));
      setPaymentModeOptions(
        mappedModes.length > 0
          ? mappedModes
          : PAYMENT_MODES.map((code) => ({
              value: String(code),
              label: t(`paymentModes.${code}`),
            })),
      );
    }
    void loadOptions();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const loadHolding = useCallback(
    async (typeCd: number, id: number) => {
      setHoldingLoading(true);
      setHoldingError(null);
      try {
        setHolding(await fetchShareHolding({ custTypeCd: typeCd, customerId: id }));
      } catch (error) {
        setHolding(null);
        setHoldingError(
          isShareSubscriptionClientError(error) ? error.message : t("form.holdingError"),
        );
      } finally {
        setHoldingLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    if (!customerId) {
      setHolding(null);
      setHoldingError(null);
      return;
    }
    void loadHolding(Number(custTypeCd), Number(customerId));
  }, [custTypeCd, customerId, loadHolding]);

  function resetSubscriber() {
    setSubscribers([]);
    setCustomerId("");
    setFormError(null);
  }

  function pickSubscriber(item: Subscriber) {
    setSubscribers([item]);
    setCustomerId(String(item.id));
    setPaidTouched(false);
    setPaid("");
    setFormError(null);
    setPickerOpen(false);
  }

  function sharesError(value: string): string | undefined {
    if (!value.trim()) return undefined;
    const count = wholeNumber(value);
    if (count == null) return t("form.errors.sharesInvalid");
    if (holding?.minShares != null && count < holding.minShares) {
      return t("form.errors.sharesBelowMin", { min: holding.minShares });
    }
    if (
      holding?.maxShares != null &&
      holding.totalShares + holding.pendingShares + count > holding.maxShares
    ) {
      return t("form.errors.sharesAboveMax", {
        max: holding.maxShares,
        available: Math.max(
          0,
          holding.maxShares - holding.totalShares - holding.pendingShares,
        ),
      });
    }
    return undefined;
  }

  function paidError(): string | undefined {
    if (!paidTouched || subscriptionAmount == null) return undefined;
    const value = moneyAmount(paid);
    if (value == null) return t("form.errors.paidInvalid");
    if (cents(value) > cents(subscriptionAmount)) {
      return t("form.errors.paidExceeds", { amount: money(subscriptionAmount) });
    }
    return undefined;
  }

  function validateForm(): string | null {
    if (!selected) return t("form.errors.subscriberRequired");
    if (!holding) return t("form.errors.holdingRequired");
    if (!subscriptionDate) return t("form.errors.dateRequired");
    if (subscriptionDate > today) return t("form.errors.futureDate");
    if (shareCount == null) return t("form.errors.sharesInvalid");
    const shareMessage = sharesError(shares);
    if (shareMessage) return shareMessage;
    const paidMessage = paidError();
    if (paidMessage) return paidMessage;
    if (paidValue == null) return t("form.errors.paidInvalid");
    if (Number(paymentModeCd) !== PAYMENT_MODE_CASH && !refNo.trim()) {
      return t("form.errors.refRequired");
    }
    return null;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const error = validateForm();
    setFormError(error);
    if (error || !selected || shareCount == null || paidValue == null) return;
    setSaving(true);
    setNotice(null);
    try {
      const result = await addShareSubscription({
        custTypeCd: Number(custTypeCd),
        customerId: selected.id,
        subscriptionDate,
        noOfShares: shareCount,
        paidAmount: paidValue,
        paymentModeCd: Number(paymentModeCd),
        transRefNo: refNo.trim() || null,
        remarks: remarks.trim() || null,
      });
      setNotice({
        tone: "success",
        text:
          result.item.statusCd === STATUS_ENTERED
            ? t("form.sentForApproval")
            : result.message || t("form.saved"),
      });
      setShares("");
      setPaid("");
      setPaidTouched(false);
      setRefNo("");
      setRemarks("");
      setSubscriptionDate(today);
      setPage(1);
      await Promise.all([load(), loadHolding(Number(custTypeCd), selected.id)]);
    } catch (caught) {
      setNotice({
        tone: "error",
        text: isShareSubscriptionClientError(caught)
          ? caught.message
          : t("form.errors.saveFailed"),
      });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDecision() {
    if (!decision) return;
    if (!decision.approve && !decisionRemarks.trim()) {
      setDecisionError(t("approval.remarksRequired"));
      return;
    }
    setDeciding(true);
    setDecisionError(null);
    try {
      const result = await approveShareSubscription({
        subscriptionId: decision.row.subscriptionId,
        approve: decision.approve,
        remarks: decisionRemarks.trim() || null,
      });
      setNotice({ tone: "success", text: result.message });
      setDecision(null);
      setDecisionRemarks("");
      await load();
      if (
        holding &&
        holding.customerId === decision.row.customerId &&
        holding.custTypeCd === decision.row.custTypeCd
      ) {
        await loadHolding(holding.custTypeCd, holding.customerId);
      }
    } catch (caught) {
      setDecisionError(
        isShareSubscriptionClientError(caught)
          ? caught.message
          : t("approval.failed"),
      );
    } finally {
      setDeciding(false);
    }
  }

  async function afterEdit(message: string) {
    const row = editing;
    setEditing(null);
    setNotice({ tone: "success", text: message });
    await load();
    if (
      row &&
      holding &&
      holding.customerId === row.customerId &&
      holding.custTypeCd === row.custTypeCd
    ) {
      await loadHolding(holding.custTypeCd, holding.customerId);
    }
  }

  const statusLabel = useCallback(
    (row: ShareSubscription) =>
      row.statusDesc ||
      ((STATUS_CODES as readonly number[]).includes(row.statusCd)
        ? t(`statuses.${row.statusCd as (typeof STATUS_CODES)[number]}`)
        : "—"),
    [t],
  );

  const typeLabel = useCallback(
    (row: ShareSubscription) =>
      row.custTypeDesc ||
      (row.custTypeCd === CUST_TYPE_GROUP ? t("custTypes.1") : t("custTypes.2")),
    [t],
  );

  const modeLabel = useCallback(
    (row: ShareSubscription) =>
      row.paymentModeDesc ||
      ((PAYMENT_MODES as readonly number[]).includes(row.paymentModeCd ?? 0)
        ? t(`paymentModes.${row.paymentModeCd as (typeof PAYMENT_MODES)[number]}`)
        : "—"),
    [t],
  );

  const columns = useMemo<DataTableColumn<ShareSubscription>[]>(
    () => [
      {
        id: "subscriptionNo",
        header: t("table.subscriptionNo"),
        cell: (row) => row.subscriptionNo || String(row.subscriptionId),
      },
      {
        id: "subscriber",
        header: t("table.subscriber"),
        cell: (row) => (
          <span className="block min-w-0">
            <span className="block truncate font-medium text-slate-900">
              {row.customerName || "—"}
            </span>
            <span className="block truncate text-xs text-muted">
              {[row.customerCode, typeLabel(row)].filter(Boolean).join(" · ")}
            </span>
          </span>
        ),
      },
      {
        id: "date",
        header: t("table.date"),
        cell: (row) => row.subscriptionDate || "—",
      },
      {
        id: "shares",
        header: t("table.shares"),
        align: "end",
        cell: (row) => (
          <span className="block">
            <span className="block">{format.number(row.noOfShares)}</span>
            <span className="block text-xs text-muted">
              {t("table.atFaceValue", { value: money(row.faceValue) })}
            </span>
          </span>
        ),
      },
      {
        id: "amount",
        header: t("table.amount"),
        align: "end",
        cell: (row) => money(row.subscriptionAmount),
      },
      {
        id: "paid",
        header: t("table.paid"),
        align: "end",
        cell: (row) => money(row.paidAmount),
      },
      {
        id: "outstanding",
        header: t("table.outstanding"),
        align: "end",
        cell: (row) => money(row.outstandingAmount),
      },
      {
        id: "mode",
        header: t("table.mode"),
        cell: (row) => modeLabel(row),
      },
      {
        id: "status",
        header: t("table.status"),
        cell: (row) => (
          <Badge tone={statusTone(row.statusCd)} caps={false}>
            {statusLabel(row)}
          </Badge>
        ),
      },
    ],
    [format, modeLabel, money, statusLabel, t, typeLabel],
  );

  const statusOptions = STATUS_CODES.map((code) => ({
    value: String(code),
    label: t(`statuses.${code}`),
  }));
  const isCash = Number(paymentModeCd) === PAYMENT_MODE_CASH;
  const sharesHint =
    holding?.minShares != null || holding?.maxShares != null
      ? t("form.sharesHint", {
          min: holding?.minShares ?? 1,
          max: holding?.maxShares ?? "—",
        })
      : undefined;

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
          <SelectField
            label={t("form.custType")}
            value={custTypeCd}
            required
            options={custTypeOptions}
            onChange={(value) => {
              setCustTypeCd(value);
              resetSubscriber();
            }}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end lg:col-span-2">
            <div className="min-w-0 flex-1">
              <TextField
                label={t("form.subscriber")}
                value={selected ? [selected.code, selected.name, selected.detail].filter(Boolean).join(" · ") : ""}
                required
                readOnly
                placeholder={t("form.subscriberEmpty")}
                inputClassName="cursor-pointer"
                onClick={() => setPickerOpen(true)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  setPickerOpen(true);
                }}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              icon={Search}
              className="w-full sm:w-auto"
              disabled={!custTypeCd}
              onClick={() => setPickerOpen(true)}
            >
              {t("form.searchButton")}
            </Button>
          </div>

          {selected ? (
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-background p-3 text-sm sm:col-span-2 sm:grid-cols-4 lg:col-span-3">
              <p>
                <span className="block text-muted">{t("form.code")}</span>
                {selected.code || "—"}
              </p>
              <p>
                <span className="block text-muted">{t("form.name")}</span>
                {selected.name || "—"}
              </p>
              <p>
                <span className="block text-muted">{t("form.branch")}</span>
                {selected.branchName || "—"}
              </p>
              <p>
                <span className="block text-muted">{t("form.faceValue")}</span>
                {holdingLoading ? t("form.holdingLoading") : money(holding?.faceValue ?? null)}
              </p>
              <p>
                <span className="block text-muted">{t("form.holdingShares")}</span>
                {holding ? format.number(holding.totalShares) : "—"}
              </p>
              <p>
                <span className="block text-muted">{t("form.holdingAmount")}</span>
                {money(holding?.totalAmount ?? null)}
              </p>
              <p>
                <span className="block text-muted">{t("form.holdingOutstanding")}</span>
                {money(holding ? Math.max(0, (cents(holding.totalAmount) - cents(holding.paidAmount)) / 100) : null)}
              </p>
              <p>
                <span className="block text-muted">{t("form.pendingShares")}</span>
                {holding ? format.number(holding.pendingShares) : "—"}
              </p>
              {holdingError ? (
                <Alert tone="error" className="col-span-2 sm:col-span-4">
                  {holdingError}
                </Alert>
              ) : null}
            </div>
          ) : null}

          <DateField
            label={t("form.date")}
            value={subscriptionDate}
            required
            max={today}
            onChange={setSubscriptionDate}
          />
          <TextField
            label={t("form.shares")}
            value={shares}
            required
            restrict="digits"
            inputMode="numeric"
            hint={sharesHint}
            disabled={!holding}
            validate={(value) => sharesError(value)}
            onChange={setShares}
          />
          <TextField
            label={t("form.amount")}
            value={subscriptionAmount == null ? "" : money(subscriptionAmount)}
            readOnly
          />
          <TextField
            label={t("form.paid")}
            value={paidTouched ? paid : subscriptionAmount == null ? "" : String(subscriptionAmount)}
            required
            restrict="decimal"
            inputMode="decimal"
            disabled={subscriptionAmount == null}
            error={paidError()}
            onChange={(value) => {
              setPaidTouched(true);
              setPaid(value);
            }}
          />
          <TextField
            label={t("form.outstanding")}
            value={outstanding == null ? "" : money(outstanding)}
            readOnly
          />
          <SelectField
            label={t("form.paymentMode")}
            value={paymentModeCd}
            required
            options={paymentModeOptions}
            onChange={setPaymentModeCd}
          />
          <TextField
            label={t("form.refNo")}
            value={refNo}
            required={!isCash}
            maxLength={25}
            onChange={(value) => setRefNo(value.slice(0, 25))}
          />
          <div className="sm:col-span-2">
            <TextField
              label={t("form.remarks")}
              value={remarks}
              maxLength={250}
              onChange={(value) => setRemarks(value.slice(0, 250))}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="submit" icon={Send} loading={saving} disabled={saving || !holding}>
            {saving ? t("form.saving") : t("form.submit")}
          </Button>
        </div>
      </form>

      <SubscriberPickerModal
        open={pickerOpen}
        custTypeCd={Number(custTypeCd)}
        selectedId={customerId ? Number(customerId) : null}
        onClose={() => setPickerOpen(false)}
        onSelect={pickSubscriber}
      />

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
          onChange={(value) => setFilters((current) => ({ ...current, search: value }))}
          placeholder={t("filters.searchPlaceholder")}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            setApplied(filters);
            setPage(1);
          }}
        />
        <SelectField
          label={t("filters.type")}
          value={filters.custTypeCd}
          onChange={(value) => setFilters((current) => ({ ...current, custTypeCd: value }))}
          options={custTypeOptions}
          placeholder={t("filters.all")}
        />
        <SelectField
          label={t("filters.status")}
          value={filters.statusCd}
          onChange={(value) => setFilters((current) => ({ ...current, statusCd: value }))}
          options={statusOptions}
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
        <Button
          type="button"
          icon={Search}
          onClick={() => {
            setApplied(filters);
            setPage(1);
          }}
        >
          {t("filters.apply")}
        </Button>
      </FilterPanel>

      <DataTable
        data={rows}
        columns={columns}
        getRowKey={(row) => String(row.subscriptionId)}
        loading={loading}
        error={loadError != null}
        errorMessage={loadError ?? undefined}
        onRetry={() => void load()}
        emptyTitle={t("table.empty")}
        minWidth="1040px"
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
        rowActions={{
          header: t("table.actions"),
          render: (row) => (
            <div className="inline-flex items-center justify-end gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                icon={Eye}
                tooltip={t("table.view")}
                onClick={() => setViewing(row)}
              />
              {row.statusCd === STATUS_ENTERED ? (
                <>
                <Button
                  type="button"
                  size="sm"
                  variant="success"
                  icon={ShieldCheck}
                  tooltip={t("table.verify")}
                  onClick={() => {
                    setDecision({ row, approve: true });
                    setDecisionRemarks("");
                    setDecisionError(null);
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={Pencil}
                  tooltip={t("table.edit")}
                  onClick={() => setEditing(row)}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  icon={X}
                  tooltip={t("table.reject")}
                  onClick={() => {
                    setDecision({ row, approve: false });
                    setDecisionRemarks("");
                    setDecisionError(null);
                  }}
                />
                </>
              ) : null}
            </div>
          ),
        }}
      />

      <ShareSubscriptionDetailModal
        row={viewing}
        statusLabel={statusLabel}
        modeLabel={modeLabel}
        typeLabel={typeLabel}
        onClose={() => setViewing(null)}
      />

      <ShareSubscriptionEditModal
        row={editing}
        today={today}
        paymentModeOptions={paymentModeOptions}
        onClose={() => setEditing(null)}
        onSaved={(message) => void afterEdit(message)}
      />

      <Modal
        open={decision != null}
        size="sm"
        title={decision?.approve ? t("approval.verifyTitle") : t("approval.rejectTitle")}
        onClose={() => {
          if (deciding) return;
          setDecision(null);
        }}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              disabled={deciding}
              onClick={() => setDecision(null)}
            >
              {t("approval.cancel")}
            </Button>
            <Button
              type="button"
              variant={decision?.approve ? "success" : "danger"}
              icon={decision?.approve ? ShieldCheck : X}
              loading={deciding}
              onClick={() => void confirmDecision()}
            >
              {decision?.approve ? t("approval.confirmVerify") : t("approval.confirmReject")}
            </Button>
          </div>
        }
      >
        {decision ? (
          <p className="mb-3 text-sm text-slate-700">
            {t("approval.summary", {
              shares: format.number(decision.row.noOfShares),
              name: decision.row.customerName || decision.row.customerCode,
              amount: money(decision.row.subscriptionAmount),
            })}
          </p>
        ) : null}
        <TextField
          label={t("approval.remarks")}
          value={decisionRemarks}
          required={decision?.approve === false}
          error={decisionError ?? undefined}
          onChange={(value) => setDecisionRemarks(value.slice(0, 200))}
        />
      </Modal>
    </div>
  );
}
