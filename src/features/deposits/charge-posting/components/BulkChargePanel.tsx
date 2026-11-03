"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, CheckSquare, RotateCcw, Search, Square } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Form";
import { fetchDepositProductSchemes } from "@/features/deposits/savings/services/deposit-account-client";
import { SAVINGS_DEPOSIT_TYPE } from "@/features/deposits/savings/deposit-account.constants";
import { fetchBranchList } from "@/features/master/branch/services/branch-client";
import { fetchChargeSetups } from "@/features/master/charges-setup/services/charges-setup-client";
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

type Filters = { chargeId: string; schemeId: string; branchId: string; keyword: string };

const ALL = "all";
const emptyFilters: Filters = { chargeId: "", schemeId: ALL, branchId: ALL, keyword: "" };

type Option = { value: string; label: string };

type BulkChargePanelProps = {
  chargeDate: string;
  canPickBranch: boolean;
};

export function BulkChargePanel({ chargeDate, canPickBranch }: BulkChargePanelProps) {
  const { t, date } = useChargeFormat();
  const tCommon = useTranslations("common");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters | null>(null);
  const [chargeMissing, setChargeMissing] = useState(false);
  const [charges, setCharges] = useState<Option[]>([]);
  const [schemes, setSchemes] = useState<Option[]>([]);
  const [branches, setBranches] = useState<Option[]>([]);
  const [rows, setRows] = useState<ChargeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [amounts, setAmounts] = useState<ChargeAmountMap>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const flow = useChargePost("bulk", chargeDate, () => setReloadKey((key) => key + 1));

  useEffect(() => {
    let cancelled = false;
    fetchChargeSetups("deposit", { page: 1, perPage: 200, isActive: 1 })
      .then((result) => {
        if (!cancelled) {
          setCharges(result.items.map((charge) => ({ value: String(charge.chargeId), label: charge.chargeName })));
        }
      })
      .catch(() => {
        if (!cancelled) setCharges([]);
      });
    fetchDepositProductSchemes(SAVINGS_DEPOSIT_TYPE)
      .then((groups) => {
        if (cancelled) return;
        setSchemes(
          groups.flatMap((group) =>
            group.schemes.map((scheme) => ({
              value: String(scheme.schemeId),
              label: scheme.schemeCode ? `${scheme.schemeCode} · ${scheme.schemeName}` : scheme.schemeName,
            })),
          ),
        );
      })
      .catch(() => {
        if (!cancelled) setSchemes([]);
      });
    if (canPickBranch) {
      fetchBranchList({ page: 1, perPage: 200, isActive: 1 })
        .then((result) => {
          if (!cancelled) {
            setBranches(result.items.map((branch) => ({ value: String(branch.branchId), label: branch.branchName })));
          }
        })
        .catch(() => {
          if (!cancelled) setBranches([]);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [canPickBranch]);

  useEffect(() => {
    if (!applied || !chargeDate) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchChargeCalculation(
      {
        mode: "bulk",
        chargeDate,
        chargeId: Number(applied.chargeId),
        schemeId: applied.schemeId === ALL ? undefined : Number(applied.schemeId),
        branchId: applied.branchId === ALL ? undefined : Number(applied.branchId),
        keyword: applied.keyword.trim() || undefined,
      },
      reloadKey,
    )
      .then((result) => {
        if (cancelled) return;
        const nextAmounts = initialChargeAmounts(result.items);
        const short = shortAccounts(result.items, nextAmounts);
        setRows(result.items);
        setTotal(result.total);
        setAmounts(nextAmounts);
        setSelected(
          result.items.filter((row) => isDefaultSelected(row) && !short.has(row.accountId)).map((row) => row.rowKey),
        );
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
  }, [applied, chargeDate, reloadKey, t]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const selectedRows = useMemo(() => rows.filter((row) => selectedSet.has(row.rowKey)), [rows, selectedSet]);
  const short = useMemo(() => shortAccounts(selectedRows, amounts), [amounts, selectedRows]);
  const allSelected = rows.length > 0 && selectedRows.length === rows.length;
  const chargeName = charges.find((option) => option.value === applied?.chargeId)?.label ?? t("dash");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!filters.chargeId) {
      setChargeMissing(true);
      return;
    }
    setChargeMissing(false);
    setApplied({ ...filters });
    setReloadKey((key) => key + 1);
  }

  function reset() {
    setFilters(emptyFilters);
    setApplied(null);
    setChargeMissing(false);
    setRows([]);
    setTotal(0);
    setSelected([]);
    setError(null);
    flow.setRemarks("");
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={submit}
        noValidate
        className="rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5"
      >
        <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${canPickBranch ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}>
          <SelectField
            label={t("bulk.charge")}
            value={filters.chargeId}
            onChange={(value) => {
              setFilters((current) => ({ ...current, chargeId: value }));
              if (value) setChargeMissing(false);
            }}
            options={charges}
            placeholder={t("bulk.chargePlaceholder")}
            required
            error={chargeMissing ? t("bulk.chargeRequired") : undefined}
            searchable
          />
          <SelectField
            label={t("bulk.scheme")}
            value={filters.schemeId}
            onChange={(value) => setFilters((current) => ({ ...current, schemeId: value }))}
            options={[{ value: ALL, label: t("bulk.allSchemes") }, ...schemes]}
            searchable
          />
          {canPickBranch ? (
            <SelectField
              label={t("bulk.branch")}
              value={filters.branchId}
              onChange={(value) => setFilters((current) => ({ ...current, branchId: value }))}
              options={[{ value: ALL, label: t("bulk.allBranches") }, ...branches]}
              searchable
            />
          ) : null}
          <TextField
            label={t("bulk.keyword")}
            value={filters.keyword}
            onChange={(value) => setFilters((current) => ({ ...current, keyword: value }))}
            placeholder={t("bulk.keywordPlaceholder")}
            maxLength={60}
          />
          <div className="flex items-end gap-2">
            <Button type="submit" icon={Search} loading={loading} className="flex-1">
              {t("bulk.load")}
            </Button>
            <Button type="button" variant="secondary" icon={RotateCcw} onClick={reset} className="flex-1">
              {tCommon("reset")}
            </Button>
          </div>
        </div>
      </form>

      {applied ? (
        <>
          {total > rows.length && !loading && !error ? (
            <p className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {t("bulk.capped", { shown: rows.length, total })}
            </p>
          ) : null}
          <ChargeRowsTable
            rows={rows}
            amounts={amounts}
            onAmountChange={(key, value) => setAmounts((current) => ({ ...current, [key]: value }))}
            selectedKeys={selected}
            onSelectionChange={setSelected}
            shortAccountIds={short}
            showAccount
            title={t("bulk.tableTitle")}
            description={t("bulk.tableDescription", {
              charge: chargeName,
              date: date(chargeDate),
              selected: selectedRows.length,
              count: rows.length,
            })}
            actions={
              rows.length > 0 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={allSelected ? Square : CheckSquare}
                  onClick={() => setSelected(allSelected ? [] : rows.map((row) => row.rowKey))}
                >
                  {allSelected ? t("bulk.clearSelection") : t("bulk.selectAll", { count: rows.length })}
                </Button>
              ) : null
            }
            loading={loading}
            error={error}
            onRetry={() => setReloadKey((key) => key + 1)}
            emptyTitle={t("bulk.emptyTitle")}
            emptyMessage={t("bulk.emptyMessage")}
            paginate
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
      ) : (
        <section className="rounded-[var(--radius-card)] border border-dashed border-border bg-surface px-4 py-10 text-center">
          <p className="text-sm font-semibold text-foreground">{t("bulk.idleTitle")}</p>
          <p className="mt-1 text-sm text-muted">{t("bulk.idleMessage")}</p>
        </section>
      )}

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
