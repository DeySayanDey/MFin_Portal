"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { useRouter } from "@/i18n/navigation";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { DepositAccountFilters } from "@/features/deposits/savings/components/DepositAccountFilters";
import { DepositAccountTable } from "@/features/deposits/savings/components/DepositAccountTable";
import { DepositAccountViewModal } from "@/features/deposits/savings/components/DepositAccountViewModal";
import { useDepositAccountActions } from "@/features/deposits/savings/components/useDepositAccountActions";
import { SAVINGS_DEPOSIT_TYPE } from "@/features/deposits/savings/deposit-account.constants";
import { depositAccountHref } from "@/features/deposits/savings/deposit-account.rules";
import {
  DEFAULT_SAVINGS_FILTERS,
  savingsFiltersEqual,
  savingsFiltersFromQuery,
  writeSavingsFilters,
  type SavingsAccountFilters,
} from "@/features/deposits/savings/savings-filters";
import {
  fetchDepositAccounts,
  isDepositAccountClientError,
} from "@/features/deposits/savings/services/deposit-account-client";
import type {
  DepositAccount,
  PaginationMeta,
} from "@/features/deposits/savings/types/deposit-account.types";

const SEARCH_DEBOUNCE_MS = 350;

type DepositsSavingsViewProps = {
  isHead: boolean;
  branchId: number | null;
  branchName: string;
  initialFilters?: SavingsAccountFilters;
  initialPage?: number;
  initialAccountId?: number | null;
  initialNotice?: { message: string; tone: "success" | "error" } | null;
  depositTypeCd?: number;
  variant?: "savings" | "term";
};

function optionalNumber(value: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function DepositsSavingsView({
  isHead,
  branchId,
  branchName,
  initialFilters = DEFAULT_SAVINGS_FILTERS,
  initialPage = 1,
  initialAccountId = null,
  initialNotice = null,
  depositTypeCd = SAVINGS_DEPOSIT_TYPE,
  variant = "savings",
}: DepositsSavingsViewProps) {
  const t = useTranslations("deposits.savings");
  const tTerm = useTranslations("deposits.term");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const isTerm = variant === "term";
  const startingFilters: SavingsAccountFilters = {
    ...initialFilters,
    branchId:
      !isHead && branchId != null ? String(branchId) : initialFilters.branchId,
  };
  const [filters, setFilters] = useState<SavingsAccountFilters>(startingFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<SavingsAccountFilters>(startingFilters);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(50);
  const [items, setItems] = useState<DepositAccount[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);
  const [viewingId, setViewingId] = useState<number | null>(
    isTerm ? initialAccountId : null,
  );
  const [viewing, setViewing] = useState<DepositAccount | null>(null);
  const [successMessage, setSuccessMessage] = useToastText();
  const [actionError, setActionError] = useToastText();

  const actions = useDepositAccountActions({
    onChanged: (message) => {
      setSuccessMessage(message);
      setReloadKey((key) => key + 1);
    },
    onActionError: (message) => {
      setActionError(message);
      setReloadKey((key) => key + 1);
    },
  });

  const scopedBranchId =
    !isHead && branchId != null ? String(branchId) : appliedFilters.branchId;

  useEffect(() => {
    if (savingsFiltersEqual(filters, appliedFilters)) return;
    const timer = window.setTimeout(() => {
      setPage(1);
      setAppliedFilters(filters);
      setSuccessMessage(null);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [appliedFilters, filters, setSuccessMessage]);

  useEffect(() => {
    writeSavingsFilters(appliedFilters, page, viewingId);
  }, [appliedFilters, page, viewingId]);

  useEffect(() => {
    if (!initialNotice) return;
    if (initialNotice.tone === "error") setActionError(initialNotice.message);
    else setSuccessMessage(initialNotice.message);
    const url = new URL(window.location.href);
    url.searchParams.delete("created");
    url.searchParams.delete("createdTone");
    url.searchParams.delete("updated");
    window.history.replaceState(null, "", url.toString());
  }, [initialNotice, setActionError, setSuccessMessage]);

  useEffect(() => {
    function onPopState() {
      const params = new URLSearchParams(window.location.search);
      const source = Object.fromEntries(params.entries());
      setFilters(savingsFiltersFromQuery(source));
      setAppliedFilters(savingsFiltersFromQuery(source));
      const nextPage = Number(params.get("page") || "1");
      setPage(Number.isFinite(nextPage) && nextPage > 0 ? nextPage : 1);
      if (isTerm) {
        const accountParam = params.get("account_id");
        setViewingId(accountParam ? Number(accountParam) : null);
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [isTerm]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(false);
      setErrorMessage(undefined);
      try {
        const result = await fetchDepositAccounts({
          page,
          perPage: pageSize,
          depositTypeCd,
          search: appliedFilters.search.trim() || undefined,
          branchId: optionalNumber(scopedBranchId),
          prodTypeCd: optionalNumber(appliedFilters.prodTypeCd),
          schemeId: optionalNumber(appliedFilters.schemeId),
          custTypeCd: optionalNumber(appliedFilters.custTypeCd),
          statusCd: optionalNumber(appliedFilters.statusCd),
          isClosed:
            appliedFilters.isClosed === ""
              ? undefined
              : appliedFilters.isClosed === "1",
          fromDate: appliedFilters.fromDate || undefined,
          toDate: appliedFilters.toDate || undefined,
          memberId: optionalNumber(appliedFilters.memberId),
          groupId: optionalNumber(appliedFilters.groupId),
        });
        if (cancelled) return;
        setItems(result.items);
        setMeta(result.meta);
      } catch (err) {
        if (cancelled) return;
        setError(true);
        setErrorMessage(
          isDepositAccountClientError(err) ? err.message : tErrors("generic"),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [appliedFilters, depositTypeCd, page, pageSize, reloadKey, scopedBranchId, tErrors]);

  useEffect(() => {
    if (viewingId == null) {
      setViewing(null);
      return;
    }
    const listed = items.find((item) => item.accountId === viewingId);
    if (listed) {
      setViewing(listed);
      return;
    }
    let cancelled = false;
    fetchDepositAccounts({ accountId: viewingId, perPage: 1, depositTypeCd })
      .then((result) => {
        if (!cancelled) setViewing(result.items[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setViewing(null);
      });
    return () => {
      cancelled = true;
    };
  }, [depositTypeCd, items, viewingId]);

  function openCreate() {
    router.push(isTerm ? "/deposits/fd/new" : "/deposits/savings/new");
  }

  function openEdit(item: DepositAccount) {
    if (isTerm || item.isClosed) return;
    router.push(depositAccountHref(item, "edit"));
  }

  function openView(item: DepositAccount) {
    if (isTerm) setViewingId(item.accountId);
    else router.push(depositAccountHref(item));
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <PageToast message={successMessage} />
      <PageToast message={actionError} tone="error" />

      <DepositAccountFilters
        values={filters}
        isHead={isHead}
        branchName={branchName}
        depositTypeCd={depositTypeCd}
        onChange={setFilters}
        onReset={() => {
          const next = {
            ...DEFAULT_SAVINGS_FILTERS,
            branchId: !isHead && branchId != null ? String(branchId) : "",
          };
          setFilters(next);
          setAppliedFilters(next);
          setPage(1);
          setSuccessMessage(null);
        }}
      />

      <DepositAccountTable
        items={items}
        meta={meta}
        page={page}
        pageSize={pageSize}
        loading={loading}
        error={error}
        errorMessage={errorMessage}
        onRetry={() => setReloadKey((key) => key + 1)}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onView={openView}
        onEdit={openEdit}
        onToggle={actions.openToggle}
        onStatus={actions.openStatus}
        onCloseAccount={actions.openClose}
        onOpen={openCreate}
        variant={variant}
        headerActions={
          <Button type="button" icon={Plus} onClick={openCreate}>
            {isTerm ? tTerm("openAccount") : t("openAccount")}
          </Button>
        }
      />

      {isTerm ? (
        <DepositAccountViewModal account={viewing} onClose={() => setViewingId(null)} />
      ) : null}

      {actions.dialogs}
    </div>
  );
}
