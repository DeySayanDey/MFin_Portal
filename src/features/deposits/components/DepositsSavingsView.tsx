"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { useRouter } from "@/i18n/navigation";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { DepositAccountCloseModal } from "@/features/deposits/savings/components/DepositAccountCloseModal";
import { DepositAccountFilters } from "@/features/deposits/savings/components/DepositAccountFilters";
import { DepositAccountStatusModal } from "@/features/deposits/savings/components/DepositAccountStatusModal";
import { DepositAccountTable } from "@/features/deposits/savings/components/DepositAccountTable";
import { DepositAccountViewModal } from "@/features/deposits/savings/components/DepositAccountViewModal";
import { SAVINGS_DEPOSIT_TYPE } from "@/features/deposits/savings/deposit-account.constants";
import { mapApiMessageToField } from "@/features/deposits/savings/deposit-account.rules";
import {
  DEFAULT_SAVINGS_FILTERS,
  savingsFiltersEqual,
  savingsFiltersFromQuery,
  writeSavingsFilters,
  type SavingsAccountFilters,
} from "@/features/deposits/savings/savings-filters";
import {
  changeDepositAccountStatus,
  closeDepositAccount,
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
  const tErrors = useTranslations("errors");
  const router = useRouter();
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
  const [viewingId, setViewingId] = useState<number | null>(initialAccountId);
  const [viewing, setViewing] = useState<DepositAccount | null>(null);
  const [statusTarget, setStatusTarget] = useState<DepositAccount | null>(null);
  const [closeTarget, setCloseTarget] = useState<DepositAccount | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useToastText();
  const [actionError, setActionError] = useToastText();

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
      const accountParam = params.get("account_id");
      setViewingId(accountParam ? Number(accountParam) : null);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

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

  function errorText(err: unknown): string {
    return isDepositAccountClientError(err) ? err.message : tErrors("generic");
  }

  function openCreate() {
    if (variant === "term") return;
    router.push("/deposits/savings/open");
  }

  function openEdit(item: DepositAccount) {
    if (variant === "term" || item.isClosed) return;
    router.push(`/deposits/savings/${item.accountId}/edit`);
  }

  async function handleStatus(statusCd: number) {
    if (!statusTarget) return;
    setSaving(true);
    setStatusError(null);
    try {
      const updated = await changeDepositAccountStatus({
        accountId: statusTarget.accountId,
        statusCd,
      });
      setSuccessMessage(
        t("toast.statusChanged", { status: updated.statusDesc || t("dash") }),
      );
      setStatusTarget(null);
      setReloadKey((key) => key + 1);
    } catch (err) {
      const message = errorText(err);
      if (mapApiMessageToField(message) === "toast") {
        setActionError(message);
        setStatusTarget(null);
        setReloadKey((key) => key + 1);
      } else {
        setStatusError(message);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleClose(input: { closingReason: string; closingDate: string }) {
    if (!closeTarget) return;
    setSaving(true);
    setCloseError(null);
    try {
      const updated = await closeDepositAccount({
        accountId: closeTarget.accountId,
        closingReason: input.closingReason,
        closingDate: input.closingDate,
      });
      setSuccessMessage(t("toast.closed", { applNo: updated.applNo }));
      setCloseTarget(null);
      setReloadKey((key) => key + 1);
    } catch (err) {
      setCloseError(errorText(err));
    } finally {
      setSaving(false);
    }
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
        onView={(row) => setViewingId(row.accountId)}
        onEdit={openEdit}
        onStatus={(row) => {
          setStatusError(null);
          setStatusTarget(row);
        }}
        onCloseAccount={(row) => {
          setCloseError(null);
          setCloseTarget(row);
        }}
        onOpen={openCreate}
        variant={variant}
        headerActions={
          variant === "term" ? undefined : (
          <Button type="button" icon={Plus} onClick={openCreate}>
            {t("openAccount")}
          </Button>
          )
        }
      />

      <DepositAccountViewModal
        account={viewing}
        onClose={() => setViewingId(null)}
      />

      <DepositAccountStatusModal
        account={statusTarget}
        saving={saving}
        errorMessage={statusError}
        onClose={() => {
          if (saving) return;
          setStatusTarget(null);
          setStatusError(null);
        }}
        onConfirm={handleStatus}
      />

      <DepositAccountCloseModal
        account={closeTarget}
        saving={saving}
        errorMessage={closeError}
        onClose={() => {
          if (saving) return;
          setCloseTarget(null);
          setCloseError(null);
        }}
        onConfirm={handleClose}
      />
    </div>
  );
}
