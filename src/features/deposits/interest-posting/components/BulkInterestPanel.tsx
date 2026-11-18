"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, CheckSquare, RotateCcw, Search, Square } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Form";
import { fetchDepositProductSchemes } from "@/features/deposits/savings/services/deposit-account-client";
import { SAVINGS_DEPOSIT_TYPE } from "@/features/deposits/savings/deposit-account.constants";
import { fetchBranchList } from "@/features/master/branch/services/branch-client";
import { initialAmounts, isPostable, parseAmount, type AmountMap } from "../interest-posting.rules";
import { fetchInterestCalculation, isInterestClientError } from "../services/interest-posting-client";
import type { InterestRow } from "../types/interest-posting.types";
import { InterestPostConfirm } from "./InterestPostConfirm";
import { InterestPostSummary, InterestRowsTable } from "./InterestRowsEditor";
import { useInterestFormat } from "./useInterestFormat";
import { useInterestPost } from "./useInterestPost";

type Filters = { schemeId: string; branchId: string; keyword: string };

const ALL = "all";
const emptyFilters: Filters = { schemeId: ALL, branchId: ALL, keyword: "" };

type Option = { value: string; label: string };

type BulkInterestPanelProps = {
  asOnDate: string;
  postingDate: string;
  canPickBranch: boolean;
};

export function BulkInterestPanel({ asOnDate, postingDate, canPickBranch }: BulkInterestPanelProps) {
  const { t, date } = useInterestFormat();
  const tCommon = useTranslations("common");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters | null>(null);
  const [schemes, setSchemes] = useState<Option[]>([]);
  const [branches, setBranches] = useState<Option[]>([]);
  const [rows, setRows] = useState<InterestRow[]>([]);
  const [total, setTotal] = useState(0);
  const [amounts, setAmounts] = useState<AmountMap>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const flow = useInterestPost("bulk", asOnDate, postingDate, () => setReloadKey((key) => key + 1));

  useEffect(() => {
    let cancelled = false;
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
    if (!applied || !asOnDate) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchInterestCalculation(
      {
        mode: "bulk",
        asOnDate,
        schemeId: applied.schemeId === ALL ? undefined : Number(applied.schemeId),
        branchId: applied.branchId === ALL ? undefined : Number(applied.branchId),
        keyword: applied.keyword.trim() || undefined,
      },
      reloadKey,
    )
      .then((result) => {
        if (cancelled) return;
        const items = result.items.filter(isPostable);
        setRows(items);
        setTotal(result.total);
        setAmounts(initialAmounts(items));
        setSelected(items.map((row) => String(row.accountId)));
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setRows([]);
        setSelected([]);
        setError(isInterestClientError(reason) ? reason.message : t("loadFailed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applied, asOnDate, reloadKey, t]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const selectedRows = useMemo(() => rows.filter((row) => selectedSet.has(String(row.accountId))), [rows, selectedSet]);
  const selectedTotal = selectedRows.reduce((sum, row) => sum + (parseAmount(amounts[row.accountId]) ?? 0), 0);
  const allSelected = rows.length > 0 && selectedRows.length === rows.length;

  function submit(event: FormEvent) {
    event.preventDefault();
    setApplied({ ...filters });
    setReloadKey((key) => key + 1);
  }

  function reset() {
    setFilters(emptyFilters);
    setApplied(null);
    setRows([]);
    setTotal(0);
    setSelected([]);
    setError(null);
    flow.setRemarks("");
  }

  return (
    <div className="flex flex-col gap-4">
      <form autoComplete="off"
        onSubmit={submit}
        className="rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5"
      >
        <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${canPickBranch ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
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
          <InterestRowsTable
            rows={rows}
            amounts={amounts}
            onAmountChange={(id, value) => setAmounts((current) => ({ ...current, [id]: value }))}
            title={t("bulk.tableTitle")}
            description={t("bulk.tableDescription", { asOn: date(asOnDate), selected: selectedRows.length, count: rows.length })}
            actions={
              rows.length > 0 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={allSelected ? Square : CheckSquare}
                  onClick={() => setSelected(allSelected ? [] : rows.map((row) => String(row.accountId)))}
                >
                  {allSelected ? t("bulk.clearSelection") : t("bulk.selectAll", { count: rows.length })}
                </Button>
              ) : null
            }
            loading={loading}
            error={error}
            onRetry={() => setReloadKey((key) => key + 1)}
            emptyTitle={t("bulk.emptyTitle")}
            emptyMessage={t("bulk.emptyMessage", { asOn: date(asOnDate) })}
            selection={{ selectedKeys: selected, onSelectionChange: setSelected }}
            paginate
          />
          {rows.length > 0 ? (
            <InterestPostSummary
              rows={selectedRows}
              amounts={amounts}
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

      <InterestPostConfirm
        open={flow.confirmOpen}
        count={selectedRows.length}
        total={selectedTotal}
        asOnDate={asOnDate}
        postingDate={postingDate}
        onClose={() => flow.setConfirmOpen(false)}
        onConfirm={() => flow.post(selectedRows, amounts)}
      />
    </div>
  );
}
